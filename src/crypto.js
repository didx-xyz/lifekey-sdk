
'use strict'

var ursa = require('ursa')

module.exports = {
  public_key: ursa.coercePublicKey,
  sign: function sign(plain, private_key) {
    return private_key.hashAndSign(
      'sha256',
      '' + plain,
      'utf8',
      'base64',
      false
    )
  },
  verify: function verify(plain, signature, public_key) {
    return public_key.hashAndVerify(
      'sha256',
      Buffer(plain),
      signature,
      'base64',
      false
    )
  }
}