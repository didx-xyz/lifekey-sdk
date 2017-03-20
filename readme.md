
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
  api.user_connection.request.respond(req.ucr_id, true, function(err, res) {
    
  })
}).on('close', function() {
  console.log('socket closed')
}).listen()
```