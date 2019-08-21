'use strict'

// json web token encrypt and decrypt
const jwt = require('jwt-simple')
// library for parsing, validating, manipulating, and formatting dates
const moment = require('moment')

// secret key (salt) to jwt
let secret = ''

module.exports = {
  setSecret: _secret => {
    secret = _secret
  },

  generateToken (storeId, customerId, level = 1) {
    // create new json web token
    // expiration unix timestamp
    const expires = moment().add(7, 'days')
    const token = jwt.encode({
      level,
      store_id: storeId,
      customer_id: customerId,
      expires: expires.valueOf()
    }, secret)

    // return user id and generated token
    // both should be sent on next requests
    return {
      my_id: customerId,
      access_token: token,
      // expiratin date "2014-09-08T08:02:17-05:00" (ISO 8601)
      expires: expires.format()
    }
  },

  validate (customerId, storeId, token) {
    // return true if authenticated or error code and message
    // decode token
    let decoded
    try {
      decoded = jwt.decode(token, secret)
    } catch (e) {
      return {
        error: 1,
        message: 'Invalid token'
      }
    }

    // check valid jwt and object
    const { level, expires } = decoded
    if (typeof level === 'number' && expires > Date.now()) {
      if (decoded.customer_id === customerId) {
        if (decoded.store_id === storeId) {
          // valid access token and ID
          return decoded.level
        } else {
          return {
            error: 4,
            message: 'Incorrect store ID'
          }
        }
      } else {
        return {
          error: 3,
          message: 'Informed customer ID does not match with token ID'
        }
      }
    } else {
      return {
        error: 2,
        message: 'Token was valid, but expired'
      }
    }
  }
}
