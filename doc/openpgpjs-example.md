# Encrypt example using openpgpjs

```javascript

const fs = require('fs');
const pgp = require('openpgp');
const Outbox = require('emailjs-pgp-builder');

/**
 * getSigningKey - fetch the signing key
 *
 * @returns {Promise<Object>} promise of pgp key object
 */
function getSigningKey() {
  const signingAddress = 'my-signer@example.com';
  const signingKey = pgp.key.readArmored(fs.readFileSync(`keys/${signingAddress}.asc`).toString()).keys[0];
  const passphrase = 'my super secret passphrase';
  try {
    signingKey.decrypt(passphrase);
    return Promise.resolve(signingKey);
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * encrypt - Encrypt the data
 *
 * @param {string} targetAddress target address (for public key selection)
 * @param {string} plainText          the plaintext
 *
 * @returns {Promise<Object>} Promise of GPG encrypted object
 */
function encrypt(targetAddress, plainText) {
  return getSigningKey().then((signingKey) => {

    const pubKey = pgp.key.readArmored(fs.readFileSync(`keys/${targetAddress}.asc`).toString()).keys[0];

    const params = {
      publicKeys: [ pubKey ],
      privateKeys: signingKey,
      data: text
    };

    return pgp.encrypt(params);
  });
}

/**
 * createEncryptedMail
 *
 * @param {string} subject  Subject
 * @param {Object} source  From email
 * @param {Object} target   To email
 * @param {string} textBody text body of mail
 * @param {string} mailBody html body of mail
 * @param {string | Buffer} pdf an attachment
 *
 * @returns {Promise<Object>}
 */
function createEncryptedMail(subject, source, target, textBody, mailBody, pdf) {
  const message = {
    subject,
    date: new Date(),
    from: [ source ],
    to: [ target ],
    text: textBody,
    html: mailBody,
    attachments: [
      {
        mimeType: 'application/pdf',
        filename: 'adpr.pdf',
        content: pdf
      }
    ]
  };

  createMail = () => {
    const builder = new Outbox();
    const mimeRoot = builder.buildPlaintext(message);
    const plainText = mimeRoot.build();

    return encrypt(target.address, plainText)
      .then((encrypted) => {
        const crypted = builder.buildEncrypted(message, encrypted.data);
        return crypted;
      })
  };
}

```
