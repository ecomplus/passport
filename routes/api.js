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
          let errMsg = 'Prohibited endpoint or customer not related with respective object'
          sendError(res, 401, 1100, errMsg)
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

const CallbackCustomers = (res, req) => {
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
          let errMsg = 'Prohibited endpoint or customer not related with respective object'
          sendError(res, 401, 1100, errMsg)
          break

        default:
          let respBody = {}
          switch (req.authLevel) {
            case 0:
              // unauthorized
              let errMsg = 'Prohibited endpoint or customer not related with respective object'
              sendError(res, 401, 1100, errMsg)
              break
            case 1:
              respBody = {
                _id: body._id,
                main_email: body.main_email,
                display_name: body.display_name
              }
              break
            case 2:
              respBody = {
                _id: body._id,
                main_email: body.main_email,
                display_name: body.display_name,
                orders: body.orders
              }
              break
            case 3:
              respBody = body
              break
            default:
              break
          }
          // response with JSON object
          res.json(respBody)
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
      const authLevel = auth.validate(customerId, storeId, accessToken)
      if (typeof authLevel === 'number' && authLevel > 0) {
        // authenticated
        req.customer = customerId
        // save authentication level
        req.authLevel = authLevel
        // continue
        next()
      } else {
        // unauthorized
        const { error, message } = authLevel
        sendError(res, 401, 800 + error, message)
      }
    } else {
      // forbidden
      let errMsg = 'It is necessary to provide valid customer ID (X-My-ID) and token (X-Access-Token)'
      sendError(res, 403, 800, errMsg)
    }
  })

  app.use(baseUri + '/*.json', (req, res, next) => {
    if (req.method === 'PATCH' || req.method === 'POST' || req.method === 'PUT') {
      switch (req.authLevel) {
        case 0:
        case 1:
          let errMsg = 'Unauthorized, need permission'
          sendError(res, 401, null, errMsg)
          break
        case 2:
        case 3:
          next()
          break
        default: break
      }
    } else {
      next()
    }
  })

  app.use(baseUri + '/me.json', (req, res) => {
    // customer resource
    switch (req.method) {
      case 'GET':
        // returns customer object
        api.readCustomer(req.params.store, req.customer, CallbackCustomers(res, req))
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

  app.use(baseUri + '/:resource([^/]+)(/:id)?(/:path)?.json', (req, res) => {
    // treat API endpoints
    switch (req.params.resource) {
      case 'carts':
      case 'orders':
        let endpoint
        if (!req.params.path) {
          if (req.method !== 'DELETE') {
            endpoint = null
          } else {
            sendError(res, 405, 1505, 'Method not allowed, you cannot delete resources here')
            return
          }
        } else {
          // mount endpoint parts
          endpoint = req.params.resource + '/' + req.params.id + '/' + req.params.path + '.json'
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
