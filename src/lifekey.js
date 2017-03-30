
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

function verify(plain, signature, public_key) {
  return public_key.hashAndVerify(
    'sha256',
    Buffer(plain),
    signature,
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
    'x-cnsnt-signed': sign('' + plain, user.PRIVATE_KEY)
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

function validate_user(user) {
  if (typeof user != 'object') throw new Error('user parameter should be an object')
  if (!user.email)             throw new Error('user.email is required')
  if (!user.nickname)          throw new Error('user.nickname is required')
  if (!user.webhook_url)       throw new Error('user.webhook_url is required')
}

function generate_user_keypair(user) {
  if (typeof user != 'object') throw new Error('user parameter should be an object')
  user.private_key          = ursa.generatePrivateKey(4096)
  user.public_key_algorithm = 'rsa'
  user.public_key           = user.private_key.toPublicPem('utf8')
  user.plaintext_proof      = '' + Date.now()
  user.signed_proof         = user.private_key.hashAndSign('sha256', user.plaintext_proof, 'utf8', 'base64',false)
  return user
}

module.exports = function(env) {
  return {
    user: {
      /**
       * update webhook url for your service
       * @param webhook_url string
       * @param on_update function
       */
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
      },
      /**
       * register a new service or user
       * @param user object
       * @param on_register function
       */
      register: function(user, on_register) {
        validate_user(user)
        user = generate_user_keypair(user)
        var reg_user = JSON.parse(JSON.stringify(user))
        delete reg_user.private_key
        request(
          'post',
          '/management/register',
          {},
          JSON.stringify(reg_user),
          function (err, reg) {
            if (err) return on_register(err, null)
            reg_user.USER_ID = reg.id
            reg_user.SIGNING_KEY_PEM = user.private_key.toPrivatePem('utf8')
            on_register(null, reg_user)
          }
        )
      }
    },
    user_connection: {
      request: {
        /**
         * request connection with specified user
         * @param user_id mixed
         * @param on_send function
         */
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
        /**
         * respond to specified connection request with given response value
         * @param ucr_id mixed
         * @param accepted boolean
         * @param on_respond function
         */
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
      /**
       * enumerate all active unacknowledged connections
       * @param on_get function
       */
      get_all: function(on_get) {
        request(
          'get',
          '/management/connection',
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      },
      /**
       * detail a specified connection
       * @param uc_id mixed
       * @param on_get function
       */
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
      /**
       * delete specified connection
       * @param uc_id mixed
       * @param on_delete function
       */
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
        /**
         * request isa with specified user
         * @param isa object
         * @param on_send function
         */
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
        /**
         * respond to specified isa request with given response value
         * @param isar_id mixed
         * @param response object
         * @param on_respond function
         */
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
      /**
       * enumerate all active and unacknowledged isas
       * @param on_get function
       */
      get_all: function(on_get) {
        request(
          'get',
          '/management/isa',
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      },
      /**
       * detail a specified isa
       * @param isa_id mixed
       * @param on_get function
       */
      get_one: function(isa_id, on_get) {
        request(
          'get',
          '/management/isa/' + isa_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      },
      /**
       * update the original response to the isa request
       * @param isa_id mixed
       * @param permitted_resources array
       * @param on_update function
       */
      update: function(isa_id, permitted_resources, on_update) {
        request(
          'put',
          '/management/isa/' + isa_id,
          auth_headers(env.USER, Date.now()),
          JSON.stringify({permitted_resources: permitted_resources}),
          on_update
        )
      },
      /**
       * delete the specified isa
       * @param isa_id mixed
       * @param on_delete function
       */
      delete: function(isa_id, on_delete) {
        request(
          'delete',
          '/management/isa/' + isa_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_delete
        )
      },
      /**
       * retrieve any resources agreed to be shared in specfied isa
       * @param isa_id mixed
       * @param on_pull function
       */
      pull: function(isa_id, on_pull) {
        request(
          'get',
          '/management/pull/' + isa_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_pull
        )
      },
      /**
       * send new resources in relation to specified isa
       * @param isa_id mixed
       * @param resources array
       * @param on_push function
       */
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
      verifiable_claim: {
        /**
         * create a verifiable claim with given resource parameters signed with your private key
         * @param resource object
         * @param on_create function
         */
        create: function(resource, on_create) {
          // resource.context array (one or more urls pointing to jsonld definitions)
          // resource.is_credential boolean (will this verfiable claim be shown as a badge in the app?)
          // resource.issued_for mixed (user id or did for whom this claim is issued)
          // resource.creator mixed (you)
          // resource.additional_fields object (gets included in the "claim" object such that each field is merged directly - each additional field must map to a field in your jsonld definition (which is referenced in the @context array))
          if (!(typeof resource === 'object' &&
                resource !== null &&
                resource.context &&
                resource.is_credential &&
                resource.issued_for &&
                resource.created_at &&
                resource.additional_fields)) {
            return on_create(
              new Error(
                'missing any of the following claim parameters: ' +
                'context, issued_for, creator, created_at, ' +
                'additional_fields'
              )
            )
          }

          var claim_instance = {
            '@context': [
              'http://schema.cnsnt.io/verifiable_claim'
            ].concat(resource.context),
            claim: {
              isCredential: resource.is_credential,
              issuedFor: resource.issued_for,
              creator: env.USER.ID,
              createdAt: resource.created_at
            },
            signatureValue: ''
          }

          Object.keys(resource.additional_fields).forEach(function(field) {
            claim_instance.claim[field] = resource.additional_fields[field]
          })

          claim_instance.signatureValue = sign(
            JSON.stringify(claim_instance.claim),
            env.USER.PRIVATE_KEY
          )

          return on_create(null, claim_instance)
        },
        /**
         * ensure that the enclosed signature in the given verifiable claim was created by the user who owns the given public key
         * @param verifiable_claim object
         * @param public_key string
         * @param on_verify function
         */
        verify: function(verifiable_claim, public_key, on_verify) {

          if (!('claim' in verifiable_claim &&
                'signatureValue' in verifiable_claim)) {
            return on_verify(new Error('given claim value is not verifiable'))
          }
          
          var plaintext = JSON.stringify(verifiable_claim.claim)
          var signature = verifiable_claim.signatureValue
          
          try {
            var ursa_public_key = ursa.coercePublicKey(public_key)
          } catch (e) {
            return on_verify(
              new Error(
                'unable to initialise ursa public key instance with given public key value'
              )
            )
          }

          return on_verify(null, verify(plaintext, signature, ursa_public_key))
        }
      },
      /**
       * request index of all resources (or optionally any resources that were pushed by other users)
       * @param get_pushed boolean
       * @param on_index function
       */
      index: function(get_pushed, on_index) {
        request(
          'get',
          get_pushed ? '/resource?pushed=1' : '/resource',
          auth_headers(env.USER, Date.now()),
          null,
          on_index
        )
      },
      /**
       * create the given resource
       * @param resource object
       * @param on_create function
       */
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
            is_verifiable_claim: resource.is_verifiable_claim || false,
            is_archived: resource.is_archived || false
          }),
          on_create
        )
      },
      /**
       * request the specified resource
       * @param resource_id mixed
       * @param on_get function
       */
      get_one: function(resource_id, on_get) {
        request(
          'get',
          '/resource/' + resource_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      },
      /**
       * update the resource specified by id with given resource update values
       * @param resource_id mixed
       * @param resource object
       * @param on_update function
       */
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
            is_verifiable_claim: resource.is_verifiable_claim || false,
            is_archived: resource.is_archived || false
          }),
          on_update
        )
      },
      /**
       * delete the specified resource
       * @param resource_id mixed
       * @param on_delete function
       */
      delete: function(resource_id, on_delete) {
        request(
          'delete',
          '/resource/' + resource_id,
          auth_headers(env.USER, Date.now()),
          null,
          on_delete
        )
      }
    },
    key: {
      /**
       * request the aliased public key of specified user (omitting alias returns the user's default signing public key)
       * @param user_id mixed
       * @param alias string
       * @param on_get
       */
      get: function(user_id, alias, on_get) {
        request(
          'get',
          '/management/key/' + user_id + (alias ? '?alias=' + alias : ''),
          auth_headers(env.USER, Date.now()),
          null,
          on_get
        )
      }
    }
  }
}

