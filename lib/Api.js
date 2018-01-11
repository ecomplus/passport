'use strict'

// log on files
const logger = require('./Logger.js')

// Node raw HTTP module with https protocol
const https = require('https')

// Store API
let host
let baseUri
let port

module.exports = {
  'setApi': (_host, _baseUri, _port) => {
    // config REST API
    host = _host
    if (!_baseUri) {
      // current Store API version
      baseUri = '/v1/'
    } else {
      baseUri = _baseUri
    }
    port = _port
  },

  'findCustomer': (storeId, provider, userId, callback) => {
    // https://ecomstore.docs.apiary.io/#reference/customers/all-customers/find-customers
    let options = {
      hostname: host,
      path: baseUri + 'customers.json?oauth_providers.user_id=' + userId + '&fields=oauth_providers',
      method: 'GET',
      headers: {
        'X-Store-ID': storeId
      }
    }
    if (port) {
      options.port = port
    }

    let req = https.request(options, (res) => {
      let rawData = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        let parsedData
        try {
          parsedData = JSON.parse(rawData)
        } catch (e) {
          logger.error(e)
          // callback without user
          callback(e, null)
          return
        }

        switch (res.statusCode) {
          case 200:
            // OK
            if (typeof parsedData === 'object' && parsedData !== null && Array.isArray(parsedData.result)) {
              let customers = parsedData.result
              if (customers.length > 0) {
                // found
                for (let i = 0; i < customers.length; i++) {
                  // check oauth provider
                  let providers = customers[i].oauth_providers
                  for (let i = 0; i < providers.length; i++) {
                    if (providers[i].provider === provider && providers[i].provider === userId) {
                      // logged
                      // callback with customer ID
                      callback(null, customers[i]._id)
                      return
                    }
                  }
                }
              }
              // not found
              callback()
            }
            break

          case 412:
            // no store found with provided ID
            callback()
            break

          default:
            // unexpected status code
            let str = 'Unexpected response status code from Store API' +
              '\nStatus: ' + res.statusCode +
              '\nResponse: ' + rawData
            let err = new Error(str)
            logger.error(err)
            callback(err, null)
        }
      })
    })

    req.on('error', (e) => {
      logger.error(e)
    })

    req.end()
  },

  'createCustomer': (storeId, profile, callback) => {
    // https://ecomstore.docs.apiary.io/#reference/customers/new-customer
    let options = {
      hostname: host,
      path: baseUri + 'customers.json',
      method: 'POST',
      headers: {
        'X-Store-ID': storeId
      }
    }
    if (port) {
      options.port = port
    }

    let body = {}

    let req = https.request(options, (res) => {
      let rawData = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        /*
        let parsedData
        try {
          parsedData = JSON.parse(rawData)
        } catch (e) {
          logger.error(e)
          // callback without user
          callback(e, null)
          return
        }
        */

        switch (res.statusCode) {
          case 201:
            // created
            callback(null, 0)
            break

          case 412:
            // no store found with provided ID
            callback(null, 0)
            break

          default:
            // unexpected status code
            let str = 'Unexpected response status code from Store API' +
              '\nStatus: ' + res.statusCode +
              '\nResponse: ' + rawData
            let err = new Error(str)
            logger.error(err)
            callback(err, null)
        }
      })
    })

    req.on('error', (e) => {
      logger.error(e)
    })

    // write data to request body
    req.write(JSON.stringify(body))
    req.end()
  }
}
