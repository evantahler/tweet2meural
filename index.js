const Logger = require('./lib/logger.js')
const Meural = require('./lib/meural.js')

const logger = new Logger()
const meural = new Meural(process.env.MEURAL_EMAIL, process.env.MEURAL_PASSWORD)

async function main () {
  // log in
  logger.log(`logging into meural as ${meural.credentials.username}`)
  await meural.authenticate()
  logger.log(`using meural token ${meural.token}`)

  // load the meural canvas we want to use
  const canvases = await meural.devices()
  const canvas = canvases[0]
  logger.log(`controlling meural canvas "${canvas.alias}" (#${canvas.id})`)

  // create the gallery if needed
  let galleryName = process.env.MEURAL_GALLERY
  let galleryDescription = process.env.MEURAL_GALLERY
  let galleryOrientation = canvas.orientation
  const gallery = await meural.galleryCreate(galleryName, galleryDescription, galleryOrientation)
  logger.log(`using gallery "${gallery.name}" (#${gallery.id})`)

  // upload an image
  const image = await meural.upload('./samples/castle1.jpg')
  logger.log(`uploaded image (#${image.id})`)

  // add the image to the gallery
  await meural.addItemToGallery(image, gallery)
  logger.log(`image (#${image.id}) added to gallery (#${gallery.id})`)

  // tell the canvas to use the gallery
  await meural.useGallery(canvas, gallery)
  logger.log(`canvas (#${canvas.id}) using gallery (#${gallery.id})`)
}

async function runWithCatch () {
  try {
    await main()
  } catch (error) {
    if (error.response) {
      logger.logError(error, {
        data: JSON.stringify(error.response.data)
        // headers: JSON.stringify(error.response.headers)
        // config: JSON.stringify(error.response.config)
      })
    } else if (error.request) {
      logger.logError(error, error.request)
    } else {
      logger.logError(error)
    }

    process.exit(0)
  }
}

runWithCatch()
