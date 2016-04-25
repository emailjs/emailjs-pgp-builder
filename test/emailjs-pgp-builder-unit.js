'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Outbox = require('..');

describe('Outbox', () => {
    
    //
    // SUT
    //

    let outbox;

    //
    // Fixture
    //

    let messages, message;

    // Prepare fixture and SUT
    beforeEach(() => {
        message = {
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

        outbox = new Outbox();
    });

    //
    // Test Cases
    //

    describe('#buildPlaintext', () => {
        it('should build plain text rfc2822', () => {
            let mimeRoot = outbox.buildPlaintext(message);
            expect(/Content-Type: multipart\/alternative;\r\n boundary="----sinikael-\?=[a-z0-9_\-\.]+"\r\n\r\n------sinikael-\?=[a-z0-9_\-\.]+\r\nContent-Type: text\/plain\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\nasd\r\n------sinikael-\?=[a-z0-9_\-\.]+\r\nContent-Type: text\/html\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n<html><head><\/head><body>asd<\/body><\/html>\r\n------sinikael-\?=[a-z0-9_\-\.]+--\r\n/m.test(mimeRoot.build())).to.be.true;
        });
    });

    describe('#buildSigned', () => {
        it('should build signed PGP/MIME', () => {
            let signature = '-----BEGIN PGP SIGNATURE-----\n\nFOOFOOFOOFOOFOOFOOFOOFOOFOOFOO\n=BAR\n-----END PGP SIGNATURE-----';
            let mimeRoot = outbox.buildPlaintext(message);
            outbox.buildSigned(message, mimeRoot, signature);
            expect(/Content-Type: multipart\/signed; protocol="application\/pgp-signature";\r\n boundary="----sinikael-\?=[a-z0-9_\-\.]*"\r\nSubject: foo\r\nFrom: Fred Foo <fred@foobar.bar>\r\nTo: Bla Foo <bla@foobar.bar>\r\nCc: Bli Foo <bli@foobar.bar>\r\nDate: [a-zA-z0-9 ,:+]*\r\nMessage-Id: <[a-z0-9-]*@foobar.bar>\r\nMIME-Version: 1.0\r\n\r\n------sinikael-\?=[a-z0-9_\-\.]*\r\nContent-Type: multipart\/alternative;\r\n boundary="----sinikael-\?=[a-z0-9_\-\.]*"\r\n\r\n------sinikael-\?=[a-z0-9_\-\.]*\r\nContent-Type: text\/plain\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\nasd\r\n------sinikael-\?=[a-z0-9_\-\.]*\r\nContent-Type: text\/html\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n<html><head><\/head><body>asd<\/body><\/html>\r\n------sinikael-\?=[a-z0-9_\-\.]*--\r\n\r\n------sinikael-\?=[a-z0-9_\-\.]*\r\nContent-Type: application\/pgp-signature\r\nContent-Transfer-Encoding: 7bit\r\nContent-Disposition: inline; filename=signature.asc\r\n\r\n-----BEGIN PGP SIGNATURE-----\r\n\r\nFOOFOOFOOFOOFOOFOOFOOFOOFOOFOO\r\n=BAR\r\n-----END PGP SIGNATURE-----\r\n------sinikael-\?=[a-z0-9_\-\.]*--/m.test(message.raw)).to.be.true;
            expect(message.smtpEnvelope).to.deep.equal({
                from: 'fred@foobar.bar',
                to: [ 'bla@foobar.bar', 'bli@foobar.bar', 'Blu@foobar.bar' ]
            });
        });
    });

    describe('#buildEncrypted', () => {
        it('should build plain text rfc2822', () => {
            let ciphertext = '-----BEGIN PGP MESSAGE-----\n\nFOOFOOFOOFOOFOOFOOFOOFOOFOOFOO\n=BAR\n-----END PGP MESSAGE-----';
            outbox.buildEncrypted(message, ciphertext);
            expect(/Content-Type: multipart\/encrypted; protocol="application\/pgp-encrypted";\r\n boundary="----sinikael-\?=[a-z0-9_\-\.]*"\r\nContent-Description: OpenPGP encrypted message\r\nContent-Transfer-Encoding: 7bit\r\nSubject: foo\r\nFrom: Fred Foo <fred@foobar.bar>\r\nTo: Bla Foo <bla@foobar.bar>\r\nCc: Bli Foo <bli@foobar.bar>\r\nDate: [a-zA-z0-9 ,:+]*\r\nMessage-Id: <[a-z0-9-]*@foobar.bar>\r\nMIME-Version: 1.0\r\n\r\nThis is an OpenPGP\/MIME encrypted message.\r\n\r\n------sinikael-\?=[a-z0-9_\-\.]*\r\nContent-Type: application\/pgp-encrypted\r\nContent-Description: PGP\/MIME Versions Identification\r\nContent-Transfer-Encoding: 7bit\r\n\r\nVersion: 1\r\n------sinikael-\?=[a-z0-9_\-\.]*\r\nContent-Type: application\/octet-stream\r\nContent-Description: OpenPGP encrypted message\r\nContent-Transfer-Encoding: 7bit\r\nContent-Disposition: inline; filename=encrypted.asc\r\n\r\n-----BEGIN PGP MESSAGE-----\r\n\r\nFOOFOOFOOFOOFOOFOOFOOFOOFOOFOO\r\n=BAR\r\n-----END PGP MESSAGE-----\r\n------sinikael-\?=[a-z0-9_\-\.]*--/m.test(message.raw)).to.be.true;
            expect(message.smtpEnvelope).to.deep.equal({
                from: 'fred@foobar.bar',
                to: [ 'bla@foobar.bar', 'bli@foobar.bar', 'Blu@foobar.bar' ]
            });
        });
    });
});
