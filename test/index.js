
var http = require('http')

var ursa = require('ursa')

var env = require('../lib/env')

describe('lifekey-sdk', function() {

  after(function() {
    process.exit(0)
  })

  describe('agent', function() {

    var agent
    beforeEach(function(done) {
      if (agent) {
        agent.removeAllListeners()
        agent.close()
      }
      agent = require('../lib/agent')({
        PORT: 3000, WEBHOOK_PATH: '/'
      })
      done()
    })
    
    it('should emit listening when socket is listening', function(done) {
      agent.on(
        'listening',
        done.bind(done, null)
      ).listen()
    })

    it('should emit close when socket closes', function(done) {
      agent.on(
        'listening',
        agent.close.bind(agent, null)
      ).on(
        'close',
        done.bind(done, null)
      ).listen()
    })

    it('should emit events based on incoming http requests', function(done) {
      
      agent.on('foo', done.bind(done, null))
      
      agent.on('listening', function() {
        http.request({
          method: 'post',
          port: 3000,
          headers: {'content-type': 'application/json'}
        }).on('response', function(res) {
          if (res.statusCode !== 200) return done(new Error(res.statusCode))
        }).on('error', done).end(
          JSON.stringify({
            type: 'foo',
            notification: {
              title: 'foo',
              body: 'bar'
            },
            data: {
              foo: 'bar',
              baz: 'qux'
            }
          })
        )
      }).listen()
    })
  })

  describe('env', function() {

    it('should throw if not given all args', function(done) {
      
      var cases = [
        {},
        {WEBHOOK_PATH: true},
        {SIGNING_KEY_PEM: true},
        {USER_ID: true},
        {PORT: true},
        {
          WEBHOOK_PATH: true,
          SIGNING_KEY_PEM: true
        },
        {
          SIGNING_KEY_PEM: true,
          USER_ID: true
        },
        {
          PORT: true,
          USER_ID: true
        },
        {
          PORT: true,
          WEBHOOK_PATH: true
        },
        {
          WEBHOOK_PATH: true,
          SIGNING_KEY_PEM: true,
          USER_ID: true
        },
        {
          PORT: true,
          SIGNING_KEY_PEM: true,
          USER_ID: true
        },
        {
          PORT: true,
          WEBHOOK_PATH: true,
          USER_ID: true
        },
        {
          PORT: true,
          WEBHOOK_PATH: true,
          SIGNING_KEY_PEM: true
        }
        // lols ^^
      ]

      for (var c in cases) {
        try {
          env(cases[c])
        } catch (e) {
          continue
        }
        return done(new Error('should not have been called'))
      }
      
      return done()
    })
  
    it('should throw if not given an rsa private key', function(done) {
      try {
        env({
          PORT: 3000,
          WEBHOOK_PATH: '/',
          SIGNING_KEY_PEM: 'foo',
          USER_ID: 1
        })
      } catch (e) {
        return done()
      }
      return done(new Error('should not have been called'))
    })

    it('should return a copy with keypair attached', function(done) {
      try {
        var myenv = env({
          PORT: 3000,
          WEBHOOK_PATH: '/',
          SIGNING_KEY_PEM: ursa.generatePrivateKey(4096).toPrivatePem('utf8'),
          USER_ID: 1
        })
      } catch (e) {
        console.log(e)
        return new Error('should not have been called')
      }
      if (!(myenv.USER.ID && myenv.USER.PRIVATE_KEY)) {
        return done(new Error('keypair not in env map'))
      }
      return done()
    })
  })
})