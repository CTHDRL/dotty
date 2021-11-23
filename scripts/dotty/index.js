const ipfsClient = require('ipfs-http-client')
const { createCanvas } = require('canvas')
const Promise = require('bluebird')
const dotenv = require('dotenv')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const chalk = require('chalk')
const path = require('path')
const ejs = require('ejs')
const fs = require('fs')

dotenv.config()

const destination = path.join('nfts')
const width = 1000
const height = 1000
const steps = 20
const buffer = 10

const _drawRect = (context, hex) => {
  context.fillStyle = `#${hex}`
  context.fillRect(0, 0, width, height)
}

const _drawCircle = (context, x, y, r, lw) => {
  context.beginPath()
  context.arc(x, y, r, 0, Math.PI * 2)
  context.lineWidth = lw
  context.strokeStyle = 'rgba(255,255,255, .25)'
  context.fillStyle = 'rgba(255,255,255, .5)'
  context.save()
  context.clip()
  context.fill()
  context.stroke()
  context.restore()
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
      _drawCircle(context, r + (r * 2 * w), r + (r * 2 * h), r - (buffer / 2), 10, hex)
    })
  })

  fs.writeFileSync(path.join(destination, `${hex}.png`), canvas.toBuffer('image/png'))

}

const _toHex = (int) => {
  const hex = int.toString(16)
  return hex.length < 2 ? `0${hex}` : hex
}

const _getIpfs = () => {
  return ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: `Basic ${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`
    }
  })
}

const generate = async () => {
  rimraf.sync(destination)
  mkdirp.sync(destination)
  const delta = 50
  const steps = Math.floor(255 / delta)
  Array(steps).fill(0).map((i, r) => {
    Array(steps).fill(0).map((j, g) => {
      Array(steps).fill(0).map((k, b) => {
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
  const files = fs.readdirSync(destination)
  const manifest = await Promise.reduce(files, async (manifest, file) => {
    const hex = path.basename(file, '.png')
    const data = fs.readFileSync(path.join(destination, file))
    const address = await ipfs.add(data)
    console.log(chalk.hex(hex)(`Publishing ${hex}: https://ipfs.infura.io/ipfs/${address.path}`))
    return [
      ...manifest,
      {
        hex,
        path: address.path
      }
    ]
  }, [])
  fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify(manifest))
}

const html = async () => {
  const ipfs = _getIpfs()
  const data = fs.readFileSync(path.join(destination, 'manifest.json'))
  const nfts = JSON.parse(data)
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
