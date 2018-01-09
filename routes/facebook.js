'use strict'

// NodeJS filesystem module
const fs = require('fs')

// OAuth with Passport
// http://www.passportjs.org
const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy

// import GET method callback
const verbs = require('#common.js')

// read config file
const config = JSON.parse(fs.readFileSync('./../config/config.json', 'utf8'))

if (config.strategies.hasOwnProperty('facebook') && config.strategies.facebook) {
  // config passport
  passport.use(new FacebookStrategy({
    clientID: config.strategies.facebook.client_id,
    clientSecret: config.strategies.facebook.client_secret,
    callbackURL: config.host + '/facebook/callback.json',
    profileFields: [ 'id', 'displayName', 'photos', 'email' ]
  }, (accessToken, refreshToken, profile, cb) => {
    return cb(null, profile)
  }))

  module.exports = {
    'GET': function () {
      verbs.get(arguments, 'facebook', passport)
    }
  }
} else {
  // strategy unavailable
  module.exports = {}
}
