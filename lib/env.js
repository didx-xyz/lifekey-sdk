
'use strict'

var fs = require('fs')

var ursa = require('ursa')

var env, NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = function(env_file_path) {
  if (env) return env
  if (!(env_file_path && env)) {
    console.log('no env file path given for', NODE_ENV)
    console.log('exiting...')
    process.exit(1)
  }

  try {
    env = require(env_file_path + '/' + NODE_ENV + '.env.json')
  } catch (e) {
    console.log('unable to find matching env file for', NODE_ENV)
    console.log('exiting...')
    process.exit(1)
  }

  var required = [
    'SCHEME',
    'HOSTNAME',
    'PORT',
    'WEBHOOK_PATH',
    'RSA_KEY_PATH',
    'USER_PATH'
  ]
  
  Object.keys(env).forEach(function(key) {
    if (!~required.indexOf(key)) {
      console.log('missing required env option', key)
      console.log('exiting...')
      process.exit(1)
    }
  })

  try {
    env.USER = require(env.USER_PATH)
  } catch (e) {
    console.log('cannot read user id file from disk')
    console.log('have you registered yet?')
    console.log('exiting...')
    process.exit(1)
  }

  try {
    env.USER.PRIVATE_KEY = ursa.coercePrivateKey(
      fs.readFileSync(env.RSA_KEY_PATH)
    )
  } catch (e) {
    console.log('unable to initialise an ursa private key instance', e)
    console.log('exiting...')
    process.exit(1)
  }
  
  try {
    env.USER.PUBLIC_KEY = env.USER.PRIVATE_KEY.toPublicPem('utf8')
  } catch (e) {
    console.log('unable to create public key pem', e)
    console.log('exiting...')
    process.exit(1)
  }

  env.NODE_ENV = NODE_ENV
  env._ = process.env._
  
  return env
}