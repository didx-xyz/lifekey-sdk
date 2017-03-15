
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

# run test and start
npm test && NODE_ENV=development npm start
```