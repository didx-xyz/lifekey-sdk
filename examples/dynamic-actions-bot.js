
var {configure, agent, lifekey} = require('lifekey-sdk')

var config = configure({
  PORT: 3000,
  WEBHOOK_PATH: '/',
  ACTIONS_PATH: '/actions',
  // credentials go here
})

var api = lifekey(config)
var mybot = agent(config)

mybot.on('listening', function(express, socket) {
  console.log('socket listening at', socket.address())
}).on('get_actions', function(user, respond) {
  if (user.id === 'foo') respond([1, 2, 3])
  else respond([4, 5, 6])
}).listen()