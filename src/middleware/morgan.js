const morgan = require('morgan')

// Log all requests to stdout.
morgan.token('id', req => req.id)
const loggingMiddleware = morgan('Request: :id :remote-addr :method :url', {immediate: true})

module.exports = loggingMiddleware
