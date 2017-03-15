
'use strict'

var http = require('http')

var ursa = require('ursa')

function sign(plain, private_key) {
  return private_key.hashAndSign(
    'sha256',
    plain,
    'utf8',
    'base64',
    false
  )
}

function request(method, path, headers) {
  var h = {'content-type': 'application/json'}
  if (headers) {
    Object.keys(headers).forEach(function(k) {
      h[k] = headers[k]
    })
  }
  return http.request({
    host: 'staging.api.lifekey.cnsnt.io',
    path: path,
    method: method,
    headers: h
  })
}

function auth_headers(user, plain) {
  return {
    'x-cnsnt-id': user.ID,
    'x-cnsnt-plain': plain,
    'x-cnsnt-signed': sign(plain, user.PRIVATE_KEY)
  }
}

function parse_res(res, on_parsed) {
  var r = ''
  res.on('data', function(data) {
    r += data
  }).on('end', function() {
    try {
      r = JSON.parse(r)
    } catch (e) {
      return on_parsed(e)
    }
    if (r.error) return on_parsed(new Error(r.message))
    return on_parsed(null, r)
  })
}

module.exports = function(registering) {
  if (!registering) {
    var env = require('./env')()
  }
  return {
    user: {
      register: function(options, on_register) {
        if (!(options.email &&
              options.nickname &&
              options.private_key &&
              options.scheme &&
              options.hostname &&
              options.webhook_path)) {
          return on_register(new Error('missing required arguments'))
        }

        var plaintext_proof = '' + Date.now()

        try {
          var public_key = options.private_key.toPublicPem('utf8')
          var signed_proof = sign(plaintext_proof, options.private_key)
        } catch (e) {
          return on_register(e)
        }

        var webhook_url = (
          options.scheme +
          options.hostname +
          (!options.port || options.port === 80 || options.port === '80' ? '' : ':' + options.port) +
          options.webhook_path
        )

        request(
          'post',
          '/management/register'
        ).on(
          'error', on_register
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_register(err)
            return on_register(null, r.body)
          })
        }).end(
          JSON.stringify({
            email: options.email,
            nickname: options.nickname,
            webhook_url: webhook_url,
            public_key_algorithm: 'rsa',
            public_key: public_key,
            plaintext_proof: plaintext_proof,
            signed_proof: signed_proof
          })
        )
      },
      update_webhook_uri: function(user_id, private_key, new_webhook_uri) {
        // TODO server route
      }
    },
    user_connection: {
      request: {
        send: function(user_id, on_send) {
          if (!user_id) {
            return on_send(new Error('missing required arguments'))
          }
          request(
            'post',
            '/management/connection',
            auth_headers(env.USER, Date.now())
          ).on(
            'error', on_send
          ).on('response', function(res) {
            parse_res(res, function(err, r) {
              if (err) return on_send(err)
              return on_send(null, r.body)
            })
          }).end(
            JSON.stringify({target: user_id})
          )
        },
        respond: function(ucr_id, accepted, on_respond) {
          if (!(ucr_id && typeof accepted === 'boolean')) {
            return on_respond(new Error('missing required arguments'))
          }
          request(
            'post',
            '/management/connection/' + ucr_id,
            auth_headers(env.USER, Date.now())
          ).on(
            'error', on_respond
          ).on('response', function(res) {
            parse_res(res, function(err, r) {
              if (err) return on_respond(err)
              return on_respond(null, r.body)
            })
          }).end(JSON.stringify({accepted: accepted}))
        }
      },
      get_all: function(on_get) {
        request(
          'get',
          '/management/connection',
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_get
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_get(err)
            return on_get(null, r.body)
          })
        }).end()
      },
      get_one: function(uc_id, on_get) {
        if (!uc_id) {
          return on_get(new Error('missing required arguments'))
        }
        request(
          'get',
          '/management/connection/' + uc_id,
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_get
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_get(err)
            return on_get(null, r.body)
          })
        }).end()
      },
      delete: function(uc_id, on_delete) {
        if (!uc_id) {
          return on_delete(new Error('missing required arguments'))
        }
        request(
          'put',
          '/management/connection/' + uc_id,
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_delete
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_delete(err)
            return on_delete(null, r.body)
          })
        }).end(
          JSON.stringify({enabled: false})
        )
      }
    },
    information_sharing_agreement: {
      request: {
        send: function(isa, on_send) {
          if (!(isa.user_id &&
                isa.license &&
                isa.purpose &&
                Array.isArray(isa.requested_fields) &&
                isa.requested_fields.length)) {
            return on_send(new Error('missing required arguments'))
          }
          request(
            'post',
            '/management/isa',
            auth_headers(env.USER, Date.now())
          ).on(
            'error', on_send
          ).on('response', function(res) {
            parse_res(res, function(err, r) {
              if (err) return on_send(err)
              return on_send(null, r.body)
            })
          }).end(
            JSON.stringify({
              to: isa.user_id,
              purpose: isa.purpose,
              license: isa.license,
              requestedResourceUris: isa.requested_fields
            })
          )
        },
        respond: function(isar_id, accepted, accepted_fields, on_respond) {
          if (!(isar_id &&
                typeof accepted === 'boolean' &&
                Array.isArray(accepted_fields))) {
            return on_respond(new Error('missing required arguments'))
          }
          request(
            'post',
            '/management/isa/' + isar_id,
            auth_headers(env.USER, Date.now())
          ).on(
            'error', on_respond
          ).on('response', function(res) {
            parse_res(res, function(err, r) {
              if (err) return on_respond(err)
              return on_respond(null, r.body)
            })
          }).end(
            JSON.stringify({
              resolution: accepted,
              permittedResourceUris: accepted_fields
            })
          )
        }
      },
      get_all: function(on_get) {
        request(
          'get',
          '/management/isa',
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_get
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_get(err)
            return on_get(null, r.body)
          })
        }).end()
      },
      get_one: function(isa_id, on_get) {
        request(
          'get',
          '/management/isa/' + isa_id,
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_get
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_get(err)
            return on_get(null, r.body)
          })
        }).end()
      },
      update: function(isa_id, updated_fields, on_update) {
        request(
          'put',
          '/management/isa/' + isa_id,
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_update
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_update(err)
            return on_update(null, r.body)
          })
        }).end(
          JSON.stringify({
            permittedResourceUris: updated_fields
          })
        )
      },
      delete: function(isa_id, on_delete) {
        request(
          'delete',
          '/management/isa/' + isa_id,
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_delete
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_delete(err)
            return on_delete(null, r.body)
          })
        }).end()
      }
    },
    resource: {
      index: function(on_index) {
        request(
          'get',
          '/resource?index=1',
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_index
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_index(err)
            return on_index(null, r.body)
          })
        }).end()
      },
      create: function(eaa, resource, on_create) {
        if (!(Array.isArray(eaa) && eaa.length === 3 && resource.value)) {
          return on_create(new Error('missing required arguments'))
        }
        request(
          'post',
          '/resource/' + [resource.entity, resource.attribute, resource.alias].join('/'),
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_create
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_create(err)
            return on_create(null, r.body)
          })
        }).end(
          JSON.stringify({
            encoding: resource.encoding || 'utf8',
            mime: resource.mime || 'text/plain',
            value: resource.value,
            is_default: resource.is_default || false,
            is_archived: resource.is_archived || false
          })
        )
      },
      get_one: function(eaa, on_get) {
        if (!(Array.isArray(eaa) && eaa.length === 3)) {
          return on_get(new Error('missing required arguments'))
        }
        request(
          'get',
          '/resource/' + eaa.join('/'),
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_get
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_get(err)
            return on_get(null, r.body)
          })
        }).end()
      },
      update: function(eaa, on_update) {
        if (!(Array.isArray(eaa) && eaa.length === 3)) {
          return on_update(new Error('missing required arguments'))
        }
        request(
          'put',
          '/resource/' + eaa.join('/'),
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_update
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_update(err)
            return on_update(null, r.body)
          })
        }).end(
          JSON.stringify({
            encoding: resource.encoding || 'utf8',
            mime: resource.mime || 'text/plain',
            value: resource.value,
            is_default: resource.is_default || false,
            is_archived: resource.is_archived || false
          })
        )
      },
      delete: function(eaa, on_delete) {
        if (!(Array.isArray(eaa) && eaa.length === 3)) {
          return on_delete(new Error('missing required arguments'))
        }
        request(
          'delete',
          '/resource/' + eaa.join('/'),
          auth_headers(env.USER, Date.now())
        ).on(
          'error', on_delete
        ).on('response', function(res) {
          parse_res(res, function(err, r) {
            if (err) return on_delete(err)
            return on_delete(r.body)
          })
        }).end()
      }
    }
  }
}