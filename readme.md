
# lifekey-sdk

## registering

run the tests first with `npm test`, and then get your user id and private key by providing your email, nickname, and webhook uri parts.

```bash
./bin/register '{
  "email": "name@example.com",
  "nickname": "example-bot",
  "webhook_scheme": "https://",
  "webhook_hostname": "example.com",
  "webhook_port": 80,
  "webhook_path": "/my-hook"
}' > ~/example-bot.json
```

you, alone, are responsible for your user id and private key (which have to be included when initialising your host) no provisions have been made for managing secrets, here.

## events

name | data
---- | ----
`user_connection_created` | `{uc_id, to_id, from_id}`
`user_connection_deleted` | `{uc_id}`
`information_sharing_agreement_request` | `{from_id, isar_id}`
`information_sharing_agreement_request_rejected` | `{isar_id}`
`information_sharing_agreement_request_accepted` | `{isa_id}`
`information_sharing_agreement_deleted` | `{isa_id}`
`information_sharing_agreement_updated` | `{isa_id}`
`resource_pushed` | `{isa_id, resource_ids}`
`sent_activation_email` | `{}`
`app_activation_link_clicked` | `{}`
`received_did` | `{did_value}`

## examples

* a bot that shuts down once its user account is activated

  ```javascript
  var {configure, agent, lifekey} = require('lifekey-sdk')

  var config = configure({
    PORT: 3000,
    WEBHOOK_PATH: '/',
    USER_ID: 1,
    SIGNING_KEY_PEM: 'your rsa key in pem format'
  })

  var api = lifekey(config)
  var mybot = agent(config)

  mybot.on('listening', function(express, socket) {
    console.log('socket listening at', socket.address())
  }).on('app_activation_link_clicked', function() {
    console.log('link clicked!')
    mybot.close()
  }).on('close', function() {
    console.log('socket closed')
  }).listen()
  ```

* a bot that accepts any and all user connection requests

  ```javascript
  var {configure, agent, lifekey} = require('lifekey-sdk')

  var config = configure({
    PORT: 3000,
    WEBHOOK_PATH: '/',
    USER_ID: 1,
    SIGNING_KEY_PEM: 'your rsa key in pem format'
  })

  var api = lifekey(config)
  var mybot = agent(config)

  mybot.on('listening', function(express, socket) {
    console.log('socket listening at', socket.address())
  }).on('user_connection_request', function(req) {
    api.user_connection.request.respond(
      req.ucr_id,
      true,
      console.log
    )
  }).on('close', function() {
    console.log('socket closed')
  }).listen()
  ```