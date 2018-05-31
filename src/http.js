
'use strict'

var crypto = require('crypto')
var http = require('http')

function parse_res(res, on_parsed) {
  
  var r = ''
  res.on('data', function(data) {
    r += data
  }).on('end', function() {
    try {
      r = JSON.parse(r)
    } catch (e) {
      console.log('from server', r)
      return on_parsed(e)
    }
    if(r.error && r.body && r.body.validation_errors){
      console.log(r.body.validation_errors)
    }
    if (r.error) return on_parsed(new Error(r.message))
    return on_parsed(null, r)
  })
}

module.exports = {
  auth_headers: function(user, plain) {
    var signer = crypto.createSign('RSA-SHA256')
    signer.update(plain)    
    return {
      'x-cnsnt-id': user.ID,
      'x-cnsnt-plain': plain,
      'x-cnsnt-signed': crypto.sign(user.PRIVATE_KEY)
    }
  },
  request: function(method, path, headers, body, on_send) {
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
      if (res.statusCode === 502) {
        return on_send(
          new Error('lifekey-server is down (probably temporarily)')
        )
      }
      parse_res(res, function(err, r) {
        if (err) return on_send(err)
        return on_send(null, r.body)
      })
    }).on('error', on_send).end(body || null)
  }
}
