const ipfsClient = require('ipfs-http-client')
const { createCanvas } = require('canvas')
const Promise = require('bluebird')
const dotenv = require('dotenv')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const moment = require('moment')
const chalk = require('chalk')
const btoa = require('btoa')
const path = require('path')
const _ = require('lodash')
const ejs = require('ejs')
const fs = require('fs')

dotenv.config()

const destination = path.join('dist')
const width = 1000
const height = 1000
const steps = 20
const buffer = 10
const delta = 50

const _generate = (hex, index) => {
  console.log(chalk.hex(hex)(`Generating ${index}:${hex}`))
  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')
  context.fillStyle = `#${hex}`
  context.fillRect(0, 0, width, height)
  Array(steps).fill(0).map((i, w) => {
    Array(steps).fill(0).map((j, h) => {
      if(Math.round(Math.random()) === 0) return
      const r = width / (steps * 2)
      context.beginPath()
      context.arc(r + (r * 2 * w), r + (r * 2 * h), r - (buffer / 2), 0, Math.PI * 2)
      context.fillStyle = 'rgba(255,255,255, .5)'
      context.fill()
    })
  })
  fs.writeFileSync(path.join(destination, 'images', `${index}.png`), canvas.toBuffer('image/png'))
  fs.writeFileSync(path.join(destination, 'json', `${index}.json`), JSON.stringify({
    name: `Dotty ${index}`,
    description: `A colorized dotty`,
    edition: 1,
    date: moment().format('X'),
    attributes: [
      {
        trait_type: 'Color',
        value: `#${hex}`
      }
    ]
  }))
}

const _toHex = (int) => {
  return _.padStart(int.toString(16), 6, 0)
}

const _toIndex = (int) => {
  return _.padStart(int, 4, 0)
}

const _toAddress = (id) => {
  return _.padStart(id.toString(16), 64, 0)
}

const _publishData = async (ipfs, manifest, ext) => {
  let hash = null
  let keys = []
  for await (const file of ipfs.addAll(manifest, { wrapWithDirectory: true })) {
    if(file.path === '') hash = file.cid.toString()
    if(path.extname(file.path) === ext) keys.push(file.path)
  }
  return keys.map(key => {
    return `https://ipfs.infura.io/ipfs/${hash}/${key}`
  })
}

const generate = async () => {
  rimraf.sync(destination)
  mkdirp.sync(path.join(destination, 'images'))
  mkdirp.sync(path.join(destination, 'json'))
  const steps = Math.floor(256 / delta)
  Array(steps).fill(0).map((i, r) => {
    Array(steps).fill(0).map((j, g) => {
      Array(steps).fill(0).map((k, b) => {
        const index = _toIndex((r * steps * steps) + (g * steps) + b)
        const hex = _toHex((256 * 256 * 50 * r) + (256 * 50 * g) + (50 * b))
        _generate(hex, index)
      })
    })
  })
}

const publish = async () => {
  const token = btoa(`${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`)
  const ipfs = ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: `Basic ${token}`
    }
  })
  const files = fs.readdirSync(path.join(destination, 'images'))
  const manifest = await Promise.reduce(files, async (manifest, file) => {
    const basename = path.basename(file, '.png')
    const id = parseInt(basename)
    return {
      ...manifest,
      [id]: {
        address: _toAddress(id),
        content: fs.readFileSync(path.join(destination, 'images', `${basename}.png`)),
        metadata: JSON.parse(fs.readFileSync(path.join(destination, 'json', `${basename}.json`), 'utf8'))
      }
    }
  }, {})
  const images = Object.values(manifest).map(item => ({
    path: `${item.address}.png`,
    content: item.content
  }))
  const imageUrls = await _publishData(ipfs, images, '.png')
  imageUrls.map(imageUrl => {
    const id = parseInt(path.basename(imageUrl, '.png'), 16)
    manifest[id].metadata.image = imageUrl
  })
  const metadatas = Object.values(manifest).map(item => ({
    path: `${item.address}.json`,
    content: JSON.stringify(item.metadata)
  }))
  const metadataUrls = await _publishData(ipfs, metadatas, '.json')
  metadataUrls.map(metadataUrl => {
    const id = parseInt(path.basename(metadataUrl, '.json'), 16)
    manifest[id].metadataUrl = metadataUrl
  })
  const template = fs.readFileSync(path.join(__dirname, 'nfts.html.ejs'), 'utf8')
  const html = ejs.render(template, { moment, nfts: Object.values(manifest) })
  const address = await ipfs.add(html)
  console.log(`https://ipfs.infura.io/ipfs/${address.path}`)
}

const dotty = async () => {
  const args = process.argv.slice(2)
  const command = args[0] || 'generate'
  if(command === 'generate') await generate()
  if(command === 'publish') await publish()
}

dotty().then(process.exit)
