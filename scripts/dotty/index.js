const ipfsClient = require('ipfs-http-client')
const { createCanvas } = require('canvas')
const Promise = require('bluebird')
const dotenv = require('dotenv')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const chalk = require('chalk')
const btoa = require('btoa')
const path = require('path')
const _ = require('lodash')
const ejs = require('ejs')
const fs = require('fs')

dotenv.config()

const destination = path.join('nfts')
const width = 1000
const height = 1000
const steps = 20
const buffer = 10
const delta = 50

const _drawRect = (context, hex) => {
  context.fillStyle = `#${hex}`
  context.fillRect(0, 0, width, height)
}

const _drawCircle = (context, x, y, r) => {
  context.beginPath()
  context.arc(x, y, r, 0, Math.PI * 2)
  context.fillStyle = 'rgba(255,255,255, .5)'
  context.fill()
}

const _generate = (hex) => {

  console.log(chalk.hex(hex)(`Generating ${hex}`))

  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')

  _drawRect(context, hex)

  Array(steps).fill(0).map((i, w) => {
    Array(steps).fill(0).map((j, h) => {
      if(Math.round(Math.random()) === 0) return
      const r = width / (steps * 2)
      _drawCircle(context, r + (r * 2 * w), r + (r * 2 * h), r - (buffer / 2))
    })
  })

  fs.writeFileSync(path.join(destination, `${hex}.png`), canvas.toBuffer('image/png'))

}

const _toHex = (int) => {
  const hex = int.toString(16)
  return _.padStart(hex, 2, 0)
}

const _toHexID = (hex) => {
  return _.padStart(hex, 64, 0)
}

const _getIpfs = () => {
  const token = btoa(`${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`)
  return ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: `Basic ${token}`
    }
  })
}

const _publishData = async (ipfs, manifest, ext) => {
  let hash = null
  let keys = []
  for await (const file of ipfs.addAll(manifest, { wrapWithDirectory: true })) {
    if(file.path === '') hash = file.cid.toString()
    if(path.extname(file.path) === ext) keys.push(file.path)
  }
  return keys.map(key => {
    const uri = `https://ipfs.infura.io/ipfs/${hash}/${key}`
    console.log(`Publishing ${uri}`)
    return uri
  })
}

const _publishImages = async (ipfs, files) => {
  const manifest = await Promise.reduce(files, async (manifest, file) => {
    const hex = path.basename(file, '.png')
    const hexID = _toHexID(hex)
    const content = fs.readFileSync(path.join(destination, file))
    return [
      ...manifest,
      {
        path: `images/${hexID}.png`,
        content
      }
    ]
  }, [])
  return await _publishData(ipfs, manifest, '.png')
}

const _publishMetadata = async (ipfs, images) => {
  const manifest = await Promise.reduce(images, async (manifest, image) => {
    const hexID = path.basename(image, '.png')
    const hex = _.padStart(parseInt(hexID, 16).toString(16), 0, 6)
    return [
      ...manifest,
      {
        path: `metadata/${hexID}.json`,
        content: JSON.stringify({
          name: hex.toUpperCase(),
          description: `A dotty based on #${hex}`,
          image,
          properties: {
            color: `#${hex}`
          }
        })
      }
    ]
  }, [])
  return await _publishData(ipfs, manifest, '.json')
}

const generate = async () => {
  rimraf.sync(destination)
  mkdirp.sync(destination)
  const steps = Math.floor(255 / delta)
  Array(steps).fill(0).map((i, b) => {
    Array(steps).fill(0).map((j, g) => {
      Array(steps).fill(0).map((k, r) => {
        const red = _toHex(r * delta)
        const green = _toHex(g * delta)
        const blue = _toHex(b * delta)
        const hex = `${red}${green}${blue}`
        _generate(hex)
      })
    })
  })
}

const assets = async () => {
  const ipfs = _getIpfs()
  const files = fs.readdirSync(destination).sort((afile,bfile) => {
    const adec = parseInt(path.basename(afile, '.png'), 16)
    const bdec = parseInt(path.basename(bfile, '.png'), 16)
    return adec <= bdec ? -1 : 1
  })
  const images = await _publishImages(ipfs, files)
  const metadata = await _publishMetadata(ipfs, images)

  fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify(images))
}

const html = async () => {
  const ipfs = _getIpfs()
  const data = fs.readFileSync(path.join(destination, 'manifest.json'))
  const nfts = JSON.parse(data).map(uri => ({
    hex: _.padStart(parseInt(path.basename(uri, '.png'), 16).toString(16), 6, 0),
    image: uri
  }))
  const template = fs.readFileSync(path.join(__dirname, 'nfts.html.ejs'), 'utf8')
  const html = ejs.render(template, { nfts })
  const address = await ipfs.add(html)
  console.log(`https://ipfs.infura.io/ipfs/${address.path}`)
}

const dotty = async () => {
  const args = process.argv.slice(2)
  const command = args[0] || 'generate'
  if(command === 'generate') await generate()
  if(command === 'publish:assets') await assets()
  if(command === 'publish:html') await html()
}

dotty().then(process.exit)
