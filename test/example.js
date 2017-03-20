
var {configure, agent, lifekey} = require('./index')

var config = configure({
  PORT: 3000,
  WEBHOOK_PATH: '/',
  // add your registration details here...
})

var api = lifekey(config)
var mybot = agent(config)

mybot.on('listening', function(express, socket) {
  console.log('socket listening at', socket.address())
}).on('app_activation_link_clicked', function() {
  console.log('link clicked!')
  mybot.close()
}).on('close', function() {
  console.log('socket closed')
}).listen()