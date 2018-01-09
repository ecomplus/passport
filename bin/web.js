'use strict'

// log on files
const logger = require('./../lib/Logger.js')

// https://www.npmjs.com/package/rest-auto-router
const restAutoRouter = require('rest-auto-router')

// NodeJS filesystem module
const fs = require('fs')

// web server configuration
const conf = {
  // path to routes folder
  'path': process.cwd() + '/routes/',

  /*
  // listened tcp port
  // should be opened for localhost only
  'port': 3000,
  // part of the URL to be deleted in routing
  // like RewriteBase of Apache Httpd mod_rewrite
  'base_uri': '/v1/',
  // must be configured in common with proxy server
  'proxy': {
    // request timeout in ms
    'timeout': 30000,
    // X-Authentication header
    'auth': 'ABC'
  },
  */

  // default error messages
  // used when messages are null
  'error_messages': {
    'dev': 'Unknow error',
    'usr': {
      'en_us': 'Unexpected error, report to support or responsible developer',
      'pt_br': 'Erro inesperado, reportar ao suporte ou desenvolvedor responsável'
    }
  },
  // allow clients to specify what fields to receive from resource
  // if true, response should vary by http param 'fields'
  'vary_fields': false
}

// read config file
fs.readFile('./../config/config.json', 'utf8', (err, data) => {
  if (err) {
    // can't read config file
    throw err
  } else {
    let config = JSON.parse(data)

    // complete configurations for rest auto router
    conf.port = config.http.port
    conf.base_uri = config.http.base_uri
    conf.proxy = config.http.proxy

    // start web application
    // recieve requests from Nginx by reverse proxy
    restAutoRouter(conf, null, logger)
  }
})
