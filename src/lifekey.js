
'use strict'

var rsa = require('node-rsa')
var crypto = require('crypto')
var http = require('./http')

module.exports = function(env) {
  return {
    user: {
      /**
       * get your did value and address
       * @param on_get function
       */
      get_public_profile: function(user_did, on_get) {
        http.request(
          'get',
          '/profile/' + user_did,
          null,
          null,
          on_get
        )
      },
      /**
       * get your did value and address
       * @param on_get function
       */
      get_profile: function(on_get) {
        http.request(
          'get',
          '/profile',
          http.auth_headers(env.USER, Date.now().toString()),
          null,
          on_get
        )
      },
      /**
       * get your thanks balance
       * @param on_get function
       */
      thanks_balance: function(on_get) {
        http.request(
          'get',
          '/management/thanks/balance',
          http.auth_headers(env.USER, Date.now().toString()),
          null,
          on_get
        )
      },
      /**
       * change the address associated with your user
       * @param address string
       * @param on_update function
       */
      address: function(address, on_update) {
        http.request(
          'put',
          '/profile/address',
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify({address: address}),
          on_update
        )
      },

      /**
       * change the tel associated with your user
       * @param tel string
       * @param on_update function
       */
      tel: function(tel, on_update) {
        http.request(
          'put',
          '/profile/tel',
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify({tel: tel}),
          on_update
        )
      },

      /**
       * change the email associated with your user
       * @param email string
       * @param on_update function
       */
      email: function(email, on_update) {
        http.request(
          'put',
          '/profile/email',
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify({email: email}),
          on_update
        )
      },

      /**
       * change the display name associated with your user
       * @param name string
       * @param on_update function
       */
      name: function(name, on_update) {
        http.request(
          'put',
          '/profile/name',
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify({name: name}),
          on_update
        )
      },
      
      /**
       * change the branding colour associated with your user
       * @param colour string
       * @param on_update function
       */
      colour: function(colour, on_update) {
        if (!(/^#(?:[0-9a-f]{3}){1,2}$/i).test(colour)) {
          return on_update(new Error('invalid colour code given'))
        }
        http.request(
          'put',
          '/profile/colour',
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify({colour: colour}),
          on_update
        )
      },
      
      /**
       * change the image associated with your user
       * @param image_uri string
       * @param on_update function
       */
      image: function(image_uri, on_update) {
        http.request(
          'put',
          '/profile/image',
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify({image_uri: image_uri}),
          on_update
        )
      },
      
      /**
       * update webhook url for your service
       * @param webhook_url string
       * @param on_update function
       */
      webhook_uri: function(webhook_url, on_update) {
        if (!webhook_url) {
          return on_update(new Error('missing required arguments'))
        }
        http.request(
          'post',
          '/management/device',
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify({webhook_url: webhook_url}),
          on_update
        )
      },
      /**
       * register a new service or user
       * @param user object
       * @param on_register function
       */
      register: function(user, on_register, server, port) {
        if (typeof user !== 'object') return on_register(new Error('user parameter should be an object'))
        if (!user.email) return on_register(new Error('user.email is required'))
        if (!user.nickname) return on_register(new Error('user.nickname is required'))
        if (!user.webhook_url) return on_register(new Error('user.webhook_url is required'))
        if (!user.actions_url) return on_register(new Error('user.actions_url is required'))
        var private_key = new rsa({bits: 4096})
        var private_key_pem = private_key.exportKey()
        user.public_key_algorithm = 'rsa'
        user.public_key = private_key.exportKey('pkcs1-public')
        user.plaintext_proof = '' + Date.now()
        try {
          var signer = crypto.createSign('RSA-SHA256')
          signer.update(user.plaintext_proof)
          user.signed_proof = signer.sign(private_key_pem).toString('base64')
        } catch (err) {
          return on_register(err)
        }
        http.request(
          'post',
          '/management/register',
          {},
          JSON.stringify(user),
          function(err, reg) {
            if (err) return on_register(err)
            user.USER_ID = reg.id
            user.ACTIVATION_CODE = reg.activation
            user.SIGNING_KEY_PEM = private_key_pem
            return on_register(null, user)
          },server, port
        )
      }
    },
    user_connection: {
      request: {
        /**
         * request connection with specified user
         * @param user_did mixed
         * @param on_send function
         */
        send: function(user_did, on_send) {
          if (!user_did) {
            return on_send(new Error('missing required arguments'))
          }
          http.request(
            'post',
            '/management/connection',
            http.auth_headers(env.USER, Date.now().toString()),
            JSON.stringify({target: user_did}),
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
          http.request(
            'post',
            '/management/connection/' + ucr_id,
            http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'get',
          '/management/connection',
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'delete',
          '/management/connection/' + uc_id,
          http.auth_headers(env.USER, Date.now().toString()),
          null,
          on_delete
        )
      }
    },
    information_sharing_agreement: {
      actions: {
        /**
         * create a new action record
         * @param action object
         * @param on_create function
         */
        create: function(action, on_create) {
          if (!(action.name &&
                action.purpose &&
                action.license &&
                action.entities &&
                action.duration_days)) {
            return on_create(new Error('missing required arguments'))
          }
          http.request(
            'post',
            '/management/action',
            http.auth_headers(env.USER, Date.now().toString()),
            JSON.stringify(action),
            on_create
          )
        },
        /**
         * enumerate all actions related to the specified user
         * @param user_did mixed
         * @param on_get function
         */
        get_all: function(user_did, on_get) {
          http.request(
            'get',
            '/management/action' + (user_did ? ('/' + user_did) : ''),
            http.auth_headers(env.USER, Date.now().toString()),
            null,
            on_get
          )
        },
        /**
         * get a single action record
         * @param user_did mixed
         * @param action_name mixed
         * @param on_get function
         */
        get_one: function(user_did, action_name, on_get) {
          http.request(
            'get',
            '/management/action/' + user_did + '/' + action_name,
            http.auth_headers(env.USER, Date.now().toString()),
            null,
            on_get
          )
        },
        /**
         * delete the specified action
         * @param action_name mixed
         * @param on_delete function
         */
        delete: function(action_name, on_delete) {
          http.request(
            'delete',
            '/management/action/' + action_name,
            http.auth_headers(env.USER, Date.now().toString()),
            null,
            on_delete
          )
        }
      },
      request: {
        /**
         * request isa with specified user
         * @param isa object
         * @param on_send function
         */
        send: function(isa, on_send) {
          if (!(isa.user_did &&
                isa.license &&
                isa.purpose &&
                Array.isArray(isa.optional_entities) &&
                Array.isArray(isa.required_entities) &&
                isa.required_entities.length)) {
            return on_send(new Error('missing required arguments'))
          }
          http.request(
            'post',
            '/management/isa',
            http.auth_headers(env.USER, Date.now().toString()),
            JSON.stringify({
              to: isa.user_did,
              purpose: isa.purpose,
              license: isa.license,
              required_entities: isa.required_entities
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
          http.request(
            'post',
            '/management/isa/' + isar_id,
            http.auth_headers(env.USER, Date.now().toString()),
            JSON.stringify(response),
            on_respond
          )
        }
      },
      /**
       * create an information sharing agreement with the specified user and action record
       * @param user_id mixed
       * @param action_name mixed
       * @param response object
       * @param on_create function
       */
      create: function(user_did, action_name, response, on_create) {
        if (!(user_did &&
              action_name &&
              Array.isArray(response.entities) &&
              response.entities.length)) {
          return on_create(new Error('missing required arguments'))
        }
        http.request(
          'post',
          '/management/isa/' + user_did + '/' + action_name,
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify(response),
          on_create
        )
      },
      /**
       * enumerate all active and unacknowledged isas
       * @param on_get function
       */
      get_all: function(on_get) {
        http.request(
          'get',
          '/management/isa',
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'get',
          '/management/isa/' + isa_id,
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'put',
          '/management/isa/' + isa_id,
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'delete',
          '/management/isa/' + isa_id,
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'get',
          '/management/pull/' + isa_id,
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'post',
          '/management/push/' + isa_id,
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify({resources: resources}),
          on_push
        )
      },
      /**
       * get a receipt for an established isa
       * @param isa_id mixed
       * @param on_get function
       */
      receipt: function(isa_id, on_get) {
        http.request(
          'get',
          '/management/receipt/' + isa_id,
          http.auth_headers(env.USER, Date.now().toString()),
          null,
          on_get
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
              creator: env.USER.DID,
              createdAt: resource.created_at
            },
            signatureValue: ''
          }

          Object.keys(resource.additional_fields).forEach(function(field) {
            claim_instance.claim[field] = resource.additional_fields[field]
          })

	        var signer = crypto.createSign('RSA-SHA256')
          signer.update(JSON.stringify(claim_instance.claim))
          claim_instance.signatureValue = signer.sign(env.USER.PRIVATE_KEY.exportKey())
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
            var public_key = new rsa(public_key)
          } catch (e) {
            console.log(e)
            return on_verify(
              new Error(
                'unable to initialise rsa public key instance with given public key value'
              )
            )
          }

	        var verifier = crypto.createVerify('RSA-SHA256')
          verifier.update(plaintext)
          var verified = verifier.verify(public_key.exportKey('pkcs1-public'), signature)
          return on_verify(null, verified)
        }
      },
      /**
       * request index of all resources (or optionally any resources that were pushed by other users)
       * @param get_pushed boolean
       * @param on_index function
       */
      index: function(get_pushed, on_index) {
        http.request(
          'get',
          get_pushed ? '/resource?pushed=1' : '/resource',
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'post',
          '/resource',
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'get',
          '/resource/' + resource_id,
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'put',
          '/resource/' + resource_id,
          http.auth_headers(env.USER, Date.now().toString()),
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
        http.request(
          'delete',
          '/resource/' + resource_id,
          http.auth_headers(env.USER, Date.now().toString()),
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
      get: function(user_did, alias, on_get) {
        http.request(
          'get',
          '/management/key/' + user_did + (alias ? '?alias=' + alias : ''),
          http.auth_headers(env.USER, Date.now().toString()),
          null,
          on_get
        )
      }
    },
    thanks: {
      send: function(user_did, amount, reason, on_send) {
        http.request(
          'post',
          '/management/thanks',
          http.auth_headers(env.USER, Date.now().toString()),
          JSON.stringify({
            recipient: user_did,
            amount: amount,
            reason: reason
          }),
          on_send
        )
      }
    },
    directory: {
      /**
       * ping directory for liveness checking
       * @param on_ping function
       */
      ping: function(on_ping) {
      
        http.request(
          'post',
          '/directory/ping',
          http.auth_headers(env.USER, Date.now().toString()),
          null,
          typeof on_ping === 'function' ? on_ping : console.log,
          env.LIFEKEY_SERVER,
          env.LIFEKEY_SERVER_PORT
        )
      }
    },
    message: function(user_did, message, on_send, message_title = '', message_type = '', message_id = '', action_type = '') { // message_type => "actionable_message" | "" // message_id => <claim_id>
    console.log(`ACTION TYPE: ${action_type}`)  
    http.request(
        'post',
        '/management/message',
        http.auth_headers(env.USER, Date.now().toString()),
        JSON.stringify({ recipient: user_did, msg: message, title: message_title, type: message_type, message_id, action_type: action_type }),
        on_send
      )
    }
  }
}
