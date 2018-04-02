'use strict'

// log on files
const logger = require('./../lib/Logger.js')
// authentication with jwt
const auth = require('./../lib/Auth.js')
// methods to Store API
const api = require('./../lib/Api.js')
// list stores from E-Com Plus Main API
const stores = require('./../lib/Stores.js')

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

    // setting up the app
    // set jwt salt
    auth.setSecret(config.jwtSecret)
    // Store API definitions
    api.setApi(config.apiHost, config.apiBaseUri, config.apiPort)
    // E-Com Plus Main API definitions
    stores.setApi(config.mainApiHost, config.mainApiBaseUri, config.mainApiPort)
    // new Express application
    let app = Express()

    app.use(bodyParser.json())
    app.use(cookieParser())

    // set the view engine to ejs
    app.set('views', root + '/assets/app/views')
    app.set('view engine', 'ejs')

    // static E-Com Plus Passport website
    app.use('/site', Express.static(root + '/assets/site'))
    app.get('/site/pt_br.html', (req, res) => {
      // default lang
      // redirect to index
      res.redirect('/site/')
    })
    // redirect domain root to site
    app.get('/', (req, res) => {
      res.redirect('/site/')
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

    let idValidate = (id, res) => {
      if (/^[\w.]{32}$/.test(id)) {
        return true
      }
      // invalid ID, end request
      res.status(400).send('Invalid request ID, must follow RegEx pattern ^[\\w.]{32}$')
    }

    app.get(config.baseUri + ':lang/:store/:id/login.html', (req, res) => {
      // check id
      let id = req.params.id
      if (idValidate(id, res) === true) {
        // start login flow
        let storeId = parseInt(req.params.store, 10)
        let callback = (err, body) => {
          if (!err && typeof body === 'object' && body !== null) {
            // create session cookies
            let sig = Math.floor((Math.random() * 10000000) + 10000000)
            res.cookie('_passport_' + storeId + '_sig', sig, cookieOptions)

            let lang = req.params.lang
            let oauthPath = '/' + storeId + '/' + id + '/' + sig + '/oauth'
            let baseUri = config.baseUri

            let providers = Object.assign({}, config.strategies)
            // ref.: https://ecomstore.docs.apiary.io/#reference/stores/store-object
            let store = {
              'id': storeId,
              'name': body.name
            }
            if (typeof body.logo === 'object' && body.logo !== null) {
              store.logo = body.logo.url
            }
            // check custom store strategies
            let customProviders = body.oauth_providers
            if (typeof customProviders === 'object' && customProviders !== null) {
              for (let provider in customProviders) {
                if (customProviders.hasOwnProperty(provider) && providers.hasOwnProperty(provider)) {
                  // mark custom store oauth app
                  providers[provider].customStrategy = true
                }
              }
            }

            res.render('login', { lang, store, baseUri, oauthPath, providers })
          } else {
            res.status(404).send('Store not found')
          }
        }

        // get store info
        api.readStore(storeId, callback)
      }
    })

    let oauthStart = (req, res, next) => {
      res.setHeader('content-type', 'text/plain; charset=utf-8')
      // check store ID
      let store = parseInt(req.params.store, 10)
      if (store > 100) {
        // check id
        if (idValidate(req.params.id, res) === true) {
          // check session
          if (req.cookies['_passport_' + store + '_sig'] === req.params.sig) {
            // create id and store cookies
            res.cookie('_passport_' + store + '_id', req.params.id, cookieOptions)
            res.cookie('_passport_store', store, cookieOptions)

            // pass next middleware
            // run passport
            next()
          } else {
            res.status(400).send('Invalid session, restart flow at login.html')
          }
        }
      } else {
        res.status(400).send('Invalid Store ID')
      }
    }

    let oauthCallback = (req, res) => {
      let user = req.user
      if (typeof user === 'object' && user !== null && user.profile) {
        // successful authentication
        let store
        if (req.params.store) {
          store = req.params.store
        } else {
          store = req.cookies._passport_store
        }
        if (store) {
          // logger.log(user.profile)
          if (user.profile.hasOwnProperty('_raw')) {
            delete user.profile._raw
          }
          let profile
          try {
            profile = JSON.stringify(user.profile)
          } catch (e) {
            logger.error(e)
          }

          if (profile) {
            // create profile cookie
            let options = Object.assign({}, cookieOptions)
            // also limit cookie age to 2 minutes
            options.maxAge = 120000
            res.cookie('_passport_' + store + '_profile', profile, options)
          }
        }
      }

      // return HTML file
      res.sendFile(root + '/assets/app/callback.html')
    }

    let oauthProfile = (req, res, next) => {
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

          let returnToken = (customer) => {
            let out = {
              // returns only public info
              'customer': customer,
              // generate jwt
              'auth': {
                'id': customer._id,
                'token': auth.generateToken(store, customer._id)
              }
            }
            res.json(out)
          }

          let handleError = (msg) => {
            if (msg) {
              res.status(400).json({
                'status': 400,
                'error': msg
              })
            } else {
              res.status(500).json({
                'status': 500,
                'error': 'Internal server error'
              })
            }
          }

          // find or create customer account
          let verifiedEmail
          if (Array.isArray(profile.emails) && profile.emails.length > 0) {
            // also search customer by email
            verifiedEmail = profile.emails[0].value
          }

          let callback = (err, customer, msg) => {
            if (!err) {
              if (customer) {
                returnToken(customer)
              } else {
                // no account found
                api.createCustomer(store, profile, (err, customer, msg) => {
                  if (err) {
                    handleError(msg)
                  } else {
                    returnToken(customer)
                  }
                })
              }
            } else {
              handleError(msg)
            }
          }
          api.findCustomer(store, profile.provider, profile.id, verifiedEmail, callback)
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
    }

    let setupStrategy = (credentials, provider, Strategy, storeId) => {
      if (typeof credentials === 'object' && credentials !== null && credentials.clientID !== '') {
        let endpoint = provider
        let callbackPath = config.baseUri + provider
        if (storeId) {
          endpoint += '-' + storeId
          // add store ID as URL param
          callbackPath += '-:store(' + storeId + ')'
        }
        let path = config.baseUri + endpoint

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

        let strategyCallback = (accessToken, refreshToken, profile, done) => {
          let user = {}
          user.profile = profile
          // return authenticated
          return done(null, user)
        }
        let strategy = new Strategy.Init(strategyConfig, strategyCallback)
        // logger.log(strategy._oauth2)

        // add strategy middleware
        passport.use(endpoint, strategy)

        // authenticate strategy options
        let options = {
          'session': false
        }
        if (Strategy.hasOwnProperty('scope')) {
          options.scope = Strategy.scope
        }

        app.get(path + '/:store/:id/:sig/oauth', oauthStart, passport.authenticate(endpoint, options))
        app.get(callbackPath + '/callback.html', passport.authenticate(endpoint, options), oauthCallback)

        if (!storeId) {
          // generic only
          app.get(path + '(-*)?/:store/:id/token.json', oauthProfile)
          availableStrategies.push(provider)
        }
      }
    }

    for (let provider in strategies) {
      if (Strategies.hasOwnProperty(provider) && strategies.hasOwnProperty(provider)) {
        // setup default strategies
        let credentials = strategies[provider]
        let Strategy = Strategies[provider]
        setupStrategy(credentials, provider, Strategy)
      }
    }

    // initialize Passport
    app.use(passport.initialize())

    let setupCustomStrategies = () => {
      // wait 10 minutes
      setTimeout(() => {
        stores.list((stores) => {
          if (Array.isArray(stores)) {
            let done = 0
            let size = stores.length

            for (let i = 0; i < size; i++) {
              let storeId = stores[i].id
              // delay to prevent rating limit
              setTimeout(() => {
                api.getProviders(storeId, (err, providers) => {
                  if (!err && typeof providers === 'object' && providers !== null) {
                    for (let provider in providers) {
                      if (providers.hasOwnProperty(provider)) {
                        let app = providers[provider]
                        let Strategy = Strategies[provider]
                        if (app && Strategy !== undefined && app.client_id && app.client_secret) {
                          // setup strategy with store custom oauth app
                          let credentials = {
                            'clientID': app.client_id,
                            'clientSecret': app.client_secret
                          }
                          setupStrategy(credentials, provider, Strategy, storeId)
                        }
                      }
                    }
                  }

                  done++
                  if (done === size) {
                    // all done
                    // schedule restart
                    setupCustomStrategies()
                  }
                })
              }, i * 800)
            }
          }
        })
      }, 600000)
    }
    setupCustomStrategies()

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
