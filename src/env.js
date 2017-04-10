
'use strict'

var fs = require('fs')

var ursa = require('ursa')

module.exports = function(env) {
  
  var required = [
    'PORT',
    'WEBHOOK_PATH',
    'ACTIONS_PATH',
    'SIGNING_KEY_PEM',
    'USER_ID'
  ], env_keys = Object.keys(env)

  required.forEach(function(key) {
    if (typeof env[key] === 'undefined') {
      throw new Error(
        'expected truthy value for ' + key + ' but got ' + env[key]
      )
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