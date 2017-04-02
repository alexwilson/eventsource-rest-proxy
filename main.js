#!/usr/bin/env node

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const SseChannel = require('sse-channel')
const uuid = require('uuid/v4')

// Create a single SSE Channel.
const channel = new SseChannel({
  historySize: 10,
  jsonEncode: true,
  cors: { origins: ['*'] }
})

const app = express()

// Parse JSON bodies.
app.use(bodyParser.json())

// Assign an ID to every request.
app.use((req, res, next) => {
  req.id = uuid()
  next()
})

// Log all requests to stdout.
morgan.token('id', req => req.id)
app.use(morgan('Request: :id :remote-addr :method :url', { immediate: true }))

// Handle POSTs to our endpoint.
app.post('/v1/send', (req, res) => {
  const response = {
    status: 422,
    detail: 'Unprocessable entity',
    id: req.id
  }

  const id = req.body.id || uuid()
  const event = req.body.type || 'message'
  const data = req.body.data || false
  if (data) {
    const message = {id, event, data}
    channel.send(message)
    console.log(`Message: ${JSON.stringify(message)}`)
    response.status = 200
    response.detail = 'Message received'
  }
  res.status(response.status).json(response)
})

// Subscribe a client to a given channel.
app.get('/v1/subscribe', (req, res) => {
  channel.addClient(req, res)
})

app.get('/doc', (req, res) => res.send('TBC.'))

// Redirect all remaining requests.
app.get('/*', (req, res) => res.redirect('/doc'))

app.listen(process.env.PORT || 5012, _ => {
  console.log('Event: Server Started!')
})
