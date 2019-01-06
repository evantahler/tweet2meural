const TwitterLite = require('twitter-lite')
const EventEmitter = require('events')
const axios = require('axios')
const fs = require('fs-extra')
const path = require('path')

class Twitter extends EventEmitter {
  constructor (apiKey, apiKeySecret, accessToken, accessTokenSecret, tag) {
    super()

    this.state = 'disconnected'

    this.client = new TwitterLite({
      subdomain: 'api',
      consumer_key: apiKey,
      consumer_secret: apiKeySecret,
      access_token_key: accessToken,
      access_token_secret: accessTokenSecret
    })

    this.stream = null
    this.tag = tag

    this.downloadFolder = '/tmp/tweet2meural/downloads'
    fs.mkdirpSync(this.downloadFolder)
  }

  async connect () {
    return new Promise((resolve) => {
      this.stream = this.client.stream('statuses/filter', { track: this.tag })

      this.stream.on('ping', () => { this.emit('ping') })
      this.stream.on('data', (tweet) => { this.emit('tweet', tweet) })
      this.stream.on('error', (error) => { this.emit('error', error) })
      this.stream.on('start', () => { this.state = 'connected' })
      this.stream.on('end', () => { this.emit('end') })

      this.stream.once('start', () => { return resolve() })
    })
  }

  disconnect () {
    if (this.stream) { this.stream.destroy() }
    this.removeAllListeners()
  }

  async downloadAttachment (tweet) {
    if (!tweet.entities.media) { return }
    const url = tweet.entities.media[0].media_url_https
    const downloadPath = path.join(this.downloadFolder, path.basename(url))
    const writer = fs.createWriteStream(downloadPath)
    const response = await axios({ method: 'get', url, responseType: 'stream' })
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', () => { return resolve(downloadPath) })
      writer.on('error', () => { return reject(downloadPath) })
    })
  }
}

module.exports = Twitter
