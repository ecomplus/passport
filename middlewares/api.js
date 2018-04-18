'use strict'

module.exports = (req, res, next) => {
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
}
