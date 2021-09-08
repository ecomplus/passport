'use strict'

/* eslint-disable quote-props, comma-dangle */

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

// Redis database
// https://github.com/NodeRedis/node_redis
const redisClient = require('redis').createClient()

// Passport and strategies
// http://www.passportjs.org/
const passport = require('passport')
const Strategies = {
  'facebook': {
    'Init': require('passport-facebook').Strategy,
    'scope': [
      'email',
      'public_profile',
      // 'user_birthday',
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
      // 'birthday',
      // 'location'
    ]
  },
  'google': {
    'Init': require('passport-google-oauth20').Strategy,
    'scope': [
      'profile',
      'email'
    ]
  },
  'windowslive': {
    'Init': require('passport-windowslive').Strategy,
    'scope': [
      'wl.signin',
      'wl.basic',
      'wl.emails',
      'wl.birthday',
      // 'wl.phone_numbers',
      // 'wl.postal_addresses'
    ]
  }
}

// process.cwd() can change
// keep initial absolute path
const root = process.cwd()
// read config file
fs.readFile(root + '/config/config.json', 'utf8', (err, data) => {
  if (err) {
    // can't read config file
    throw err
  } else {
    const config = JSON.parse(data)

    // setting up the app
    // set jwt salt
    auth.setSecret(config.jwtSecret)
    // Store API definitions
    api.setApi(config.apiHost, config.apiBaseUri, config.apiPort)
    // E-Com Plus Main API definitions
    stores.setApi(config.mainApiHost, config.mainApiBaseUri, config.mainApiPort)
    // new Express application
    const app = Express()

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
    const cookieOptions = {
      // browser session only
      expires: 0,
      // SameSite=None requires Secure
      // only sent to the server over the HTTPS protocol
      secure: true,
      // cookie only accessible by the web server
      httpOnly: true
    }

    // initialize OAuth strategies
    const strategies = config.strategies
    const availableStrategies = []

    app.get(config.baseUri, (req, res) => {
      res.json(availableStrategies)
    })

    const idValidate = (id, res) => {
      if (/^[\w.]{32}$/.test(id)) {
        return true
      }
      // invalid ID, end request
      res.status(400).send('Invalid request ID, must follow RegEx pattern ^[\\w.]{32}$')
    }

    const listProviders = store => {
      const strategies = Object.assign({}, config.strategies)
      if (!store.$main || store.$main.plan !== 0) {
        // check custom store strategies
        const customStrategies = store.oauth_providers
        if (typeof customStrategies === 'object' && customStrategies) {
          for (const provider in customStrategies) {
            if (customStrategies[provider] !== undefined && strategies[provider] !== undefined) {
              // mark custom store oauth app
              strategies[provider].customStrategy = true
            }
          }
        }
      }

      // returns only providers public info
      const providers = {}
      for (const provider in strategies) {
        if (strategies[provider]) {
          const { providerName, htmlClass, faIcon } = strategies[provider]
          providers[provider] = { providerName, htmlClass, faIcon }
        }
      }
      return providers
    }

    const generateOauthPath = (id, storeId, res) => {
      // create session cookies
      const sig = Math.floor((Math.random() * 10000000) + 10000000)
      return {
        sig,
        oauthPath: '/' + storeId + '/' + id + '/' + sig + '/oauth'
      }
    }

    const saveSigCookie = (storeId, sig, res) => {
      res.cookie('_passport_' + storeId + '_sig', sig, cookieOptions)
    }

    app.get(config.baseUri + ':lang/:store/:id/login.html', (req, res) => {
      // check id
      const id = req.params.id
      if (idValidate(id, res) === true) {
        // start login flow
        const storeId = parseInt(req.params.store, 10)
        const callback = (err, body) => {
          if (!err && typeof body === 'object' && body !== null) {
            const { sig, oauthPath } = generateOauthPath(id, storeId, res)
            saveSigCookie(storeId, sig, res)
            const lang = req.params.lang
            const baseUri = config.baseUri
            // show or hide link to skip login
            const enableSkip = Boolean(req.query.enable_skip)

            // ref.: https://developers.e-com.plus/docs/api/#/store/stores/stores
            const store = {
              id: storeId,
              name: body.name
            }
            if (typeof body.logo === 'object' && body.logo !== null) {
              store.logo = body.logo.url
            }
            const providers = listProviders(body)
            res.render('login', { lang, store, baseUri, enableSkip, oauthPath, providers })
          } else {
            res.status(404).send('Store not found')
          }
        }

        // get store info
        api.readStore(storeId, callback)
      }
    })

    app.get(config.baseUri + ':store/:id/oauth-providers.json', (req, res) => {
      // check id
      const id = req.params.id
      if (idValidate(id, res) === true) {
        // start login flow
        const storeId = parseInt(req.params.store, 10)
        const callback = (err, body) => {
          if (!err && typeof body === 'object' && body !== null) {
            const { sig, oauthPath } = generateOauthPath(id, storeId, res)
            const { host, baseUri } = config
            const providers = listProviders(body)

            res.json({
              host,
              baseUri,
              oauthPath,
              providers,
              iframeUri: `${host}${baseUri}${storeId}/${id}/${sig}/oauth-session`
            })
          } else {
            res.status(404).send('Store not found')
          }
        }

        // get store info
        api.readStore(storeId, callback)
      }
    })

    app.get(config.baseUri + ':store/:id/:sig/oauth-session', (req, res) => {
      saveSigCookie(req.params.store, req.params.sig, res)
      if (req.query.redirect) {
        res.redirect(`${req.query.redirect}?is_redirect=true`)
      } else {
        res.setHeader('content-type', 'text/plain; charset=utf-8')
        res.end()
      }
    })

    const oauthStart = (req, res, next) => {
      res.setHeader('content-type', 'text/plain; charset=utf-8')
      // check store ID
      const storeId = parseInt(req.params.store, 10)
      if (storeId > 100) {
        // check id
        if (idValidate(req.params.id, res) === true) {
          // check session
          const sessionCookie = req.cookies['_passport_' + storeId + '_sig']
          if (sessionCookie) {
            if (sessionCookie === req.params.sig) {
              // create id and store cookies
              res.cookie('_passport_' + storeId + '_id', req.params.id, cookieOptions)
              res.cookie('_passport_store', storeId, cookieOptions)
              // run passport
              next()
            } else {
              res.status(400).send('Invalid session, restart flow at login.html')
            }
          } else if (!req.query.is_redirect) {
            const { id, sig } = req.params
            const sessionUrl = `${config.baseUri}${storeId}/${id}/${sig}/oauth-session`
            res.redirect(`${sessionUrl}?redirect=${req.originalUrl}`)
          } else {
            res.status(409).send('Nothing to do with no session cookie and no redirect URI')
          }
        }
      } else {
        res.status(400).send('Invalid Store ID')
      }
    }

    const oauthCallback = (req, res) => {
      const user = req.user
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
          if (user.profile._raw) {
            delete user.profile._raw
          }
          let profile
          try {
            profile = JSON.stringify(user.profile)
          } catch (e) {
            logger.error(e)
          }

          if (profile) {
            const id = req.cookies['_passport_' + store + '_id']
            if (idValidate(id, res) === true) {
              // save profile on redis
              // key will expire after 2 minutes
              redisClient.set(store + '_' + id, profile, 'EX', 120)
            }
          }
        }
      }

      // return HTML file
      res.sendFile(root + '/assets/app/callback.html')
    }

    const blockLogin = res => res.status(401).json({
      status: 401,
      error: 'Unauthorized, profile found but unable to login'
    })

    const redisError = (res, err) => {
      res.status(500).json({
        'status': 500,
        'error': 'Internal server error (Redis client)'
      })
    }

    const oauthProfile = (req, res, next) => {
      // check if id is the same of stored
      const store = parseInt(req.params.store, 10)
      const id = req.params.id

      if (store > 100) {
        const handleProfile = (err, profile) => {
          if (!err) {
            // reply is null when the key is missing
            if (profile === null) {
              res.status(401).json({
                'status': 401,
                'error': 'Unauthorized, request ID (' + id + ') doesn\'t match'
              })
            } else {
              // valid id
              // get user profile
              if (profile) {
                // remove cookies
                res.clearCookie('_passport_' + store + '_id')

                if (typeof profile === 'string') {
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
                }

                const returnToken = (customer) => {
                  if (customer.login === false) {
                    return blockLogin(res)
                  }
                  // maximum auth level
                  const level = 3
                  const out = {
                    // returns only public info
                    customer,
                    // generate jwt
                    auth: {
                      id: customer._id,
                      token: auth.generateToken(store, customer._id, level, customer.enabled),
                      level
                    }
                  }
                  res.json(out)
                }

                const handleError = (msg) => {
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

                const callback = (err, customer, msg) => {
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
            }
          } else {
            redisError(res, err)
          }
        }

        if (req.profile && req.profile.emails) {
          handleProfile(null, req.profile)
        } else {
          redisClient.get(store + '_' + id, handleProfile)
        }
      } else {
        res.status(401).json({
          'status': 401,
          'error': 'Unauthorized, invalid store ID: ' + store
        })
      }
    }

    const setupStrategy = (credentials, provider, Strategy, storeId) => {
      if (typeof credentials === 'object' && credentials !== null && credentials.clientID !== '') {
        let endpoint = provider
        if (storeId) {
          // add store ID on strategy endpoint
          endpoint += '-' + storeId
        }
        const path = config.baseUri + endpoint

        const strategyConfig = {
          // OAuth 2.0 auth
          'clientID': credentials.clientID,
          'clientSecret': credentials.clientSecret,
          // same callback pattern always
          'callbackURL': config.host + path + '/callback.html'
        }
        if (Strategy.profileFields !== undefined) {
          strategyConfig.profileFields = Strategy.profileFields
        }

        const strategyCallback = (accessToken, refreshToken, profile, done) => {
          const user = {}
          user.profile = profile
          // return authenticated
          return done(null, user)
        }
        const strategy = new Strategy.Init(strategyConfig, strategyCallback)
        // logger.log(strategy._oauth2)

        // add strategy middleware
        passport.use(endpoint, strategy)

        // authenticate strategy options
        const options = {
          'session': false
        }
        if (Strategy.scope !== undefined) {
          options.scope = Strategy.scope
        }

        const strategyAuthenticate = passport.authenticate(endpoint, options)
        if (!storeId) {
          // generic only
          app.get(path + '/:store/:id/:sig/oauth', oauthStart, strategyAuthenticate)
          app.get(path + '/callback.html', strategyAuthenticate, oauthCallback)

          availableStrategies.push(provider)
        } else {
          // save authenticate function
          // will be used on custom strategies route
          customStrategies[storeId].authenticate[provider] = strategyAuthenticate
        }
      }
    }

    // endpoint to profile
    // should work with or without provider on URI
    app.get(config.baseUri + '(*/)?:store/:id/token.json', oauthProfile)

    for (const provider in strategies) {
      if (Strategies[provider] !== undefined && strategies[provider] !== undefined) {
        // setup default strategies
        const credentials = strategies[provider]
        const Strategy = Strategies[provider]
        setupStrategy(credentials, provider, Strategy)
      }
    }

    // initialize Passport
    app.use(passport.initialize())

    const setupCustomStrategies = () => {
      // wait 10 minutes
      setTimeout(() => {
        stores.list((stores) => {
          if (Array.isArray(stores)) {
            let done = 0
            const size = stores.length

            for (let i = 0; i < size; i++) {
              const storeId = stores[i].id
              // delay to prevent rating limit
              setTimeout(() => {
                api.getProviders(storeId, (err, providers) => {
                  if (!err && typeof providers === 'object' && providers !== null) {
                    for (const provider in providers) {
                      if (providers[provider]) {
                        const app = providers[provider]
                        if (app && app.client_id && app.client_secret) {
                          // check if it is already setted
                          const storeStrategies = customStrategies[storeId]
                          const key = app.client_id + app.client_secret
                          if (storeStrategies) {
                            if (storeStrategies[provider] === key) {
                              // already setted
                              // skip
                              continue
                            }
                          } else {
                            customStrategies[storeId] = {
                              // keep providers authenticate functions
                              'authenticate': {}
                            }
                          }

                          const Strategy = Strategies[provider]
                          if (Strategy !== undefined) {
                            // setup strategy with store custom oauth app
                            const credentials = {
                              'clientID': app.client_id,
                              'clientSecret': app.client_secret
                            }
                            setupStrategy(credentials, provider, Strategy, storeId)
                            // save for further check
                            customStrategies[storeId][provider] = key
                          }
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
    // store custom strategies already setted
    const customStrategies = {}
    setupCustomStrategies()

    // route custom strategies
    app.get(config.baseUri + ':provider(*)-:store(*)/:st/:id/:sig/oauth', (req, res, next) => {
      const store = req.params.store
      // check if store ID match twice on URL
      if (store === req.params.st) {
        const storeStrategies = customStrategies[store]
        const provider = req.params.provider
        // check if custom strategy is setted up
        if (storeStrategies && storeStrategies[provider]) {
          // continue as express middlewares
          oauthStart(req, res, () => {
            storeStrategies.authenticate[provider](req, res, next)
          })
          return
        }
      }
      // nothing to do, pass to next middleware
      next()
    })

    app.get(config.baseUri + ':provider(*)-:store(*)/callback.html', (req, res, next) => {
      const store = req.params.store
      const storeStrategies = customStrategies[store]
      const provider = req.params.provider
      // check if custom strategy is setted up
      if (storeStrategies && storeStrategies[provider]) {
        // continue as express middlewares
        storeStrategies.authenticate[provider](req, res, () => {
          oauthCallback(req, res, next)
        })
        return
      }
      // nothing to do, pass to next middleware
      next()
    })

    if (config.mailjet && config.mailjet.privateKey) {
      // handle login/sigup with email code verification
      const emailValidator = require('email-validator')
      const mailjet = require('node-mailjet').connect(config.mailjet.publicKey, config.mailjet.privateKey)

      app.put(config.baseUri + ':lang/:store/email-code', (req, res, next) => {
        const { email } = req.body
        const storeId = parseInt(req.params.store, 10)
        if (email && storeId > 100 && emailValidator.validate(email)) {
          const { lang } = req.params
          return redisClient.get(email, (err, emailSession) => {
            if (!err) {
              const tmpSession = emailSession && JSON.parse(emailSession)
              const timestamp = Date.now()
              if (
                !tmpSession ||
                timestamp - tmpSession.timestamp >= 120000 ||
                (storeId !== tmpSession.storeId && timestamp - tmpSession.timestamp >= 5000)
              ) {
                // new email session code
                const code = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000

                // get store info
                return api.readStore(storeId, (err, store) => {
                  if (!err && typeof store === 'object' && store) {
                    const codeMsg = lang === 'pt_br'
                      ? ` é o seu código para login na ${store.name}`
                      : ` is your ${store.name} login code`

                    // send new code by email
                    return mailjet.post('send', {
                      version: 'v3.1'
                    }).request({
                      Messages: [{
                        From: {
                          Email: 'noreply@e-com.club',
                          Name: store.name
                        },
                        ReplyTo: store.contact_email,
                        To: [{ Email: email }],
                        Subject: code + codeMsg,
                        TextPart: code + codeMsg,
                        HTMLPart: `<b>${code}</b>&nbsp;${codeMsg}.<br/><br/>${(store.logo ? `<img src="${store.logo}"/>` : '')}`
                      }]
                    }).then(() => {
                      // save key on redis on 10 minutes expiration
                      redisClient.set(email, JSON.stringify({ storeId, code, timestamp }), 'EX', 600)
                      res.status(204).end()
                    }).catch(err => {
                      logger.error(err)
                      next(err)
                    })
                  }

                  res.status(404).send('Store not found')
                })
              }
              return res.status(204).end()
            }
            redisError(res, err)
          })
        }
        res.status(400).json({
          status: 400,
          error: 'Invalid Store ID or email address'
        })
      })

      // profile with email + code login
      app.post(config.baseUri + ':store/:id/token.json', (req, res, next) => {
        const { email, code } = req.body.email
        if (code > 99999 && email && emailValidator.validate(email)) {
          return redisClient.get(email, (err, emailSession) => {
            if (!err) {
              if (emailSession && JSON.parse(emailSession).code === code) {
                // mock Passport profile object
                req.profile = {
                  emails: [{
                    value: email
                  }],
                  provider: 'email',
                  id: '0'
                }
                return oauthProfile(req, res, next)
              }
              res.status(403).json({
                status: 403,
                error: 'Forbidden, code not matching with email address'
              })
            } else {
              redisError(res, err)
            }
          })
        }
        res.status(400).json({
          status: 400,
          error: 'Invalid email address or code on request data'
        })
      })
    }

    // open REST API
    require('./../routes/api.js')(app, config.baseUri)

    // handle OAuth errors
    app.use(/.*\/(callback\.html|oauth)$/, (err, req, res, next) => {
      res.status(403)
      res.json({
        'status': 403,
        'error': err.message
      })
    })

    // simple authentication
    app.post(config.baseUri + ':store/identify.json', (req, res) => {
      const storeId = parseInt(req.params.store, 10)
      // get store infor
      // get customer infor
      const body = req.body
      const email = body.email
      const docNumber = body.doc_number || null

      api.findCustomerByEmail(storeId, email, docNumber, (err, id, customer) => {
        if (!err && typeof customer === 'object' && customer !== null) {
          if (customer.login === false) {
            return blockLogin(res)
          }
          let token
          let level = 0
          if (docNumber) {
            // generate jwt with auth level 2
            level = 2
            token = auth.generateToken(storeId, customer._id, level, customer.enabled)
          } else {
            // no token for email only authentication
            token = null
          }
          res.json({
            customer,
            auth: {
              id,
              token,
              level
            }
          })
        } else {
          res.status(403).json({
            status: 403,
            error: 'Forbidden, no profile found with email provided'
          })
        }
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
      res.json({ status })
    })

    app.listen(config.proxyPort, () => {
      logger.log('Running Express server on port ' + config.proxyPort)
    })
  }
})
