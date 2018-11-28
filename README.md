# validate.js-express

## Description
Javascript object validation &amp; Express middleware based on [validate.js](http://validatejs.org/).

## Usage

### Installation
```
npm i -S validate.js-express
```

### Documentation
In addition to this README.md you can find the API documentation in `docs/api.md`.

### Basic Validation
All of validate.js functionality is present. You can access any of its validation
functions as specified in their [documentation](http://validatejs.org/).

Example:
```javascript
let validate = require("validate.js-express")  // extensions are available, but the validate.js interface
                                               // is otherwise untouched

let constraints = {
    password: {
        presence: true,
        length: {
            minimum: 6,
            message: "must be at least 6 characters"
        }
    }
}
validate({ password: "bad" }, constraints)
// => { "password": [ "Password must be at least 6 characters" ] }
```

### Validation Middleware
We extended validate.js to enable validation as Express/Connect middleware. First you need
to set a validation schema:
```javascript

// a schema is nothing more than validate.js constraints defined under a key representing their
// source in the request object
const schema = {
    // req.params
    path: {
        id: { presence: true }
    },

    // req.query
    query: {
        // constraints...
    },

    // req.body
    body: {
        // constraints...
    }
}
```

Add the validation to your route handler:
```javascript
router.get('/', validate.middleware(schema), (req, res) => {
    // route handler logic...
})
```

If a validation error occurs a `400` response will be sent with the validate.js error object
as the JSON body.


### Custom Validators
We extended validate.js with a convenience function to add custom validators. This is
compatible with the method described in validate.js documentation. Either can be used and
even intermixed.
```javascript
const constants = {
    latitude: {
        min: -90,
        max: 90
    }
}

// The first argument is the validator name and will become the constraint key. The second
// argument is a validator function with the same signature described in validate.js documentation.
validate.registerValidator('latitude', (value, options, key, attributes) => {
    let numeric = _.toNumber(value)
    if (_.isNaN(numeric))
        return 'is not a number or numeric string'

    if (numeric < constants.latitude.min || numeric > constants.latitude.max)
        return 'must be between (inclusive) -90 to 90'

    // validation success
    return null
})
```

A constraint using this schema would look like:
```javascript
const constraint = {
    foo: {
        latitude: true  // the name in the register function becomes the constraint key
    }
}
```

### Custom Error Formatting
If you want to modify the default validate.js error object returned in the response:
```javascript
validate.registerErrorFormatter(errors => {
    // errors: {foo: ["Foo is totally wrong"]}

    let formattedErrors = // ... process the error object or completely overwrite it

    return formattedErrors
})
```

## Test
To run the unit tests:
```
yarn test
```
