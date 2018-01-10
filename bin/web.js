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
      'httpOnly': true,
      // cookie should be signed
      // can detect if the client modified the cookie
      'signed': true
    }

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

          let path = config.baseUri + provider
          // callback always with the same pattern
          options.callbackURL = config.host + path + '/callback.html'

          // add strategy
          passport.use(new Strategy.Init(options, (accessToken, refreshToken, profile, done) => {
            // find or create user account
            // generate JSON Web Token
            let user = profile
            user.token = 'JWT'
            return done(null, user)
          }))

          app.get(path + '/:id', (req, res, next) => {
            // check id
            if (/^[\w.]{32}$/.test(req.params.id)) {
              // create id cookie
              res.cookie('_passport_id', req.params.id, cookieOptions)
              // pass next middleware
              // run passport
              next()
            } else {
              res.sendStatus(400)
              res.send('Invalid ID, must follow RegEx pattern ^[\\w.]{32}$')
            }
          }, passport.authenticate(provider, {
            session: false
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
