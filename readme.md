
# lifekey-sdk

## getting started

```bash
# generate a private key (first argument: name of key, second argument: path to key)
./bin/new_keypair name-of-key \
                  /path/to/key/storage

./bin/register /path/to/my/user/storage \
               /path/to/my/private/key \
               my@email.address \
               my-nickname \
               my-scheme \
               my-hostname \
               my-port \
               my-path

# fill it out
nano etc/env/development.env.json

# start
NODE_ENV=development node your-script.js
```

## configuring

<!-- todo - RC table -->

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

## example

```javascript
var {configure, agent, lifekey} = require('lifekey-sdk')
var config = configure({
  SCHEME: 'http://',
  HOSTNAME: 'myhostname.com',
  PORT: 0,
  WEBHOOK_PATH: '/my/hook/path',
  RSA_KEY_PATH: '/path/to/your/private/key',
  USER_PATH: '/path/to/your/user/record/data'
})
var api = lifekey(config)
var mybot = agent(config)

mybot.on('listening', function(express, socket) {
  console.log('socket listening at', socket.address())
  mybot.close()
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