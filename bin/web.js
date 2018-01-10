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
  },
  'google': {
    'Init': require('passport-google-oauth20').Strategy
  },
  'microsoft': {
    'Init': require('passport-windowslive').Strategy
  },
  'instagram': {
    'Init': require('passport-instagram').Strategy
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

    // new Express application
    let app = Express()

    app.use(bodyParser.json())
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
    for (let provider in strategies) {
      if (Strategies.hasOwnProperty(provider) && strategies.hasOwnProperty(provider)) {
        let credentials = strategies[provider]
        let Strategy = Strategies[provider]
        if (typeof credentials === 'object' && credentials !== null && credentials.clientID !== '') {
          let path = config.baseUri + provider

          // add strategy
          passport.use(new Strategy.Init({
            // OAuth 2.0 auth
            'clientID': credentials.clientID,
            'clientSecret': credentials.clientSecret,
            // same callback pattern always
            'options.callbackURL': config.host + path + '/callback.html'
          }, (accessToken, refreshToken, profile, done) => {
            // find or create user account
            // generate JSON Web Token
            let user = profile
            user.token = 'JWT'
            return done(null, user)
          }))

          app.get(path + '/callback.html', passport.authenticate(provider, {
            session: false
          }), (req, res) => {
            let token
            if (typeof req.user === 'object' && req.user !== null && req.user.token) {
              // successful authentication
              token = req.user.token
            } else {
              token = null
            }
            // create token cookie
            res.cookie('_passport_token', token, cookieOptions)
            // return HTML file
            res.sendFile(root + '/assets/callback.html')
          })

          app.get(path + '/:store/:id', (req, res, next) => {
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
                res.send(400, 'Invalid request ID, must follow RegEx pattern ^[\\w.]{32}$')
              }
            } else {
              res.send(400, 'Invalid Store ID')
            }
          }, passport.authenticate(provider, {
            session: false
          }))

          app.get(path + '/:store/:id/token.json', (req, res, next) => {
            // check if id is the same of stored
            let store = req.params.store
            let cookieName = '_passport_' + store + '_id'
            let id = req.cookies[cookieName]
            if (id === req.params.id) {
              // valid id
              // validate token with store ID
              let auth = req.cookies._passport_token
              // let auth = auth.tokenValidate(req.cookies._passport_token, store)
              // remove id cookie
              res.clearCookie(cookieName)
              if (auth) {
                // return authentication object
                res.json(auth)
              } else {
                res.status(403)
                res.json({
                  'status': 403,
                  'error': 'Forbidden, token null, expired or overwritten, restart the OAuth flux'
                })
              }
            } else {
              res.status(401)
              res.json({
                'status': 401,
                'error': 'Unauthorized, request ID doesn\'t match'
              })
            }
          })
        }
      }
    }

    // initialize Passport
    app.use(passport.initialize())

    app.listen(config.proxyPort, () => {
      logger.log('Running Express server on port ' + config.proxyPort)
    })
  }
})
