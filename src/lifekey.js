
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

function request(method, path, headers, body, on_send) {
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
  }).on('response', function(res) {
    parse_res(res, function(err, r) {
      if (err) return on_send(err)
      return on_send(null, r.body)
    })
  }).on('error', on_send).end(body || null)
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

module.exports = function(env) {
  return {
    user: {
      update_webhook_uri: function(webhook_url, on_update) {
        if (!webhook_url) {
          return on_update(new Error('missing required arguments'))
        }
        request(
          'post',
          '/management/device',
          {},
          JSON.stringify({webhook_url: webhook_url}),
          on_update
        )
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
            auth_headers(env.USER, Date.now()),
            JSON.stringify({target: user_id}),
            on_send
          )
        },
        respond: function(ucr_id, accepted, on_respond) {
          if (!(ucr_id && typeof accepted === 'boolean')) {
            return on_respond(new Error('missing required arguments'))
          }
          request(
            'post',
            '/management/connection/' + ucr_id,
            auth_headers(env.USER, Date.now()),
            JSON.stringify({accepted: accepted}),
            on_respond
          )
        }
      },
      get_all: function(on_get) {
        request(
          'get',
          '/management/connection',
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      },
      get_one: function(uc_id, on_get) {
        if (!uc_id) {
          return on_get(new Error('missing required arguments'))
        }
        request(
          'get',
          '/management/connection/' + uc_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      },
      delete: function(uc_id, on_delete) {
        if (!uc_id) {
          return on_delete(new Error('missing required arguments'))
        }
        request(
          'delete',
          '/management/connection/' + uc_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_delete
        )
      }
    },
    information_sharing_agreement: {
      request: {
        send: function(isa, on_send) {
          if (!(isa.user_id &&
                isa.license &&
                isa.purpose &&
                Array.isArray(isa.optional_schemas) &&
                Array.isArray(isa.requested_schemas) &&
                isa.requested_schemas.length)) {
            return on_send(new Error('missing required arguments'))
          }
          request(
            'post',
            '/management/isa',
            auth_headers(env.USER, Date.now()),
            JSON.stringify({
              to: isa.user_id,
              purpose: isa.purpose,
              license: isa.license,
              requested_schemas: isa.requested_schemas
            }),
            on_send
          )
        },
        respond: function(isar_id, response, on_respond) {
          if (!(isar_id &&
                typeof response.accepted === 'boolean' &&
                Array.isArray(response.permitted_resources))) {
            return on_respond(new Error('missing required arguments'))
          }
          request(
            'post',
            '/management/isa/' + isar_id,
            auth_headers(env.USER, Date.now()),
            JSON.stringify(response),
            on_respond
          )
        }
      },
      get_all: function(on_get) {
        request(
          'get',
          '/management/isa',
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      },
      get_one: function(isa_id, on_get) {
        request(
          'get',
          '/management/isa/' + isa_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      },
      update: function(isa_id, permitted_resources, on_update) {
        request(
          'put',
          '/management/isa/' + isa_id,
          auth_headers(env.USER, Date.now()),
          JSON.stringify({permitted_resources: permitted_resources}),
          on_update
        )
      },
      delete: function(isa_id, on_delete) {
        request(
          'delete',
          '/management/isa/' + isa_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_delete
        )
      },
      pull: function(isa_id, on_pull) {
        request(
          'get',
          '/management/pull/' + isa_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_pull
        )
      },
      push: function(isa_id, resources, on_push) {
        request(
          'post',
          '/management/push/' + isa_id,
          auth_headers(env.USER, Date.now()),
          JSON.stringify({resources: resources}),
          on_push
        )
      }
    },
    resource: {
      index: function(get_pushed, on_index) {
        request(
          'get',
          get_pushed ? '/resource?pushed=1' : '/resource',
          auth_headers(env.USER, Date.now()),
          null,
          on_index
        )
      },
      create: function(resource, on_create) {
        request(
          'post',
          '/resource',
          auth_headers(env.USER, Date.now()),
          JSON.stringify({
            entity: resource.entity,
            attribute: resource.attribute,
            alias: resource.alias,
            encoding: resource.encoding || 'utf8',
            schema: resource.schema,
            mime: resource.mime || 'text/plain',
            value: resource.value,
            is_default: resource.is_default || false,
            is_archived: resource.is_archived || false
          }),
          on_create
        )
      },
      get_one: function(resource_id, on_get) {
        request(
          'get',
          '/resource/' + resource_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      },
      update: function(resource_id, resource, on_update) {
        request(
          'put',
          '/resource/' + resource_id,
          auth_headers(env.USER, Date.now()),
          JSON.stringify({
            entity: resource.entity,
            attribute: resource.attribute,
            alias: resource.alias,
            encoding: resource.encoding || 'utf8',
            mime: resource.mime || 'text/plain',
            uri: resource.uri,
            schema: resource.schema,
            value: resource.value,
            is_default: resource.is_default || false,
            is_archived: resource.is_archived || false
          }),
          on_update
        )
      },
      delete: function(resource_id, on_delete) {
        request(
          'delete',
          '/resource/' + resource_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_delete
        )
      }
    }
  }
}