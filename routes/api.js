'use strict'

// log on files
// const logger = require('./../lib/Logger.js')
// authentication with jwt
const auth = require('./../lib/Auth.js')
// methods to Store API
const api = require('./../lib/Api.js')

const Callback = (res) => {
  // api requests callback
  return (err, body) => {
    if (!err) {
      switch (body) {
        case true:
          // resource modified
          // response with no content
          res.status(204).end()
          break

        case false:
          // unauthorized
          res.status(401).json({
            'status': 401,
            'error_code': 1100,
            'message': 'Unauthorized, customer is not related with this object'
          })
          break

        default:
          // response with JSON object
          res.json(body)
      }
    } else {
      res.status(500).json({
        'status': 500,
        'error_code': 1200,
        'message': 'Internal error, try again later'
      })
    }
  }
}

module.exports = (app, baseUri) => {
  // complete base URI
  baseUri = baseUri + ':store/api'

  app.use(baseUri + '/*.json', (req, res, next) => {
    // authenticate
    let accessToken = req.get('X-Access-Token')
    let customerId = req.get('X-My-ID')
    let storeId = req.params.store

    if (accessToken && customerId) {
      // check token
      let Auth = auth.validate(customerId, storeId, accessToken)
      if (Auth === true) {
        // authenticated
        req.customer = customerId
        // continue
        next()
      } else {
        // unauthorized
        res.status(401).json({
          'status': 401,
          'error_code': 800 + Auth.error,
          'message': Auth.message
        })
      }
    } else {
      // forbidden
      res.status(403).json({
        'status': 403,
        'error_code': 800,
        'message': 'It is necessary to provide valid customer ID (X-My-ID) and token (X-Access-Token)'
      })
    }
  })

  app.use(baseUri + '/me.json', (req, res) => {
    // customer resource
    switch (req.method) {
      case 'GET':
        // returns customer object
        api.readCustomer(req.params.store, req.customer, Callback(res))
        break

      case 'PATCH':
        // modify customer
        // pass request body
        api.updateCustomer(req.params.store, req.customer, req.body, Callback(res))
        break

      default:
        res.status(405).json({
          'status': 405,
          'error_code': 1401,
          'message': 'Method not allowed, you can only read (GET) and edit (PATCH)'
        })
    }
  })

  app.use(baseUri + '/:resource/:id(/:subresource(/:subid(/:third)?)?)?.json', (req, res) => {
    // treat API endpoints
    switch (req.params.resource) {
      case 'carts':
      case 'orders':
        res.json({
          'status': 200
        })
        break

      default:
        res.status(404).json({
          'status': 404,
          'error_code': 1104,
          'message': 'Not found, invalid API resource'
        })
    }
  })
}
