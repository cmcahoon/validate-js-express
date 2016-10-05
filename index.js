'use strict'

const _ = require('lodash')
let moment = require('moment')
let validate = require('validate.js').validate


validate.extend(validate.validators.datetime, {

    /**
     * parse - parse a datetime string
     *
     * validate.js guarantees that `value` will be defined and not null, but
     * otherwise could be anything.
     *
     * @param  {string} value   datetime string to parse
     * @param  {Object} options constraint options
     * @return {number} unix timestamp (utc) represented by the string
     */
    parse: function(value, options) {
        return +moment.utc(value)
    },


    /**
     * format - format a datetime string
     *
     * @param  {number} value   unix timestamp
     * @param  {Object} options constraint options
     * @return {string} formatted timestamp
     */
    format: function(value, options) {
        return moment.utc(value).toISOString()
    }

})


function expressValidate(schema) {
    // NOTE: This particular guard (isPlainObject) could potentially be too
    // strict. What we are looking for is an object with keys, not an array,
    // function, or any of the other types JS labels as objects. This check will
    // look for an object that has `prototype === null`.
    if (!_.isPlainObject(schema))
        throw new Error('validation schema must be an object')

    if (_.isEmpty(schema))
        throw new Error('validation schema cannot be empty/undefined')

    // NOTE: This guard could be seen as too strict and easily removed without
    // damaging the integrity of the subsequent code paths. The reasons I put
    // this check in place is because the most common issue with passing objects
    // as parameters is small typos. With this check, if someone calls it with
    // 'paths' instead of 'path' they will get an error. Without the check
    // the code below will ignore 'paths' and they will not know validation
    // was being skipped.
    if (!_(schema).omit(['path', 'query', 'body']).isEmpty())
        throw new Error('validation schema had unsupported keys')

    // return the middleware function
    return (req, res, next) => {
        let errors = _({})
            .merge(validate(req.params, schema.path))
            .merge(validate(req.query, schema.query))
            .merge(validate(req.body, schema.body))
            .value()

        // TODO: create ability to provide error formatter
        _.isEmpty(errors) ? next() : res.status(400).json(errors)
    }

}

module.exports = {
    middleware: {
        validate: expressValidate
    }
}
