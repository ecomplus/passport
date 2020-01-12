'use strict'

// log on files
// const logger = require('./../lib/Logger.js')
// authentication with jwt
const auth = require('./../lib/Auth.js')
// methods to Store API
const api = require('./../lib/Api.js')

const sendError = (res, status, code, message) => {
  // error response
  res.status(status).json({
    status,
    error_code: code,
    message
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
          errMsg = 'Prohibited endpoint or customer not related with respective object'
          sendError(res, 401, 1100, errMsg)
          break

        default:
          // response with JSON object
          res.json(body)
      }
    } else if (errMsg) {
      // pass error exposed by Store API
      sendError(res, err.statusCode || 400, 1300, errMsg.en_us)
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
      const errMsg = 'Not acceptable, body content must be a valid JSON object'
      sendError(res, 406, 799, errMsg)
      return
    }

    // authenticate
    const accessToken = req.get('X-Access-Token')
    const customerId = req.get('X-My-ID')
    const storeId = parseInt(req.params.store, 10)
    // preset auth level 0
    req.authLevel = 0

    if (accessToken && customerId) {
      // check token
      const authLevel = auth.validate(customerId, storeId, accessToken)
      if (typeof authLevel === 'number' && authLevel > 0) {
        // authenticated
        // check authorization level by request method
        let authorized = false
        if (req.originalUrl.endsWith('/me.json')) {
          authorized = authLevel >= 2
        } else {
          switch (req.method.toLowerCase()) {
            case 'get':
            case 'post':
              authorized = authLevel >= 2
              break
            case 'patch':
            case 'put':
              authorized = authLevel >= 3
              break
          }
        }

        if (authorized) {
          // save authentication and continue
          req.customer = customerId
          req.authLevel = authLevel
          next()
        } else {
          const errMsg = 'Unauthorized, no permission for this request'
          sendError(res, 401, 1600, errMsg)
        }
      } else {
        // unauthorized
        const { error, message } = authLevel
        sendError(res, 401, 800 + error, message)
      }
    } else {
      // forbidden
      const errMsg = 'It is necessary to provide valid customer ID (X-My-ID) and token (X-Access-Token)'
      sendError(res, 403, 800, errMsg)
    }
  })

  app.use(baseUri + '/me.json', (req, res) => {
    // customer resource
    switch (req.method.toLowerCase()) {
      case 'get':
        // returns customer object
        api.readCustomer(req.params.store, req.customer, Callback(res))
        break
      case 'patch':
        // modify customer
        // pass request body
        api.updateCustomer(req.params.store, req.customer, req.body, Callback(res))
        break
      default:
        sendError(res, 405, 1401, 'Method not allowed, you can only read (GET) and edit (PATCH)')
    }
  })

  app.use(baseUri + '/:resource([^/]+)(/:id)?(/:path)?.json', (req, res) => {
    // treat API endpoints
    let endpoint
    switch (req.params.resource) {
      case 'carts':
      case 'orders':
        if (!req.params.path) {
          if (req.method !== 'DELETE') {
            endpoint = null
          } else {
            sendError(res, 405, 1505, 'Method not allowed, you cannot delete resources here')
            return
          }
        } else {
          // mount endpoint parts
          endpoint = req.params.resource
          ;['id', 'path'].forEach(param => {
            if (req.params[param]) {
              endpoint += '/' + req.params[param]
            }
          })
          endpoint += '.json'
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
