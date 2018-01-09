'use strict'

/**
 * @file E-Com Plus service for customer login and signup with Passportjs
 * @copyright E-Com Club. All rights reserved. Since 2016
 * <br>E-COM CLUB SOFTWARES PARA E-COMMERCE LTDA / CNPJ: 24.356.660/0001-78
 * @license MIT
 * @author E-Com Club
 */

// NodeJS filesystem module
const fs = require('fs')

function error (err) {
  // fatal error
  // log to file before exit
  let msg = '\n[' + new Date().toString() + ']\n'
  if (err) {
    if (err.hasOwnProperty('stack')) {
      msg += err.stack
    } else if (err.hasOwnProperty('message')) {
      msg += err.message
    } else {
      msg += err.toString()
    }
    msg += '\n'
  }

  fs.appendFile('/var/log/nodejs/_stderr', msg, () => {
    process.exit(1)
  })
}

process.on('uncaughtException', error)

// web application
// recieve requests from Nginx by reverse proxy
const web = require('./bin/web.js')
// read config file
fs.readFile('./config/config.json', 'utf8', (err, data) => {
  if (err) {
    // can't read config file
    error(err)
  } else {
    let config
    try {
      config = JSON.parse(data)
      // start web app
      web(config)
    } catch (e) {
      // invalid JSON
      error(new Error('config/config.json must contain valid JSON'))
    }
  }
})

// local application
// executable server side only
require('./bin/local.js')
