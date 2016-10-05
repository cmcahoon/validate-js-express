'use strict'

let chai = require('chai'),
    expect = chai.expect
let chaiAsPromised = require('chai-as-promised')
let sinon = require('sinon')

let moment = require('moment')

chai.use(chaiAsPromised)


class MockResponse {

    constructor() {
        this.status = sinon.stub().returns(this)
        this.json = sinon.spy()
    }

}


describe('extending validate.js', function() {

    let validate = require('../../index.js')

    /**
     * Extending another library is tricky business. There is no way I'm going
     * to be able to test every piece of functionality. This is just a general
     * sanity check.
     */
    it('should provide access to documented validate.js functions', function() {
        expect(validate.capitalize('foobar')).to.eql('Foobar')
    })

    it('should throw an error if an invalid date is provided', function() {
        let result = validate({ bad: 'not a date' }, {
            bad: { datetime: true }
        })
        expect(result).to.have.property('bad')
        expect(result.bad).to.have.lengthOf(1)
        expect(result.bad[0]).to.match(/must be a valid date/)
    })

    it('should format datetimes using ISO 8601', function() {
        let timeA = moment('2016-01-01 00:00:00.000Z')  // constraint
        let timeB = '2015-01-01 00:00:00.000Z' // 1 year earlier than timeA

        let result = validate({ bad: timeB }, {
            bad: {
                datetime: {
                    earliest: timeA.utc()
                }
            }
        })
        expect(result).to.have.property('bad')
        expect(result.bad).to.have.lengthOf(1)
        expect(result.bad[0]).to.match(/must be no earlier than 2016-01-01T00:00:00\.000Z/)
    })

    it('should format dates (no time component) using ISO 8601', function() {
        let timeA = moment('2016-01-01')  // constraint
        let timeB = '2015-01-01' // 1 year earlier than timeA

        let result = validate({ bad: timeB }, {
            bad: {
                datetime: {
                    dateOnly: true,
                    earliest: timeA.utc()
                }
            }
        })
        expect(result).to.have.property('bad')
        expect(result.bad).to.have.lengthOf(1)
        expect(result.bad[0]).to.match(/must be no earlier than 2016-01-01/)
    })

    it('should honor the datetime.dateOnly constraint', function() {
        let time = '2015-01-01 01:00:00.000Z' // date has time associated with it

        let result = validate({ bad: time }, {
            bad: {
                datetime: {
                    dateOnly: true
                }
            }
        })
        expect(result).to.have.property('bad')
        expect(result.bad).to.have.lengthOf(1)
        expect(result.bad[0]).to.match(/must be a valid date/)
    })
})


describe('express middleware', function() {

    let validate = require('../../index.js')

    it('should throw an error if the schema is undefined', function() {
        let fn = () => validate.middleware()
        expect(fn).to.throw(/must be an object/)
    })

    it('should throw an error if the schema is empty', function() {
        let fn = () => validate.middleware({})
        expect(fn).to.throw(/empty\/undefined/)
    })

    it('should throw an error if the schema is not an object', function() {
        let fnArray = () => validate.middleware([])
        let fnNumber = () => validate.middleware(42)

        expect(fnArray).to.throw(/must be an object/)
        expect(fnNumber).to.throw(/must be an object/)
    })

    it('should throw an error if the schema has unsupported keys', function() {
        let fn = () => validate.middleware({
            foo: {
                bar: { presence: true }
            }
        })

        expect(fn).to.throw(/unsupported keys/)
    })

    // TODO: expand this test
    it('should return validate.js errors', function() {
        const schema = {
            path: {
                id: {
                    presence: true,
                    numericality: true
                }
            }
        }

        let req = {
            params: {
                id: "string"
            }
        }

        let res = new MockResponse()

        // generate the middleware function
        let fn = validate.middleware(schema)
        fn(req, res, undefined)

        expect(res.status.calledOnce).to.be.true
        expect(res.status.args[0]).to.eql([ 400 ])
        expect(res.json.calledOnce).to.be.true
    })

    // TODO: expand/break up this test
    it('should support iso-8601 date strings', function() {
        const schema = {
            path: {
                date: {
                    presence: true,
                    datetime: {
                        earliest: moment('2016-01-01 00:00:00.000').utc(),
                    }
                }
            }
        }

        let req = {
            params: {
                date: moment().utc()
            }
        }

        let next = sinon.spy()

        // generate the middleware function
        let fn = validate.middleware(schema)
        fn(req, undefined, next)

        expect(next.calledOnce).to.be.true
    })

})
