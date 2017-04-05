const express = require('express')
const bodyParser = require('body-parser')
const requestId = require('./middleware/requestId')
const morgan = require('./middleware/morgan')
const uuid = require('uuid/v4')
const {createChannel, getAllChannels, channelExists, subscribeToChannel, postToChannel} = require('./channels.js')

const app = express()
app.use(requestId)
app.use(bodyParser.json())
app.use(morgan)

const canCreateNewChannels = process.env.CAN_CREATE_CHANNELS || false

// Handle POSTs to our endpoint.
app.post('/v1/send(/:channel)?', (req, res) => {
  const response = {
    status: 200,
    detail: 'Message received',
    id: req.id
  }

  const channel = req.params.channel || 'default'

  try {
    // Check that the channel exists.
    if (!channelExists(channel)) {
      const notFoundMessage = 'Channel Not Found'
      response.status = 404
      response.detail = notFoundMessage
      throw new Error(`Channel "${channel}" Not Found`)
    }

    // Post our message.
    const id = req.body.id || uuid()
    const event = req.body.type || 'message'
    const data = req.body.data || false
    if (!data) {
      const unprocessableEntityMessage = 'Unprocessable Entity'
      response.status = 422
      response.detail = unprocessableEntityMessage
      throw new Error(unprocessableEntityMessage)
    }

    const message = {id, event, data}
    postToChannel(message, channel)
    console.log(`Message: "${channel}" -- "${JSON.stringify(message)}"`)
  } catch (e) {
    console.error(e.message)
  }

  res.status(response.status).json(response)
})

app.get('/v1/channels', (req, res) => {
  res.status(200).json(Array.from(getAllChannels()))
})

// Create new channels on the fly.
app.put('/v1/channels/:channel', (req, res) => {
  if (!canCreateNewChannels) {
    res.status(403).json({
      id: req.id,
      status: 403,
      details: 'Insufficient permissions.'
    })
  }

  const channel = req.params.channel

  if (channelExists(channel)) {
    res.status(400).json({
      id: req.id,
      status: 400,
      details: 'Duplicate channel'
    })
    return
  }

  const channelCreateMessage = `Channel "${channel}" created`
  createChannel(channel)
  console.log(`Event: ${channelCreateMessage}`)
  res.status(204).json({
    id: req.id,
    status: 204,
    detail: channelCreateMessage
  })
})

// Subscribe a client to a given channel.
app.get('/v1/subscribe(/:channel)?', (req, res) => {
  const channel = req.params.channel || 'default'
  if (!channelExists(channel)) {
    return res.status(404).json({
      id: req.id,
      status: 404,
      detail: `Channel "${channel}" not found.`
    })
  }
  console.log(`Subscribe: ${req.id} to "${channel}"`)
  subscribeToChannel(req, res, channel)
})

app.get('/doc', (req, res) => res.send('TBC.'))

// Redirect all remaining requests.
app.get('/*', (req, res) => res.redirect('/doc'))

app.listen(process.env.PORT || 5012, _ => {
  createChannel('default')
  console.log('Event: Server Started!')
})
