
'use strict'

var fs = require('fs')

var ursa = require('ursa')

module.exports = function(env) {
  
  var required = [
    'PORT',
    'WEBHOOK_PATH',
    'SIGNING_KEY_PEM',
    'USER_ID'
  ]
  
  Object.keys(env).forEach(function(key) {
    if (!~required.indexOf(key)) {
      throw new TypeError('expected truthy value for ' + key + ' but got ' + typeof env[key])
    }
  })

  try {
    var private_key = ursa.coercePrivateKey(env.SIGNING_KEY_PEM)
  } catch (e) {
    throw e
  }

  env.USER = {
    ID: env.USER_ID,
    PRIVATE_KEY: private_key,
    PUBLIC_KEY: private_key.toPublicPem('utf8')
  }

  env.NODE_ENV = process.env.NODE_ENV || 'development'
  env._ = process.env._
  
  return env
}