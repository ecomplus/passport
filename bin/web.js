'use strict'

// log on files
const logger = require('./../lib/Logger.js')

// NodeJS filesystem module
const fs = require('fs')

// read config file
fs.readFile(process.cwd() + '/config/config.json', 'utf8', (err, data) => {
  if (err) {
    // can't read config file
    throw err
  } else {
    let config = JSON.parse(data)

    // Express web framework
    // https://www.npmjs.com/package/express
    const express = require('express')
    // body parsing middleware
    const bodyParser = require('body-parser')

    // new Express application
    let app = express()

    app.use(bodyParser.json())
    app.get('/', (req, res) => {
      res.json({
        status: 'E-Com Plus Passport API is running'
      })
    })

    app.listen(config.http.port, () => {
      logger.log('Running Express server on port ' + config.http.port)
    })
  }
})
