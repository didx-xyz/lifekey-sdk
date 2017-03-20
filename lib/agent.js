
'use strict'

var events = require('events')

module.exports = function(env) {
  var cors = require('cors')
  var morgan = require('morgan')
  var bodyParser = require('body-parser')
  var express = require('express')

  var server, http_server

  var agent = new events.EventEmitter

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
  server.use(morgan('dev'))
  server.use(cors())
  server.use(bodyParser.json())

  server.post(env.WEBHOOK_PATH, function(req, res) {
    agent.emit('webhook', req.body.type || 'unknown', req.body)
    agent.emit(req.body.type || 'unknown', req.body)
    res.status(200).end()
  })

  server.use(function(err, req, res, next) {
    agent.emit('error', err, req)
    res.status(404).end('not found')
  })
  
  return agent
}