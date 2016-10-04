'use strict'

// This module will provide a configuration object after following these steps:
//
// 1) Load the properties in .env to the `process.env` object. See
//    https://www.npmjs.com/package/dotenv for more info.
// 2) Load configuration from file based on the NODE_ENV environment variable.
//    See https://www.npmjs.com/package/config-node for more info.
//
// You will have to specify what configuration properties to overwrite from the
// environment in the configuration files. When this is all done the module will
// return a configuration object.

let _ = require('lodash')
let bunyan = require('bunyan')

// load configuration overrides from the .env file
require('dotenv').config({ silent: true })

// load configuration from files
let config = require('config-node')()

// General settings that apply to all environments (but can be overridden).
let generalSettings = {
    env: process.env.NODE_ENV || 'development'
}

let settings = _.merge(generalSettings, _.omitBy(config, _.isFunction))

// create a logger
let logger = bunyan.createLogger({ name: 'bootstrap' })
logger.info({ config: settings }, 'loaded configuration')

// export the configuration object
module.exports = settings
