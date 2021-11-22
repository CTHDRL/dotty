const ipfsClient = require('ipfs-http-client')
const Promise = require('bluebird')
const dotenv = require('dotenv')
const chalk = require('chalk')
const path = require('path')
const btoa = require('btoa')
const fs = require('fs')

dotenv.config()

const destination = path.join('nfts')

const publish = async () => {
  const authToken = [
    process.env.INFURA_PROJECT_ID,
    process.env.INFURA_PROJECT_SECRET
  ].join(':')
  const ipfs = ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: `Basic ${authToken}`
    }
  })
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

publish().then(process.exit)
