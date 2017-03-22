
var {configure, agent, lifekey} = require('lifekey-sdk')

var config = configure({
  PORT: 8444,
  WEBHOOK_PATH: '/',
  // ...
  // credentials go here...
  // ...
})

var api = lifekey(config)
var pirate_name_bot = agent(config)

function pirate_name_generator(given_name) {
  return 'peg-leg'
}

pirate_name_bot.on('listening', function(express, socket) {
  console.log('socket listening at', socket.address())
}).on('close', function() {
  console.log('closed')
}).on('user_connection_request', function(msg) {
  console.log('connection request', msg.data)
  api.user_connection.request.respond(
    msg.data.ucr_id,
    true,
    function(err, res) {
      if (err) return console.log(err)
      api.information_sharing_agreement.request.send({
        user_id: msg.data.from_id,
        purpose: 'for lols',
        license: 'yeah',
        optional_schemas: [],
        requested_schemas: [
          'schema.org/Person/givenName'
        ]
      }, function(err, res) {
        if (err) console.log('error sending ISAR', err)
        else console.log('sent ISAR', res)
      })
    }
  )
}).on('information_sharing_agreement_request_accepted', function(msg) {
  console.log('ISAR accepted', msg.data)
  api.information_sharing_agreement.pull(msg.data.isa_id, function(err, res) {
    // res.user_data is an array of resources
    if (err) return console.log(err)
    api.information_sharing_agreement.push(msg.data.isa_id, [{
      name: 'pirate name',
      description: 'your name, just pirate',
      schema: 'schema.org/Person/givenName',
      value: pirate_name_generator(res.user_data[0].value)
    }], function(err, res) {
      if (err) console.log('error pushing resource', err)
      else console.log('resource pushed')
    })
  })
}).on('information_sharing_agreement_request_rejected', function(msg) {
  console.log('ISAR rejected')
}).on('close', function() {
  console.log('socket closed')
}).listen()