
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
}).on(
  'app_activation_link_clicked',
  mybot.close.bind(mybot, null)
).on('close', function() {
  console.log('socket closed')
}).listen()