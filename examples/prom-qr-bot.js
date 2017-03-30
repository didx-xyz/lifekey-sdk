var lifekey = require('../src/lifekey.js')
var agent = require('../src/agent.js')
var express = require('express')
var qr = require('qrcode-terminal')

const PROXY_HOST = process.env.PROXY_HOST
const SERVER_PORT = process.env.SERVER_PORT
const GMAIL_USER = process.env.GMAIL_USER
const PDR_HOST = process.env.PDR_HOST

let nick = `prombot-qr-${Date.now()}`
let hook = `/port${SERVER_PORT}/${nick}`

let prom_cfg = {
  email: `${GMAIL_USER}+${nick}@gmail.com`,
  nickname: nick,
  webhook_path: hook,
  webhook_url: `${PROXY_HOST}${hook}`
}

lifekey().user.register(prom_cfg, (err, prom_creds) => {
  if (err) console.error(err)
  if (err) return process.exit(1)

  let prom_pdr = lifekey(prom_creds)
  let prom_api = agent({WEBHOOK_PATH: prom_cfg.webhook_path})

  prom_api.on('app_activation_link_clicked', () => {
    console.error('Activation link clicked! Scan to connect')

    let qrcode = `${PDR_HOST}/management/connection/${prom_creds.USER_ID}`

    qr.setErrorLevel('H')
    qr.generate(qrcode)
    console.log(qrcode)
  })

  prom_api.on('user_connection_request', (msg) => {
    console.log(msg)
    prom_pdr.user_connection.request.respond(
      msg.data.ucr_id,
      true,
      () => {
        console.log('User connection request auto accepted')
      }
    )
  })

  let server = express()
  server.use(prom_api.middleware())
  server.listen(SERVER_PORT, () => {
    console.error(`listening on ${SERVER_PORT}`)
    console.error(`Waiting for activation link to be clicked!`)
  })
})
