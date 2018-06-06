
var http = require('http')

var {expect} = require('chai')
var rsa = require('node-rsa')

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
      agent = require('../src/agent')({
        PORT: 3000,
        WEBHOOK_PATH: '/',
        ACTIONS_PATH: '/actions',
        _: process.env._
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
    
    var env = require('../src/env')

    it('should throw if not given all args', function(done) {
      
      [null, {}].forEach(function(options) {
        try {
          env(options)
        } catch (e) {
          return
        }
        return done(new Error('should not have been called'))
      })
      return done()
    })
  
    it('should throw if not given an rsa private key', function(done) {
      try {
        env({
          PORT: 3000,
          WEBHOOK_PATH: '/',
          ACTIONS_PATH: '/actions',
          SIGNING_KEY_PEM: 'foo',
          USER_ID: 1
        })
      } catch (e) {
        return done()
      }
      return done(new Error('should not have been called'))
    })

    it('should return a copy with keypair attached', function(done) {
      this.timeout(5000)
      var keypair = new rsa({bits: 4096})
      try {
        var myenv = env({
          PORT: 3000,
          WEBHOOK_PATH: '/',
          ACTIONS_PATH: '/actions',
          SIGNING_KEY_PEM: keypair.exportKey(),
          USER_ID: 1
        })
      } catch (e) {
        return done(new Error('should not have been called'))
      }
      if (!(myenv.USER.ID && myenv.USER.PRIVATE_KEY)) {
        return done(new Error('keypair not in env map'))
      }
      return done()
    })
  })

  describe('lifekey', function() {
    var private_key_pem = (new rsa({bits: 4096})).exportKey()
    var api = require('../src/lifekey')(
      require('../src/env')({
        PORT: 3000,
        WEBHOOK_PATH: '/',
        ACTIONS_PATH: '/actions',
        SIGNING_KEY_PEM: private_key_pem,
        USER_ID: 1
      })
    )

    describe('resource', function() {

      describe('verifiable_claim', function() {

        describe('create', function() {

          it('should return with an error if any arguments are missing', function(done) {
            api.resource.verifiable_claim.create(null, function(err, claim) {
              if (err) return done()
              else return done(new Error('should not have been called'))
            })
          })

          it('should return a verifiable claim suitable for embedding into a resource or isa api call', function(done) {
            api.resource.verifiable_claim.create({
              context: ['http://schema.cnsnt.io/pirate_name'],
              is_credential: true,
              issued_for: 2,
              created_at: Date.now(),
              additional_fields: {
                pirateName: 'long-john silver'
              }
            }, function(err, claim) {
              if (err) return done(err)
              expect(!!claim.signatureValue).to.equal(true)
              done()
            })
          })
        })

        describe('verify', function() {
	        var private_key = new rsa(private_key_pem)
          var public_key_pem = private_key.exportKey('pkcs1-public')

          it('should respond with an error if required fields of a verifiable claim are missing', function(done) {
            api.resource.verifiable_claim.verify(
              {},
              public_key_pem,
              function(err, verified) {
                if (err) return done()
                else return done(new Error('should not have been called'))
              }
            )
          })

          it('should respond with a boolean indicating whether the claim is verified', function(done) {
            api.resource.verifiable_claim.create({
              context: ['http://schema.cnsnt.io/pirate_name'],
              is_credential: true,
              issued_for: 2,
              created_at: Date.now(),
              additional_fields: {
                pirateName: 'long-john silver'
              }
            }, function(err, claim) {
              if (err) return done(err)
              api.resource.verifiable_claim.verify(
                claim,
                public_key_pem,
                function(err, verified) {
                  if (err) return done(err)
                  expect(typeof verified).to.equal('boolean')
                  expect(verified).to.equal(true)
                  done()
                }
              )
            })
          })
        })
      })
    })
  })
})
