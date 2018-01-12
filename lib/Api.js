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
      let msg = 'Invalid Store ID'
      callback(new Error(msg), null, msg)
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
          }

          // not found
          callback()
        })
      })
    })

    req.on('error', (e) => {
      logger.error(e)
    })

    req.end()
  },

  'createCustomer': (storeId, profile, callback) => {
    // https://ecomstore.docs.apiary.io/#reference/customers/new-customer
    let body = {}

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

    if (!Array.isArray(profile.emails) || profile.emails.length === 0) {
      // random
      body.main_email = '12345@sample.mail'
    } else {
      // set first element as main_email
      body.main_email = profile.emails[0].value

      body.emails = []
      for (let i = 0; i < profile.emails.length; i++) {
        let emailObject = {
          'address': profile.emails[i].value
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

    // save oauth credentials on customer data
    body.oauth_providers = [{
      '_id': '100000000000000000000000',
      'provider': profile.provider,
      'user_id': profile.id
    }]

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

    let req = https.request(options, (res) => {
      let rawData = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        requestEnd(res, rawData, callback, () => {
          // created
          let parsedData
          try {
            parsedData = JSON.parse(rawData)
          } catch (e) {
            logger.error(e)
            // callback without user
            callback(e, null)
            return
          }

          if (typeof parsedData === 'object' && parsedData !== null) {
            let id = parsedData._id
            if (id) {
              callback(null, id)
            }
          }

          // not found
          callback()
        })
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
