'use strict'

// NodeJS filesystem module
// const fs = require('fs')

// read config file
// const config = JSON.parse(fs.readFileSync(process.cwd() + '/config/config.json', 'utf8'))

module.exports = {
  'get': ([ id, meta, body, respond ], provider, passport) => {
    if (id === 'callback') {
      passport.authenticate(provider, (err, user, info) => {
        if (!err) {
          respond(user)
        } else {
          respond({}, null, 403, 1, err.message)
        }
      })
    } else {
      passport.authenticate(provider, (err, user, info) => {
        if (!err) {
          respond(info)
        } else {
          respond({}, null, 403, 1, err.message)
        }
      })
    }
  }
}
