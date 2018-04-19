'use strict'

// log on files
// const logger = require('./../lib/Logger.js')
// authentication with jwt
const auth = require('./../lib/Auth.js')
// methods to Store API
const api = require('./../lib/Api.js')

const sendError = (res, status, code, msg) => {
  // error response
  res.status(status).json({
    'status': status,
    'error_code': code,
    'message': msg
  })
}

const Callback = (res) => {
  // api requests callback
  return (err, body, errMsg) => {
    if (!err) {
      switch (body) {
        case true:
          // resource modified
          // response with no content
          res.status(204).end()
          break

        case false:
          // unauthorized
          sendError(res, 401, 1100, 'Unauthorized, customer is not related with this object')
          break

        default:
          // response with JSON object
          res.json(body)
      }
    } else if (errMsg) {
      // pass error exposed by Store API
      sendError(res, 400, 1300, errMsg.en_us)
    } else {
      sendError(res, 500, 1200, 'Internal error, try again later')
    }
  }
}

module.exports = (app, baseUri) => {
  // complete base URI
  baseUri = baseUri + ':store/api'

  app.use(baseUri + '/*.json', (req, res, next) => {
    // check request body
    if (req.body && (typeof req.body !== 'object' || Array.isArray(req.body))) {
      // invalid body
      let errMsg = 'Not acceptable, body content must be a valid JSON object'
      sendError(res, 406, 799, errMsg)
      return
    }

    // authenticate
    let accessToken = req.get('X-Access-Token')
    let customerId = req.get('X-My-ID')
    let storeId = parseInt(req.params.store, 10)

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
        sendError(res, 401, 800 + Auth.error, Auth.message)
      }
    } else {
      // forbidden
      let errMsg = 'It is necessary to provide valid customer ID (X-My-ID) and token (X-Access-Token)'
      sendError(res, 403, 800, errMsg)
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
        sendError(res, 405, 1401, 'Method not allowed, you can only read (GET) and edit (PATCH)')
    }
  })

  app.use(baseUri + '/:resource(/:id(/:subresource(/:subid(/:third)?)?)?)?.json', (req, res) => {
    // treat API endpoints
    switch (req.params.resource) {
      case 'carts':
      case 'orders':
        let endpoint
        if (!req.params.subresource) {
          if (req.method !== 'DELETE') {
            endpoint = null
          } else {
            sendError(res, 405, 1505, 'Method not allowed, you cannot delete resources here')
            return
          }
        } else {
          endpoint = req.params.endpoint
        }
        // pass request to Store API
        api.crud(
          req.params.store,
          req.customer,
          req.method,
          req.params.resource,
          req.params.id,
          endpoint,
          req.body,
          Callback(res)
        )
        break

      default:
        sendError(res, 404, 1504, 'Not found, invalid API resource')
    }
  })
}
