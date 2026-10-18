const assert = require('node:assert/strict');
const { test } = require('node:test');
const braces = require('braces');
const forge = require('node-forge');
const { MailerService } = require('@nestjs-modules/mailer');

test('GHSA-vfj7-8cjw-p6xm: braces rejects deep patterns before recursive compilation or expansion', () => {
  assert.deepEqual(braces.expand('src/{client,server}/*.ts'), ['src/client/*.ts', 'src/server/*.ts']);
  for (const [open, close] of [['{', '}'], ['(', ')']]) {
    const pattern = open.repeat(4000) + 'a,b' + close.repeat(4000);
    for (const run of [braces, braces.expand]) {
      assert.throws(() => run(pattern), { name: 'SyntaxError', message: 'Pattern nesting exceeds maximum depth (100)' });
    }
  }
});

test('Nest Mailer and Nodemailer preserve sender defaults with a local JSON transport', async () => {
  const mailer = new MailerService({ transport: { jsonTransport: true }, defaults: { from: 'sender@example.test' } });
  try {
    const result = await mailer.sendMail({ to: 'recipient@example.test', subject: 'Local compatibility check', text: 'No network delivery' });
    const message = JSON.parse(result.message);
    assert.equal(message.from.address, 'sender@example.test');
    assert.equal(message.to[0].address, 'recipient@example.test');
    assert.equal(message.subject, 'Local compatibility check');
  } finally { await mailer.onModuleDestroy(); }
});

test('GHSA-86w9-cpqp-85rv: node-forge rejects extra nested DigestAlgorithm elements', () => {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 1024, e: 3 });
  const digest = forge.md.sha256.create().update('security regression').digest().getBytes();
  const asn1 = forge.asn1;
  const element = (type, constructed, value) => asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);
  const algorithm = [element(asn1.Type.OID, false, asn1.oidToDer(forge.pki.oids.sha256).getBytes()), element(asn1.Type.NULL, false, '')];
  for (const extra of [[], [element(asn1.Type.OCTETSTRING, false, 'garbage')]]) {
    const info = element(asn1.Type.SEQUENCE, true, [element(asn1.Type.SEQUENCE, true, [...algorithm, ...extra]), element(asn1.Type.OCTETSTRING, false, digest)]);
    const signature = keys.privateKey.sign(asn1.toDer(info).getBytes(), 'NONE');
    if (extra.length) assert.throws(() => keys.publicKey.verify(digest, signature), /DigestInfo/);
    else assert.equal(keys.publicKey.verify(digest, signature), true);
  }
});
