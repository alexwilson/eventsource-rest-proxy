const SseChannel = require('sse-channel')

// Create a single SSE Channel.
const channels = new Map()
const createChannel = name => channels.set(name,
  new SseChannel({
    historySize: 10,
    jsonEncode: true,
    cors: { origins: ['*'] }
  })
)

const channelExists = channelName => channels.has(channelName)

const getAllChannels = _ => channels.keys()

const subscribeToChannel = (req, res, channelName) => {
  channels.get(channelName).addClient(req, res)
}

const postToChannel = (message, channelName) => {
  channels.get(channelName).send(message)
}

module.exports = {
  createChannel,
  channelExists,
  getAllChannels,
  subscribeToChannel,
  postToChannel
}