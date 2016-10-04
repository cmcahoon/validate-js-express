'use strict'

let _ = require('lodash')

// THIS IS A DEVELOPMENT CONFIGURATION.
//
// You should allow each setting to be overridden by the .env environment.
//
module.exports = {
    // logging settings
    log: {
        name: _.get(process.env, 'LOG_NAME', 'js-validate'),
        level: _.get(process.env, 'LOG_LEVEL', 'debug')
    }
}
