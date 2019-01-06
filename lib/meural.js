const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')

class Meural {
  constructor (username, password, apiOrigin = 'https://api.meural.com', version = 'v0') {
    this.token = null

    this.credentials = {
      username,
      password
    }

    this.client = axios.create({
      baseURL: `${apiOrigin}/${version}`,
      timeout: 30 * 1000
    })
  }

  async getAll (path, page = 0, data = []) {
    const count = 100
    const response = await this.client.get(path, { count, page })
    if (response.data) {
      data = data.concat(response.data.data)
      if (data.length === response.data.count) { return data }
      return this.getAll(path, (page + count), data)
    } else {
      return data
    }
  }

  async authenticate (path = '/authenticate') {
    const response = await this.client.post(path, this.credentials)
    if (response.data && response.data.token) {
      this.token = response.data.token

      this.client = axios.create({
        baseURL: this.client.defaults.baseURL,
        timeout: 5000,
        headers: { 'Authorization': `Token ${this.token}` }
      })

      return this.token
    }
  }

  async devices (path = '/user/devices') {
    return this.getAll(path)
  }

  async galleries (path = '/user/galleries') {
    return this.getAll(path)
  }

  async galleryItems (gallery, path = '/galleries/:id/items') {
    path = path.replace(':id', gallery.id)
    return this.getAll(path)
  }

  async galleryCreate (name, description, orientation, path = '/galleries') {
    const galleries = await this.galleries()
    for (let i in galleries) {
      let gallery = galleries[i]
      if (gallery.name === name) { return gallery }
    }

    const response = await this.client.post(path, { name, description, orientation })
    if (response.data) { return response.data.data }
  }

  async useGallery (canvas, gallery, path = '/devices/:deviceId/galleries/:galleryId') {
    path = path.replace(':galleryId', gallery.id)
    path = path.replace(':deviceId', canvas.id)
    const response = await this.client.post(path)
    if (response.data) { return response.data.data }
  }

  async upload (file, path = '/items') {
    const form = new FormData()
    form.append('image', fs.createReadStream(file))
    const response = await this.client.post(path, form, { headers: form.getHeaders() })
    if (response.data) { return response.data.data }
  }

  async addItemToGallery (item, gallery, path = '/galleries/:galleryId/items/:itemId') {
    path = path.replace(':galleryId', gallery.id)
    path = path.replace(':itemId', item.id)
    const response = await this.client.post(path)
    if (response.data) { return response.data.data }
  }

  async imageDelete (image, path = '/items/:id') {
    path = path.replace(':id', image.id)
    const response = await this.client.delete(path)
    if (response.data) { return response.data.data }
  }

  async galleryDelete (gallery, path = '/galleries/:id') {
    path = path.replace(':id', gallery.id)
    const response = await this.client.delete(path)
    if (response.data) { return response.data.data }
  }
}

module.exports = Meural
