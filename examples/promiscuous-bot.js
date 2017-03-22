
var {configure, agent, lifekey} = require('lifekey-sdk')

var config = configure({
  PORT: 3000,
  WEBHOOK_PATH: '/',
  // credentials go here
})

var api = lifekey(config)
var mybot = agent(config)

mybot.on('listening', function(express, socket) {
  console.log('socket listening at', socket.address())
}).on('user_connection_request', function(msg) {
  api.user_connection.request.respond(
    msg.data.ucr_id,
    true,
    console.log
  )
}).on('close', function() {
  console.log('socket closed')
}).listen()