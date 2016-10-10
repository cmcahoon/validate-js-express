'use strict'

let chai = require('chai'),
    expect = chai.expect
let chaiAsPromised = require('chai-as-promised')
let sinon = require('sinon')

const _ = require('lodash')
let moment = require('moment')
let validate = require('../../index.js')

chai.use(chaiAsPromised)


describe('extending validate.js', function() {

    /**
     * Extending another library is tricky business. There is no way I'm going
     * to be able to test every piece of functionality. This is just a general
     * sanity check.
     */
    it('should provide access to documented validate.js functions', function() {
        expect(validate.capitalize('foobar')).to.eql('Foobar')
    })

})


describe('datetime extension', function() {

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


describe('custom validator extension', function() {

    it('should allow registration of a custom validator', function() {
        let validateClone = _.cloneDeep(validate)  // don't modify up the `validate` object

        validateClone.registerValidator('bar', (value, options, key, attributes) => {
            if (options === true) {
                if (value != 'bar') return 'must be bar'
            }

            return null // sucess
        })

        // due to the cloning the structure changed -- validate() must be explictly called
        let result = validateClone.validate({ foo: 'bar' }, {
            foo: { bar: true }
        })
        expect(result).to.be.undefined

        result = validateClone.validate({ foo: 'foo' }, {
            foo: { bar: true }
        })
        expect(result).to.have.property('foo')
        expect(result.foo).to.have.lengthOf(1)
        expect(result.foo[0]).to.match(/must be bar/)

        result = validateClone.validate({ foo: 'foo' }, {
            foo: { bar: false }
        })
        expect(result).to.be.undefined
    })

})


describe('express middleware', function() {

    class Response {
        status(code) { return this }
        json(responseData) { return }
    }


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

    it('should throw an error if the schema has unsupported constraints', function() {
        let fn = () => validate.middleware({
            foo: {
                bar: { presence: true }
            }
        })

        expect(fn).to.throw(/unsupported keys/)
    })

    it('should call the next callback if validation succeeds', function() {
        let nextSpy = sinon.spy()

        let middlewareFn = validate.middleware({
            path: {
                foo: { presence: true }
            }
        })

        middlewareFn({ params: { foo: 'bar' } }, undefined, nextSpy)

        expect(nextSpy.calledOnce).to.be.true
    })

    it('should send a 400 error if validation fails', function() {
        let res = new Response()
        let resMock = sinon.mock(res)
        resMock.expects('status').once().withArgs(400).returns(res)
        resMock.expects('json').once() // TODO: validate the error message

        let nextSpy = sinon.spy()

        let middlewareFn = validate.middleware({
            path: {
                foo: { presence: true }
            }
        })

        middlewareFn({ params: { bar: 'foo' } }, res, nextSpy)

        resMock.verify()
        expect(nextSpy.called).to.be.false
    })

    it('should use custom error formatter function if provided', function() {
        let res = new Response()
        let resMock = sinon.mock(res)
        resMock.expects('status').once().withArgs(400).returns(res)
        resMock.expects('json').once().withArgs('custom error format')

        let nextSpy = sinon.spy()

        validate.registerErrorFormatter(() => 'custom error format')

        let middlewareFn = validate.middleware({
            path: {
                foo: { presence: true }
            }
        })

        middlewareFn({ params: { bar: 'foo' } }, res, nextSpy)

        resMock.verify()
        expect(nextSpy.called).to.be.false
    })

})
