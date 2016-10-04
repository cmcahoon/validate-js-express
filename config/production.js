'use strict'

let _ = require('lodash')

// THIS IS A PRODUCTION CONFIGURATION.
//
// It should be static. Only settings you might want to change on a live
// deployment should be overwritten by the .env environment, e.g., log level.
//
module.exports = {
    // logging settings
    log: {
        name: 'js-validate',
        level: _.get(process.env, 'LOG_LEVEL', 'info')
    }
}
