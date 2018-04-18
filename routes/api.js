'use strict'

module.exports = (app, baseUri) => {
  app.use(baseUri + 'api/me.json', (req, res) => {
    // customer resource
  })

  app.use(baseUri + 'api/:resource/:id.json', (req, res, next) => {
    // treat API endpoints
    switch (req.params.resource) {
      case 'me':
        // customer resource
        break
      case 'cart':
      case 'order':
        break
      default:
        next()
    }
  })
}
