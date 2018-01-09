'use strict'

// log on files
const logger = require('./../lib/Logger.js')

// NodeJS filesystem module
const fs = require('fs')

// Express web framework
// https://www.npmjs.com/package/express
const Express = require('express')
// body parsing middleware
const bodyParser = require('body-parser')
// Passport and strategies
// http://www.passportjs.org/
const passport = require('passport')
const Strategies = {
  'facebook': {
    'Init': require('passport-facebook').Strategy
  }
}

// read config file
fs.readFile(process.cwd() + '/config/config.json', 'utf8', (err, data) => {
  if (err) {
    // can't read config file
    throw err
  } else {
    let config = JSON.parse(data)

    // new Express application
    let app = Express()

    app.use(bodyParser.json())
    app.get('/', (req, res) => {
      res.json({
        'status': 'E-Com Plus Passport API is running'
      })
    })

    // initialize Passport
    app.use(passport.initialize())

    // initialize OAuth strategies
    let strategies = config.strategies
    for (let provider in strategies) {
      if (Strategies.hasOwnProperty(provider) && strategies.hasOwnProperty(provider)) {
        let credentials = strategies[provider]
        let Strategy = Strategies[provider]
        if (typeof credentials === 'object' && credentials !== null) {
          let options

          if (!Strategy.hasOwnProperty('options')) {
            // default options
            options = {
              'clientID': credentials.clientID,
              'clientSecret': credentials.clientSecret
            }
          } else {
            for (let opt in Strategy.options) {
              if (Strategy.options.hasOwnProperty(opt)) {
                options[opt] = credentials[opt]
              }
            }
          }

          // callback always with the same pattern
          options.callbackURL = config.host + config.baseUri + provider + '/callback.json'

          // add strategy
          passport.use(new Strategy.Init(options, (accessToken, refreshToken, profile, done) => {
            return done(null, profile)
          }))
        }
      }
    }

    app.listen(config.proxyPort, () => {
      logger.log('Running Express server on port ' + config.proxyPort)
    })
  }
})
