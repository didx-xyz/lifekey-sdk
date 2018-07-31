
'use strict'

var fs = require('fs')
var rsa = require('node-rsa')

module.exports = function(env) {
  
  var required = [
    'PORT',
    'WEBHOOK_PATH',
    'SIGNING_KEY_PEM',
    'USER_ID'
  ]

  var optional = [
    'ACTIONS_PATH',
    'WEB_AUTH_PATH',
    'USER_DID',
    'AGENT_PING_TIME',
    'LIFEKEY_SERVER',
    'LIFEKEY_SERVER_PORT'
  ]

  required.forEach(function(key) {
    if (typeof env[key] === 'undefined') {
      throw new Error(
        'expected truthy value for ' + key + ' but got ' + env[key]
      )
    }
  })

  optional.forEach(function(key) {
    if (typeof env[key] === 'undefined') {
      env[key] = null
    }
  })

  try {
    var private_key = new rsa(env.SIGNING_KEY_PEM)
  } catch (e) {
    throw e
  }

  env.USER = {
    ID: env.USER_ID,
    DID: env.USER_DID,
    PRIVATE_KEY: private_key,
    PUBLIC_KEY: private_key.exportKey('pkcs1-public')
  }

  env.NODE_ENV = process.env.NODE_ENV || 'development'
  env._ = process.env._
  
  return env
}
