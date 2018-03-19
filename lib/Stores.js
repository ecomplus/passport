'use strict'

// log on files
const logger = require('./Logger.js')

// Node raw HTTP module
const http = require('http')

// Store API
let host
let baseUri
let port

function callApi (endpoint, callback) {
  let options = {
    hostname: host,
    path: baseUri + endpoint
  }
  if (port) {
    options.port = port
  }

  http.get(options, (res) => {
    if (res.statusCode === 200) {
      let rawData = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        // OK
        let parsedData
        try {
          parsedData = JSON.parse(rawData)
          callback(parsedData)
        } catch (e) {
          logger.error(e)
        }
      })
    }
  }).on('error', (e) => {
    logger.error(e)
  })
}

function listStores (callback, Stores = [], page = 0) {
  // list store IDs from E-Com Plus Main API
  let maxResults = 300
  let endpoint = 'stores.json' +
    '?offset=' + (page * maxResults) +
    '&limit=' + maxResults +
    '&fields=id'

  callApi(endpoint, (data) => {
    // 200 OK
    if (typeof data === 'object' && data !== null && Array.isArray(data.result)) {
      let stores = data.result
      Stores.concat(stores)
      if (stores.length === maxResults) {
        // next page
        listStores(callback, Stores, page + 1)
      } else {
        callback(Stores)
      }
    }
  })
}

module.exports = {
  'setApi': (_host, _baseUri, _port) => {
    // config REST API
    host = _host
    if (!_baseUri) {
      // current Main API version
      baseUri = '/api/v1/'
    } else {
      baseUri = _baseUri
    }
    port = _port
  },

  'list': (callback) => {
    listStores(callback)
  }
}
