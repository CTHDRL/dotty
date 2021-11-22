const path = require('path')
const ejs = require('ejs')
const fs = require('fs')

const destination = path.join('nfts')

const view = async () => {
  const data = fs.readFileSync(path.join(destination, 'manifest.json'))
  const nfts = JSON.parse(data)
  const template = fs.readFileSync(path.join(__dirname, 'nfts.html.ejs'), 'utf8')
  const html = ejs.render(template, { nfts })
  fs.writeFileSync(path.join(destination, 'nfts.html'), html)
}

view().then(process.exit)
