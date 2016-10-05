'use strict'

const _ = require('lodash')
let registerValidator = require('./index.js').registerValidator


const constants = {
    latitude: {
        min: -90,
        max: 90
    },
    longitude: {
        min: -180,
        max: 180
    }
}


/**
 * Custom validator for latitude.
 */
registerValidator('latitude', (value, options, key, attributes) => {
    let numeric = _.toNumber(value)
    if (_.isNaN(numeric))
        return 'is not a number or numeric string'

    if (numeric < constants.latitude.min || numeric > constants.latitude.max)
        return 'must be between (inclusive) -90 to 90'

    // validation success
    return null
})

/**
 * Custom validator for longitude.
 */
registerValidator('longitude', (value, options, key, attributes) => {
    let numeric = _.toNumber(value)
    if (_.isNaN(numeric))
        return 'is not a number or numeric string'

    if (numeric < constants.longitude.min || numeric > constants.longitude.max)
        return 'must be between (inclusive) -180 to 180'

    // validation success
    return null
})
