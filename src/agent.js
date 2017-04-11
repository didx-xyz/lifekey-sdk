
'use strict'

var events = require('events')

function return_actions(ids) {
  this.status(200).json({
    error: false,
    status: 200,
    message: 'ok',
    body: ids
  })
}

module.exports = function(env) {
  var cors = require('cors')
  var morgan = require('morgan')
  var bodyParser = require('body-parser')
  var express = require('express')

  var server, http_server

  var agent = new events.EventEmitter

  agent.middleware = function() {
    return server
  }
  agent.listen = function() {
    http_server = server.listen(env.PORT, function() {
      agent.emit('listening', server, http_server)
    })
  }

  agent.close = function() {
    http_server.close(function() {
      agent.emit('close')
    })
  }

  server = express()
  server.enable('trust proxy')
  if (env.MORGAN) server.use(morgan('dev'))
  server.use(cors(/* TODO cors settings */))
  server.use(bodyParser.json())

  server.get(env.ACTIONS_PATH, function(req, res) {
    var heard = agent.emit('get_actions', {
      did: req.headers['x-cnsnt-did']
    }, return_actions.bind(res))
    if (!heard) return_actions.call(res, [])
  })

  server.post(env.WEBHOOK_PATH, function(req, res) {
    agent.emit('webhook', req.body.type || 'unknown', req.body, server, http_server)
    agent.emit(req.body.type || 'unknown', req.body, server, http_server)
    res.status(200).end()
  })

  server.use(function(err, req, res, next) {
    agent.emit('error', err, req)
    res.status(404).end('not found')
  })
  
  return agent
}
