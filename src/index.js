// ISC License
// Copyright (c) 2016, Charles Cahoon
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

'use strict'

const _ = require('lodash')
let moment = require('moment')
let validate = require('validate.js')


/**
 * @private
 *
 * validate.js needs a little help working with datetimes -- moment.js does the
 * trick.
 */
validate.extend(validate.validators.datetime, {

    /**
     * @private
     *
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
        let parsed = moment.utc(value)
        return parsed.isValid() ? +parsed : NaN
    },

    /**
     * @private
     *
     * format - format a datetime string
     *
     * @param  {number} value   unix timestamp
     * @param  {Object} options constraint options
     * @return {string} formatted timestamp
     */
    format: function(value, options) {
        if (options.dateOnly)
        return moment.utc(value).format('YYYY-MM-DD')
        return moment.utc(value).toISOString()
    }

})


validate.extend(validate, {

    /**
     * validate.js doesn't provide express middleware -- we are extending it to
     * provide that functionality.
     *
     * @param {Object} schema validation schema
     * @param {middleware~errorFormatter} errorFormatter Function to format errors
     * @return {middleware~generatedFn} express middleware function
     */
    middleware: (schema) => {
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


        /**
         * Express middleware function that performs request validation based
         * on a schema.
         * @name middleware~generatedFn
         * @param {Object} req
         * @param {Object} res
         * @param {Object} next
         */
        return (req, res, next) => {
            let errors = _({})
            .merge(validate(req.params, schema.path))
            .merge(validate(req.query, schema.query))
            .merge(validate(req.body, schema.body))
            .value()

            if (validate.errorFormatter !== undefined) {
                errors = validate.errorFormatter(errors)
            }
            _.isEmpty(errors) ? next() : res.status(400).json(errors)
        }
    },

    /**
     * A helper function to register an error formatter.
     *
     * @param {middleware~errorFormatter} formatFn error formatter function
     */
    registerErrorFormatter: (formatFn) => {
        if (formatFn !== undefined && !_.isFunction(formatFn))
        throw new Error('error formatter must be a function')

        validate.extend(validate, { errorFormatter: formatFn })
    },

    /**
     * Format validation errors found in the middleware.
     *
     * @callback middleware~errorFormatter
     *
     * @param {Object} errors validate.js error object
     * @return {Object} formatted error object or string
     */

    /**
     * A helper function to register new custom validators.
     *
     * @param {String} name validate name -- will also be used as the constraint key
     * @param {registerValidator~validatorFn} validatorFn validation function
     */
    registerValidator: (name, validatorFn) => {
        let validator = {}
        validator[name] = validatorFn

        validate.extend(validate.validators, validator)
    }

    /**
     * This function signature is the same expected for validate.js custom validators.
     *
     * @callback registerValidator~validatorFn
     *
     * @param {String} value value as specified in the constraint
     * @param {Object} options options as specified in the constraint
     * @param {String} key constraint name
     * @param {Object} attributes full constraint object
     * @return null | undefined if successful, otherwise a string or array of strings
     *         containing the error messages
    */
})


module.exports = validate
