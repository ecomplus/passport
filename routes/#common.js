'use strict'

// NodeJS filesystem module
const fs = require('fs')

// read config file
const config = JSON.parse(fs.readFileSync(process.cwd() + '/config/config.json', 'utf8'))

module.exports = {
  'get': ([ id, meta, body, respond ], provider, passport) => {
    if (id === 'callback') {
      passport.authenticate(provider, {
        successRedirect: config.http.base_uri + 'profile.json'
      })
    } else {
      passport.authenticate(provider)
    }
  }
}
