# emailjs-pgp-builder

Builds PGP/MIME, no magic/encryption included.

## Usage

```javascript
const PGPBuilder = require('emailjs-pgp-builder');
const builder = new PGPBuilder();
```

This is the expected data format...

```javascript
let message = {
     subject: 'foo',
     date: new Date(),
     from: [{
         name: 'Fred Foo',
         address: 'fred@foobar.bar'
     }],
     to: [{
         name: 'Bla Foo',
         address: 'bla@foobar.bar'
     }],
     cc: [{
         name: 'Bli Foo',
         address: 'bli@foobar.bar'
     }],
     bcc: [{
         name: 'Blu Foo',
         address: 'Blu@foobar.bar'
     }],
     id: '368357@foobar.bar',
     inReplyTo: '112342356@foobar.bar',
     text: 'asd',
     html: '<html><head></head><body>asd</body></html>',
     attachments: []
 };
```

##### API

* #buildEncrypted
* #buildSigned
* #buildPlaintext

##### Build a signed MIME structure

```javascript
let mimeRoot = builder.buildPlaintext(message);

// Crypto not included
let signature = pgpsign(mimeRoot.build());

builder.buildSigned(message, mimeRoot, signature);

// Find the results of the operation here:
console.log(message.raw)
console.log(message.smtpEnvelope)
```

NB! pgpsign is whatever you use to PGP-sign the content.

##### Build a encrypted MIME structure

```javascript
let mimeRoot = builder.buildPlaintext(message);

// Crypto not included
let ciphertext = pgpencrypt(mimeRoot.build());

builder.buildEncrypted(message, ciphertext);

// Find the results of the operation here:
console.log(message.raw)
console.log(message.smtpEnvelope)
```

NB! pgpencrypt is whatever you use to PGP-encrypt the content.


## License

MIT

