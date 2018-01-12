'use strict'

// log on files
const logger = require('./Logger.js')

// Node raw HTTP module with https protocol
const https = require('https')

// Store API
let host
let baseUri
let port

function requestEnd (res, rawData, callback, successCallback) {
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
      // unexpected status code
      let str = 'Unexpected response status code from Store API' +
        '\nStatus: ' + res.statusCode +
        '\nResponse: ' + rawData
      let err = new Error(str)
      logger.error(err)
      callback(err, null)
  }
}

function callApi (endpoint, method, body, storeId, callback, successCallback) {
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

  let req = https.request(options, (res) => {
    let rawData = ''
    res.setEncoding('utf8')
    res.on('data', (chunk) => { rawData += chunk })
    res.on('end', () => {
      requestEnd(res, rawData, callback, () => {
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
      })
    })
  })

  req.on('error', (e) => {
    logger.error(e)
  })

  if (body) {
    // write data to request body
    req.write(JSON.stringify(body))
  }
  req.end()
}

function findCustomerByEmail (storeId, email, callback) {
  // https://ecomstore.docs.apiary.io/#reference/customers/all-customers/find-customers
  let endpoint = 'customers.json?main_email=' + email + '&fields=_id'
  let method = 'GET'

  callApi(endpoint, method, null, storeId, callback, (data) => {
    // 200 OK
    if (typeof data === 'object' && data !== null && Array.isArray(data.result)) {
      let customers = data.result
      if (customers.length === 1) {
        // found
        // callback with customer ID
        callback(null, customers[0]._id)
      }
    }

    // not found
    callback()
  })
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

  'findCustomer': (storeId, provider, userId, verifiedEmail, callback) => {
    // https://ecomstore.docs.apiary.io/#reference/customers/all-customers/find-customers
    let endpoint = 'customers.json?oauth_providers.user_id=' + userId + '&fields=oauth_providers'
    let method = 'GET'

    callApi(endpoint, method, null, storeId, callback, (data) => {
      // 200 OK
      if (typeof data === 'object' && data !== null && Array.isArray(data.result)) {
        let customers = data.result
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
      }

      if (verifiedEmail) {
        // try by email
        findCustomerByEmail(storeId, verifiedEmail, callback)
      } else {
        // not found
        callback()
      }
    })
  },

  'createCustomer': (storeId, profile, callback) => {
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
        if (typeof data === 'object' && data !== null) {
          let id = data._id
          if (id) {
            callback(null, id)
          }
        }

        // not found
        callback()
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
      // set email verified if social account is verified
      if (profile._json.verified === true) {
        body.emails[0].verified = true
      }

      // check if there are no customer with the same main email address
      findCustomerByEmail(storeId, body.main_email, (err, id) => {
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
          callback(err, id)
        }
      })
    }
  }
}
