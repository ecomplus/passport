'use strict'

// json web token encrypt and decrypt
const jwt = require('jwt-simple')
// library for parsing, validating, manipulating, and formatting dates
const moment = require('moment')

// secret key (salt) to jwt
let secret = ''

module.exports = {
  'setSecret': (_secret) => {
    secret = _secret
  },

  'generateToken': function (storeId, customerId) {
    // create new json web token
    // expiration unix timestamp
    let expires = moment().add(7, 'days')
    let token = jwt.encode({
      'store_id': storeId,
      'customer_id': customerId,
      'expires': expires.valueOf()
    }, secret)

    // return user id and generated token
    // both should be sent on next requests
    return {
      'my_id': customerId,
      'access_token': token,
      // expiratin date "2014-09-08T08:02:17-05:00" (ISO 8601)
      'expires': expires.format()
    }
  }
}
