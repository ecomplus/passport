'use strict'

// log on files
const logger = require('./Logger.js')

// Node raw HTTP module
const http = require('http')

// Store API
let host
let baseUri
let port

function requestEnd(res, rawData, callback, successCallback, passError) {
  switch (res.statusCode) {
    case 201:
    case 200:
      successCallback()
      break

    case 412:
      // no store found with provided ID
      let msg = {
        'en_us': 'Invalid store ID',
        'pt_br': 'ID da loja inválido'
      }
      callback(new Error(msg.en_us), null, msg)
      break

    default:
      if (passError && res.statusCode < 500) {
        // treat and pass API error response
        try {
          let parsedData = JSON.parse(rawData)
          if (parsedData.hasOwnProperty('user_message')) {
            // pass client error
            let msg = parsedData.user_message
            callback(new Error(msg.en_us), null, msg)
            return
          }
        } catch (e) {
          // invalid JSON, continue with default error handling
        }
      }

      // unexpected status code
      let str = 'Unexpected response status code from Store API' +
        '\nStatus: ' + res.statusCode +
        '\nResponse: ' + rawData
      let err = new Error(str)
      logger.error(err)
      callback(err, null)
  }
}

function callApi(endpoint, method, body, storeId, callback, successCallback, passError) {
  let options = {
    hostname: host,
    path: baseUri + endpoint,
    method: method,
    headers: {
      'X-Store-ID': storeId
    }
  }
  if (port) {
    options.port = port
  }

  let payload
  if (body) {
    // fix body first
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {
        body = null
      }
    }
    if (body) {
      // remove staff resource properties
      delete body.hidden_metafields
      delete body.staff_notes
      // do not permit to change customer (itself) on document body
      delete body.customers
      delete body.buyers
      // do not permit to force staff signature
      delete body.staff_signature

      // parse body to string
      payload = JSON.stringify(body)
      // set headers for request body
      options.headers['Content-Length'] = Buffer.byteLength(payload)
      options.headers['Content-Type'] = 'application/json'
    }
  }

  let req = http.request(options, (res) => {
    if (callback !== undefined) {
      let rawData = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        if (res.statusCode === 204) {
          // successful request, no content to treat
          successCallback()
        } else {
          let SuccessCallback = () => {
            // OK
            let parsedData
            try {
              parsedData = JSON.parse(rawData)
            } catch (e) {
              logger.error(e)
              // callback without user
              callback(e, null)
              return
            }

            // pass parsed JSON
            successCallback(parsedData)
          }

          requestEnd(res, rawData, callback, SuccessCallback, passError)
        }
      })
    } else {
      // consume response data to free up memory
      res.resume()
    }
  })

  req.on('error', (e) => {
    logger.error(e)
  })

  if (payload !== undefined) {
    // write data to request body
    req.write(payload)
  }
  req.end()
}

function readResource(storeId, callback, endpoint, passError) {
  let method = 'GET'
  let successCallback = (body) => {
    // 200 OK
    if (typeof body === 'object' && body !== null) {
      // callback with document body
      // hide staff resource properties
      delete body.hidden_metafields
      delete body.staff_notes
      callback(null, body)
    } else {
      // not found
      callback()
    }
  }

  callApi(endpoint, method, null, storeId, callback, successCallback, passError)
}

// fields returned from customer resource object
// https://ecomstore.docs.apiary.io/#reference/customers/customer-object
const customerFields = '_id,' +
  'oauth_providers,' +
  'locale,' +
  'main_email,' +
  'accepts_marketing,' +
  'display_name,' +
  'birth_date,' +
  'gender,' +
  'photos'

function findCustomer(storeId, provider, userId, verifiedEmail, callback) {
  // https://ecomstore.docs.apiary.io/#reference/customers/all-customers/find-customers
  if (typeof userId === 'number') {
    // should be a string
    userId = userId.toString()
  }
  let endpoint = 'customers.json' +
    '?oauth_providers.user_id=' + userId +
    '&fields=' + customerFields
  let method = 'GET'

  callApi(endpoint, method, null, storeId, callback, (data) => {
    // 200 OK
    if (typeof data === 'object' && data !== null && Array.isArray(data.result)) {
      let customers = data.result
      if (customers.length > 0) {
        // found
        for (let i = 0; i < customers.length; i++) {
          // check oauth provider
          let customer = customers[i]
          let providers = customer.oauth_providers
          for (let i = 0; i < providers.length; i++) {
            if (providers[i].provider === provider && providers[i].user_id === userId) {
              // logged
              // callback with customer info
              callback(null, customer)
              return
            }
          }
        }
      }
    }

    if (verifiedEmail) {
      // try by email
      findCustomerByEmail(storeId, verifiedEmail, null, (err, id, customer) => {
        if (!err && id) {
          // customer found
          // add oauth provider to customer document
          endpoint = 'customers/' + id + '/oauth_providers.json'
          method = 'POST'
          let body = {
            'provider': provider,
            'user_id': userId
          }
          callApi(endpoint, method, body, storeId)
        }

        // pass to callback
        callback(err, customer)
      })
    } else {
      // not found
      callback()
    }
  })
}

function findCustomerByEmail (storeId, email, docNumber, callback) {
  // https://ecomstore.docs.apiary.io/#reference/customers/all-customers/find-customers
  let endpoint = `customers.json?main_email=${email}`

  if (docNumber) {
    endpoint += `&doc_number=${docNumber}`
  }

  endpoint += `&fields=${customerFields}`
  let method = 'GET'
  callApi(endpoint, method, null, storeId, callback, (data) => {
    // 200 OK
    if (typeof data === 'object' && data !== null && Array.isArray(data.result)) {
      let customers = data.result
      if (customers.length === 1) {
        // found
        let customer = customers[0]
        // callback with customer info
        callback(null, customer._id, customer)
        return
      }
    }

    // not found
    callback()
  })
}

function createCustomer(storeId, profile, callback) {
  // https://ecomstore.docs.apiary.io/#reference/customers/new-customer
  let body = {
    // registration not completed
    'state': 'invited',
    // save oauth credentials
    'oauth_providers': [{
      '_id': '100000000000000000000000',
      'provider': profile.provider,
      'user_id': profile.id
    }]
  }

  let sendPost = () => {
    if (!profile.hasOwnProperty('name') || !profile.name.hasOwnProperty('givenName')) {
      if (profile.hasOwnProperty('displayName')) {
        let name = profile.displayName
        if (name.length <= 50) {
          body.display_name = name
        } else {
          // limit number of chars
          body.display_name = name.substring(0, 50)
        }
      } else {
        // random
        body.display_name = 'Name'
      }
    } else {
      // first name
      let name = profile.name.givenName
      body.name = {}

      if (name.length <= 50) {
        body.name.given_name = body.display_name = name
      } else {
        // limit number of chars
        body.display_name = name.substring(0, 50)
        if (name.length <= 70) {
          body.name.given_name = name
        } else {
          body.name.given_name = name.substring(0, 70)
        }
      }

      // optional other names
      if (profile.name.hasOwnProperty('middleName')) {
        // max 255 chars
        // doesn't need to check
        body.name.middle_name = profile.name.middleName
      }
      if (profile.name.hasOwnProperty('familyName')) {
        let name = profile.name.familyName
        if (name.length <= 70) {
          body.name.family_name = name
        } else {
          body.name.family_name = name.substring(0, 70)
        }
      }
    }

    switch (profile.gender) {
      case 'male':
        body.gender = 'm'
        break

      case 'female':
        body.gender = 'f'
        break
    }

    // get photos only from Facebook
    // other providers send default avatar pictures
    if (profile.provider === 'facebook' && Array.isArray(profile.photos) && profile.photos.length > 0) {
      body.photos = []
      for (let i = 0; i < profile.photos.length; i++) {
        body.photos.push(profile.photos[i].value)
      }
    }

    let endpoint = 'customers.json'
    let method = 'POST'

    callApi(endpoint, method, body, storeId, callback, (data) => {
      // 201 created
      if (typeof data === 'object' && data !== null && data._id) {
        // return public user info
        let customer = {
          '_id': data._id,
          'display_name': body.display_name
        }
        if (body.hasOwnProperty('gender')) {
          customer.gender = body.gender
        }

        callback(null, customer)
      } else {
        // not found
        callback()
      }
    })
  }

  if (!Array.isArray(profile.emails) || profile.emails.length === 0) {
    // random
    body.main_email = (100000 + Math.floor((Math.random() * 1000000) + 1)) + '@sample.mail'
    sendPost()
  } else {
    // set first element as main_email
    body.main_email = profile.emails[0].value

    body.emails = []
    for (let i = 0; i < profile.emails.length; i++) {
      let emailObject = {
        'address': profile.emails[i].value,
        // always consider email from social account verified
        'verified': true
      }
      switch (profile.emails[i].type) {
        case 'home':
        case 'work':
          emailObject.type = profile.emails[i].type
          break
      }
      body.emails.push(emailObject)
    }

    // check if there are no customer with the same main email address
    findCustomerByEmail(storeId, body.main_email, null, (err, id, customer) => {
      if (!err) {
        if (!id) {
          // can create customer account
          sendPost()
        } else {
          // there is an account with same main_email
          // message to customer
          let msg = {
            'en_us': 'There is an account with this same email address, ' +
              'please try to login with another social account',
            'pt_br': 'Existe uma conta com este mesmo endereço de e-mail, ' +
              'por favor tente acessar com outra conta social'
          }
          callback(new Error(msg.en_us), null, msg)
        }
      } else {
        callback(err, customer)
      }
    })
  }
}

function modifyCustomer(storeId, customerId, body, callback, method) {
  // common function to update and delete specific customer
  // https://ecomstore.docs.apiary.io/#reference/customers/specific-customer
  let endpoint = 'customers/' + customerId + '.json'
  // pass client error if exists
  let passError = true
  let successCallback = () => {
    // 204 updated
    callback(null, true)
  }

  callApi(endpoint, method, body, storeId, callback, successCallback, passError)
}

function updateCustomer(storeId, customerId, body, callback) {
  let method = 'PATCH'
  // logger.log(body)
  modifyCustomer(storeId, customerId, body, callback, method)
}

function readCustomer(storeId, customerId, callback) {
  // https://ecomstore.docs.apiary.io/#reference/customers/specific-customer/with-authentication
  let endpoint = 'customers/' + customerId + '.json'
  readResource(storeId, callback, endpoint)
}

function readStore(storeId, callback) {
  // https://ecomstore.docs.apiary.io/#reference/stores/your-store/read-your-store
  let endpoint = 'stores/me.json'
  readResource(storeId, callback, endpoint)
}

function crud(storeId, customerId, method, resource, resourceId, endpoint, body, callback) {
  // abstract requests to other resources
  // create, read, update, delete
  // pass client error if exists
  let passError = true

  let successCallback = (body) => {
    callback(null, body)
  }
  let sendRequest = () => {
    // pass the API request
    callApi(endpoint, method, body, storeId, callback, successCallback, passError)
  }

  if (resourceId) {
    let docEndpoint = resource + '/' + resourceId + '.json'

    let checkCustomer = (err, body, msg) => {
      if (!err) {
        if (body) {
          // check if resource is owned by current customer
          let checked
          if (Array.isArray(body.customers)) {
            for (let i = 0; i < body.customers.length; i++) {
              if (body.customers[i] === customerId) {
                checked = true
                break
              }
            }
          } else if (Array.isArray(body.buyers)) {
            for (let i = 0; i < body.buyers.length; i++) {
              if (body.buyers[i]._id === customerId) {
                checked = true
                break
              }
            }
          }

          if (checked === true) {
            // authorized
            if ((!endpoint || endpoint === docEndpoint) && method === 'GET') {
              // already read
              successCallback(body)
            } else {
              // check endpoint
              if (!endpoint) {
                endpoint = docEndpoint
              } else if (/(customers|buyers)/.test(endpoint)) {
                // prohibited endpoint
                callback(null, false)
              }
              sendRequest()
            }
          } else {
            // unauthorized
            callback(null, false)
          }
        } else {
          // not found
          callback()
        }
      } else {
        // callback with error
        callback(err, null, msg)
      }
    }

    // first read document to check customer
    readResource(storeId, checkCustomer, docEndpoint, passError)
  } else {
    // no resource ID
    if (method === 'GET') {
      // returns only documents related with this respective customer
      endpoint = resource + '.json?'
      if (resource === 'orders') {
        // https://ecomstore.docs.apiary.io/#reference/orders
        endpoint += 'buyers._id='
      } else {
        // carts ?
        // https://ecomstore.docs.apiary.io/#reference/carts
        endpoint += 'customers='
      }
      endpoint += customerId
    } else if (body) {
      // specify current customer on document body
      if (resource === 'orders') {
        // add customer after order created
        let SuccessCallback = successCallback
        successCallback = (body) => {
          // proceed to callback
          SuccessCallback(body)

          // add customer
          // buyers subresource
          let endpoint = 'orders/' + body._id + '/buyers.json'
          let method = 'POST'
          let Body = {
            '_id': customerId
          }
          callApi(endpoint, method, Body, storeId)
        }
      } else {
        body.customers = [customerId]
      }
    }

    // try to process API request
    sendRequest()
  }
}

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

  'getProviders': (storeId, callback) => {
    readStore(storeId, (err, store, msg) => {
      if (!err && typeof store === 'object' && store !== null) {
        // callback with oauth_providers property
        callback(null, store.oauth_providers)
      } else {
        // pass error
        callback(err, store, msg)
      }
    })
  },

  readStore,
  findCustomer,
  findCustomerByEmail,
  createCustomer,
  updateCustomer,
  readCustomer,
  // abstract requests to other resources
  crud
}
