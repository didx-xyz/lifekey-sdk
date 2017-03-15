
'use strict'

var lifekey = require('./lib/lifekey')()
var agent = require('./lib/agent')

agent.on('open', function(express, socket) {
  console.log('listening on', socket.address())
  agent.close()
}).on('close', function() {
  console.log('server closed')
}).open()