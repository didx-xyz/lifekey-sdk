var lifekey = require('../src/lifekey.js')
var agent = require('../src/agent.js')
var express = require('express')

let now = `${Date.now()}`

let proxy_host = process.env.PROXY_HOST
let port = process.env.SERVER_PORT

let [
  mock_idbot,
  mock_lifekey
] = [
  `ib${now}`,
  `lk${now}`
].map(fudge=>{

  let nick = `idbot-e2e-test-${fudge}`
  let hook = `/port${port}/${nick}`

  return {
    email: `${process.env.GMAIL_USERNAME}+${nick}@gmail.com`,
    nickname: nick,
    webhook_path: hook,
    webhook_url: `${proxy_host}${hook}`
  }
})

lifekey().user.register(mock_idbot, (e, idbot_creds)=>{ if (e) return console.error(e)
  lifekey().user.register(mock_lifekey, (e, lifekey_creds)=>{ if (e) return console.error(e)

    let idbot_pds = lifekey(idbot_creds)
    let client_pds = lifekey(lifekey_creds)

    let idbot_server = agent({
      WEBHOOK_PATH: mock_idbot.webhook_path,
    })
    let client_server = agent({
      WEBHOOK_PATH: mock_lifekey.webhook_path
    })

    let server = express()

    server.use(idbot_server.middleware())
    server.use(client_server.middleware())

    server.listen(port, () => {
      console.error(`listening on ${port}`)
      client_server.on('app_activation_link_clicked', ()=>{console.log('client clicked activation link')})
      idbot_server.on('app_activation_link_clicked', ()=>{console.log('idbot clicked activation link')})
      // After these two have been activated, store data on lifekey_pds, set eventhandlers on idbot, then connect lifekey_pds with idbot
    })
  })
})

