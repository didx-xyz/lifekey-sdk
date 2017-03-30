var lifekey = require('../src/lifekey.js')
var agent = require('../src/agent.js')
var express = require('express')

let now = `${Date.now()}`

let proxy_host = process.env.PROXY_HOST
let port = process.env.SERVER_PORT

let [
  badgebot,
  mock_app
] = [
  `ib${now}`,
  `lk${now}`
].map(fudge=>{

  let nick = `badgebot-e2e-test-${fudge}`
  let hook = `/port${port}/${nick}`

  return {
    email: `${process.env.GMAIL_USERNAME}+${nick}@gmail.com`,
    nickname: nick,
    webhook_path: hook,
    webhook_url: `${proxy_host}${hook}`
  }
})


lifekey().user.register(badgebot, (e, badgebot_creds) => {
  if (e) return console.error(e)
  lifekey().user.register(mock_app, (e, mock_app_creds) => {
    if (e) return console.error(e)

    let badgebot_pds   = lifekey(badgebot_creds)
    let mock_app_pds   = lifekey(mock_app_creds)
    let badgebot_agent = agent({ WEBHOOK_PATH: badgebot.webhook_path })
    let mock_app_agent = agent({ WEBHOOK_PATH: mock_app.webhook_path })

    // Attach event handlers

    mock_app_agent.on('app_activation_link_clicked', () => {
      console.log('mock_app clicked activation link')
    })
    badgebot_agent.on('app_activation_link_clicked', () => {
      console.log('badgebot clicked activation link')
    })
    badgebot_agent.on('user_connection_request', (con) => {
      // Accept Connection Request
      return badgebot_pds.user_connection.request.respond(
        con.data.ucr_id,
        true,
        (err) => {
          if (err) return console.error(err)
          // Send Information Sharing Agreement Request
          return badgebot_pds.information_sharing_agreement.request.send({
            user_id: con.data.from_id,
            purpose: 'demonstration',
            license: 'expired',
            optional_schemas: [],
            requested_schemas: {
              'schema.cnsnt.io/identity'
            }
          }, (err, res) => { if (err) return console.error(err)
            return console.log('badgebot requested information sharing agreement')
          })
        }
      )
    })
    mock_app_agent.on('information_sharing_agreement_request', (isa) => {
      // Accept information sharing agreement
      return mock_app_pds.information_sharing_agreement.respond(
        isa.data.isar_id, {
          accepted: true,
          permitted_resources: [ 'schema.cnsnt.io/identity' ]
        }, (err, res) => { if (err) return console.error(err)
          return console.log('Mock app accepted ISA Request')
        }
      )
    })
    badgebot_agent.on('information_sharing_agreement_request_accepted', (isa) => {
      // TODO: Fetch resource from mock client PDR
      // TODO: Generate Verifiable Claim
      // TODO: Push Verifiable Claim to client PDR
    })
    mock_app_agent.on('resource_pushed', () => {
      // TODO: Report (console.log) that Verifiable Claim has been received
    })

    let server = express()
    server.use(badgebot_agent.middleware())
    server.use(mock_app_agent.middleware())
    server.listen(port, () => {
      console.error(`listening on ${port}`)
      // TODO: mock client stores resource (id number)
      mock_app_pds.resource.push()
      // TODO: mock client sends connection request to badgebot
    })
  })
})

