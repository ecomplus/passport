'use strict'

// log on files
const logger = require('./../lib/Logger.js')
// authentication with jwt
const auth = require('./../lib/Auth.js')

// NodeJS filesystem module
const fs = require('fs')

// Express web framework
// https://www.npmjs.com/package/express
const Express = require('express')
// body parsing middleware
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

// Passport and strategies
// http://www.passportjs.org/
const passport = require('passport')
const Strategies = {
  'facebook': {
    'Init': require('passport-facebook').Strategy,
    'scope': [
      'email',
      'public_profile',
      'user_birthday'
      // 'user_location'
    ],
    'profileFields': [
      'id',
      'first_name',
      'middle_name',
      'last_name',
      'age_range',
      'gender',
      'locale',
      'verified',
      'picture',
      'email',
      'birthday'
      // 'location'
    ]
  },
  'google': {
    'Init': require('passport-google-oauth20').Strategy,
    'scope': [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  },
  'windowslive': {
    'Init': require('passport-windowslive').Strategy,
    'scope': [
      'wl.signin',
      'wl.basic',
      'wl.emails',
      'wl.birthday'
      // 'wl.phone_numbers',
      // 'wl.postal_addresses'
    ]
  },
  'paypal': {
    'Init': require('passport-paypal-oauth').Strategy
  }
}

// process.cwd() can change
// keep initial absolute path
let root = process.cwd()
// read config file
fs.readFile(root + '/config/config.json', 'utf8', (err, data) => {
  if (err) {
    // can't read config file
    throw err
  } else {
    let config = JSON.parse(data)

    // set jwt salt
    auth.setSecret(config.jwtSecret)

    // new Express application
    let app = Express()

    app.use(bodyParser.json())
    app.use(cookieParser())

    app.get('/', (req, res) => {
      res.json({
        'status': 'E-Com Plus Passport API is running'
      })
    })

    // keep id and token on cookies
    let cookieOptions = {
      // browser session only
      'expires': 0,
      // cookie only accessible by the web server
      'httpOnly': true
    }

    // initialize OAuth strategies
    let strategies = config.strategies
    let availableStrategies = []

    app.get(config.baseUri, (req, res) => {
      res.json(availableStrategies)
    })

    for (let provider in strategies) {
      if (Strategies.hasOwnProperty(provider) && strategies.hasOwnProperty(provider)) {
        let credentials = strategies[provider]
        let Strategy = Strategies[provider]
        if (typeof credentials === 'object' && credentials !== null && credentials.clientID !== '') {
          let path = config.baseUri + provider

          let strategyConfig = {
            // OAuth 2.0 auth
            'clientID': credentials.clientID,
            'clientSecret': credentials.clientSecret,
            // same callback pattern always
            'callbackURL': config.host + path + '/callback.html'
          }
          if (Strategy.hasOwnProperty('profileFields')) {
            strategyConfig.profileFields = Strategy.profileFields
          }

          // add strategy
          passport.use(new Strategy.Init(strategyConfig, (accessToken, refreshToken, profile, done) => {
            let user = {}
            user.profile = profile
            // return authenticated
            return done(null, user)
          }))

          // authenticate strategy options
          let options = {
            'session': false
          }
          if (Strategy.hasOwnProperty('scope')) {
            options.scope = Strategy.scope
          }

          app.get(path + '/callback.html', passport.authenticate(provider, options), (req, res) => {
            let user = req.user
            if (typeof user === 'object' && user !== null && user.profile) {
              // successful authentication
              let profile = JSON.stringify(user.profile)
              let store = req.cookies._passport_store
              if (store) {
                // create profile cookie
                let options = Object.assign({}, cookieOptions)
                // also limit cookie age to 2 minutes
                options.maxAge = 120000
                res.cookie('_passport_' + store + '_profile', profile, options)
              }
            }

            // return HTML file
            res.sendFile(root + '/assets/callback.html')
          })

          app.get(path + '/:store/:id/oauth', (req, res, next) => {
            res.setHeader('content-type', 'text/plain; charset=utf-8')
            // check store ID
            let store = parseInt(req.params.store, 10)
            if (store > 100) {
              // check id
              if (/^[\w.]{32}$/.test(req.params.id)) {
                // create id and store cookies
                res.cookie('_passport_' + store + '_id', req.params.id, cookieOptions)
                res.cookie('_passport_store', store, cookieOptions)

                // pass next middleware
                // run passport
                next()
              } else {
                res.status(400).send('Invalid request ID, must follow RegEx pattern ^[\\w.]{32}$')
              }
            } else {
              res.status(400).send('Invalid Store ID')
            }
          }, passport.authenticate(provider, options))

          app.get(path + '/:store/:id/token.json', (req, res, next) => {
            // check if id is the same of stored
            let store = parseInt(req.params.store, 10)
            let cookieName = '_passport_' + store
            let id = req.cookies[cookieName + '_id']
            if (store > 100 && id === req.params.id) {
              // valid id
              // get user profile
              let profile = req.cookies[cookieName + '_profile']
              if (profile) {
                // remove cookies
                res.clearCookie(cookieName + '_id')
                res.clearCookie(cookieName + '_profile')

                try {
                  profile = JSON.parse(profile)
                } catch (e) {
                  // invalid JSON
                  res.status(403).json({
                    'status': 403,
                    'error': 'Forbidden, invalid profile object, restart the OAuth flux'
                  })
                  return
                }

                // find or create customer account
                let customerId = '123'

                // generate jwt
                res.json({
                  'auth': auth.generateToken(store, customerId),
                  'profile': profile
                })
              } else {
                res.status(403).json({
                  'status': 403,
                  'error': 'Forbidden, no profile found, restart the OAuth flux'
                })
              }
            } else {
              res.status(401).json({
                'status': 401,
                'error': 'Unauthorized, request ID doesn\'t match'
              })
            }
          })

          availableStrategies.push(provider)
        }
      }
    }

    // initialize Passport
    app.use(passport.initialize())

    // handle OAuth errors
    app.use(/.*\/(callback\.html|oauth)$/, (err, req, res, next) => {
      res.status(403)
      res.json({
        'status': 403,
        'error': err.message
      })
    })

    // production error handler
    // no stacktraces leaked to user
    app.use((err, req, res, next) => {
      // write error on file
      logger.error(err)

      let status
      if (err.status) {
        status = err.status
      } else {
        status = 500
      }
      res.status(status)
      res.json({
        'status': status
      })
    })

    app.listen(config.proxyPort, () => {
      logger.log('Running Express server on port ' + config.proxyPort)
    })
  }
})
