'use strict'

let chai = require('chai'),
    expect = chai.expect
let chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)


describe("Example Tests", function(){

    let exampleModule = {}

    before(function(){
        exampleModule = { // Initialize test state here.
            state: true,
            promExample: () => 'promise'
        }
    })

    after(function(){}) // Clean up after your tests here.

    beforeEach(function(){}) // Reset state before each test.

    afterEach(function(){}) // Clean up after each test.

    describe("#exampleFunction", function(){

        it("creates a scaffolded test that states an expectation.")

        it("state set to true.", function(){
            expect(exampleModule.state).to.be.true
        })

        it("You MUST over-write this file with real tests!", function(){
            let realTests = 'Real Tests'
            expect(realTests).to.be.true
        })

        // The following demonstrates how to test Promises. It would work if
        // promExample() actually returned a Promise object.
        //
        //it("Promise resolves to 'promise'.", function(done){
        //    expect(exampleModule.promExample()).to.be.fulfilled
        //    .then( res => {
        //        expect(res).to.be.equal('promise')
        //        done()
        //    })
        //})

    })
})
