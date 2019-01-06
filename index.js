const Logger = require('./lib/logger.js')
const Meural = require('./lib/meural.js')
const Twitter = require('./lib/twitter.js')

const logger = new Logger()
const meural = new Meural(
  process.env.MEURAL_EMAIL,
  process.env.MEURAL_PASSWORD
)
const twitter = new Twitter(
  process.env.TWITTER_API_KEY,
  process.env.TWITTER_API_KEY_SECRET,
  process.env.TWITTER_ACCESS_TOKEN,
  process.env.TWITTER_ACCESS_TOKEN_SECRET,
  process.env.TWITTER_TAG
)

let gallery
let canvas

twitter.on('tweet', handleTweet)
twitter.on('error', (error) => { throw error })

async function main () {
  // log in to Meural
  logger.log(`logging into meural as ${meural.credentials.username}`)
  await meural.authenticate()
  logger.log(`using meural token ${meural.token}`)

  // load the meural canvas we want to use
  const canvases = await meural.devices()
  canvas = canvases[0]
  logger.log(`controlling meural canvas "${canvas.alias}" (#${canvas.id})`)

  // create the gallery if needed
  let galleryName = process.env.MEURAL_GALLERY
  let galleryDescription = process.env.MEURAL_GALLERY
  let galleryOrientation = canvas.orientation
  gallery = await meural.galleryCreate(galleryName, galleryDescription, galleryOrientation)
  logger.log(`using gallery "${gallery.name}" (#${gallery.id})`)

  // connec to Twitter
  await twitter.connect()
  logger.log(`connected to twitter and looking for tweets matching ${twitter.tag}`)
}

async function handleTweet (tweet) {
  let tweetCreatedAt = new Date(Date.parse(tweet.created_at))
  logger.log(`Got a matching tweet from @${tweet.user.screen_name} at ${tweetCreatedAt}: ${tweet.text}`)

  // download image attachments from the tweet
  const donwloadedTwitterAttachment = await twitter.downloadAttachment(tweet)
  if (donwloadedTwitterAttachment) {
    logger.log(`Downloaded the attachment from tweet...`)

    // upload the image to meural
    const image = await meural.upload(donwloadedTwitterAttachment)
    logger.log(`uploaded image (#${image.id})`)

    // add the image to the gallery
    await meural.addItemToGallery(image, gallery)
    logger.log(`image (#${image.id}) added to gallery ${gallery.name} (#${gallery.id})`)

    // tell the canvas to use the gallery
    await meural.useGallery(canvas, gallery)
    logger.log(`canvas ${canvas.alias} (#${canvas.id}) using gallery (#${gallery.id})`)
  }
}

async function runWithCatch (method) {
  try {
    await method()
  } catch (error) {
    if (error.response) {
      logger.logError(error, {
        data: JSON.stringify(error.response.data)
      })
    } else if (error.request) {
      logger.logError(error, error.request)
    } else {
      logger.logError(error)
    }

    process.exit(0)
  }
}

async function shutdown () {
  await twitter.disconnect()

  if (gallery) {
    logger.log('cleaning up...')
    const images = await meural.galleryItems(gallery)
    for (let i in images) {
      let image = images[i]
      await meural.imageDelete(image)
      logger.log(`deleted image ${image.name} (#${image.id})`)
    }

    await meural.galleryDelete(gallery)
    logger.log(`deleted gallery ${gallery.name} (#${gallery.id})`)
  }

  logger.log('bye!')
  return process.exit()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

runWithCatch(main)
