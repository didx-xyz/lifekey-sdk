
# lifekey-sdk

## getting started

```bash
# generate a private key (first argument: name of key, second argument: path to key)
./bin/new_keypair my-key ~/my-agent

# create a user account (first argument: path to id file, second argument: path to private key, third argument: user email address, fourth argument: user nickname) and await a confirmation email
./bin/register ~/my-agent/my-id ~/my-agent/my-key.private my@email.address my-nickname

# create an env file
cp etc/env/blank.env.json etc/env/development.env.json

# fill it out
nano etc/env/development.env.json

# start
NODE_ENV=development node your-script.js
```

## example

```javascript
'use strict'
var sdk = require('lifekey-sdk')
var opts = {env_file_path: 'dev.env.json'}
var api = sdk.lifekey(opts)
var mybot = sdk.agent(opts)

mybot.on('open', function(express, socket) {
  console.log('socket listening at', socket.address())
  mybot.close()
}).on('close', function() {
  console.log('socket closed')
}).open()
```

## todo

- change `open` to `listen` and related events
- reconcile the `etc/env` story
- patch up pkgjson bin option