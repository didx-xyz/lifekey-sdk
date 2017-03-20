
'use strict'

var fs = require('fs')

var ursa = require('ursa')

var NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = function(env) {
  
  var required = [
    'PORT',
    'WEBHOOK_PATH',
    'SIGNING_KEY_PEM',
    'USER_ID'
  ]
  
  Object.keys(env).forEach(function(key) {
    if (!~required.indexOf(key)) {
      console.log('missing required env option', key)
      console.log('exiting...')
      process.exit(1)
    }
  })

  try {
    var private_key = ursa.coercePrivateKey(env.SIGNING_KEY_PEM)
  } catch (e) {
    console.log('unable to initialise an ursa private key instance', e)
    console.log('exiting...')
    process.exit(1)
  }

  env.USER = {
    ID: env.USER_ID,
    PRIVATE_KEY: private_key,
    PUBLIC_KEY: private_key.toPublicPem('utf8')
  }

  env.NODE_ENV = NODE_ENV
  env._ = process.env._
  
  return env
}