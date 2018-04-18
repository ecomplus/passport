'use strict'

// log on files
// const logger = require('./../lib/Logger.js')
// authentication with jwt
const auth = require('./../lib/Auth.js')

module.exports = (app, baseUri) => {
  // complete base URI
  baseUri = baseUri + ':store/api'

  app.use(baseUri + '/*', (req, res, next) => {
    // authenticate
    let accessToken = req.get('X-Access-Token')
    let customerId = req.get('X-My-ID')
    let storeId = req.params.store

    if (accessToken && customerId) {
      // check token
      let Auth = auth.validate(customerId, storeId, accessToken)
      if (Auth === true) {
        // authenticated
        // continue
        next()
      } else {
        // unauthorized
        res.status(401).json({
          'status': 401,
          'error_code': 800 + Auth.error,
          'error': Auth.message
        })
      }
    } else {
      // forbidden
      res.status(403).json({
        'status': 403,
        'error_code': 800,
        'error': 'It is necessary to provide valid customer ID (X-My-ID) and token (X-Access-Token)'
      })
    }
  })

  app.use(baseUri + '/me.json', (req, res) => {
    // customer resource
  })

  app.use(baseUri + '/:resource/:id.json', (req, res, next) => {
    // treat API endpoints
    switch (req.params.resource) {
      case 'me':
        // customer resource
        break
      case 'cart':
      case 'order':
        break
      default:
        next()
    }
  })
}
