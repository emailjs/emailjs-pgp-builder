'use strict';

var MimeBuilder = require('emailjs-mime-builder');

const MIME_TYPE_MP_ENC = 'multipart/encrypted; protocol=application/pgp-encrypted';
const MIME_TYPE_MP_SIG = 'multipart/signed; protocol=application/pgp-signature';
const MIME_TYPE_MP_MIX = 'multipart/mixed';
const MIME_TYPE_MP_ALT = 'multipart/alternative';
const MIME_TYPE_TXT = 'text/plain';
const MIME_TYPE_HTML = 'text/html';
const MIME_TYPE_SIG = 'application/pgp-signature';
const MIME_TYPE_ENC = 'application/pgp-encrypted';
const MIME_TYPE_OCT = 'application/octet-stream';
const MIME_FILE_SIG = 'signature.asc';
const MIME_FILE_ENC = 'encrypted.asc';
const MIME_DESC = 'content-description';
const MIME_DESC_PGP = 'OpenPGP encrypted message';
const MIME_DESC_VER = 'PGP/MIME Versions Identification';
const MIME_DISP = 'content-disposition';
const MIME_DISP_ATTMT = 'attachment';
const MIME_DISP_INLINE = 'inline';
const MIME_ENCODING = 'content-transfer-encoding';
const MIME_ENCODING_7BIT = '7bit';
const MIME_ENCODING_BASE64 = 'base64';
const MIME_ENCODING_QP = 'quoted-printable';
const MIME_VAL_CONTENT_PGP_PREAMBLE = 'This is an OpenPGP/MIME encrypted message.';
const MIME_VAL_CONTENT_VERSION = 'Version: 1';


let Outbox = function() {};

Outbox.prototype.buildPlaintext = function(message) {
    let mb = new MimeBuilder();
    let root, content;

    if (message.text && message.html) {
        content = mb.createChild(MIME_TYPE_MP_ALT);
        content.createChild(MIME_TYPE_TXT).setHeader(MIME_ENCODING, MIME_ENCODING_QP).setContent(message.text);
        content.createChild(MIME_TYPE_HTML).setHeader(MIME_ENCODING, MIME_ENCODING_QP).setContent(message.html);
    } else {
        content = mb.createChild(MIME_TYPE_TXT).setHeader(MIME_ENCODING, MIME_ENCODING_QP).setContent(message.text);
    }

    if (message.attachments.length) {
        root = mb.createChild(MIME_TYPE_MP_MIX);
        root.appendChild(content);

        for (let attmt of message.attachments) {
            let attmtNode = root.createChild(attmt.mimeType).setHeader(MIME_ENCODING, MIME_ENCODING_BASE64).setHeader(MIME_DISP, MIME_DISP_ATTMT).setContent(attmt.content);
            attmtNode.filename = attmt.filename;
        }
    } else {
        root = content;
    }

    return root;
};

Outbox.prototype._createEnvelope = function(message, root) {
    root.setHeader({
        subject: message.subject,
        from: message.from,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc
    });
};

Outbox.prototype.buildSigned = function(message, signedRoot, signature) {
    let root = new MimeBuilder(MIME_TYPE_MP_SIG);
    root.appendChild(signedRoot);
    root.createChild(MIME_TYPE_SIG).setHeader(MIME_ENCODING, MIME_ENCODING_7BIT).setHeader(MIME_DISP, MIME_DISP_INLINE).setContent(signature).filename = MIME_FILE_SIG;
    this._createEnvelope(message, root);
    message.raw = root.build();
    message.smtpEnvelope = root.getEnvelope();
    return message.raw;
};

Outbox.prototype.buildEncrypted = function(message, ciphertext) {
    let root = new MimeBuilder(MIME_TYPE_MP_ENC).setHeader(MIME_DESC, MIME_DESC_PGP).setHeader(MIME_ENCODING, MIME_ENCODING_7BIT).setContent(MIME_VAL_CONTENT_PGP_PREAMBLE);
    root.createChild(MIME_TYPE_ENC).setHeader(MIME_DESC, MIME_DESC_VER).setHeader(MIME_ENCODING, MIME_ENCODING_7BIT).setContent(MIME_VAL_CONTENT_VERSION);
    root.createChild(MIME_TYPE_OCT).setHeader(MIME_DESC, MIME_DESC_PGP).setHeader(MIME_ENCODING, MIME_ENCODING_7BIT).setHeader(MIME_DISP, MIME_DISP_INLINE).setContent(ciphertext).filename = MIME_FILE_ENC;
    this._createEnvelope(message, root);
    message.raw = root.build();
    message.smtpEnvelope = root.getEnvelope();
    return message.raw;
};

module.exports = Outbox;
