import crypto from 'crypto';
import fs from 'fs';

const keyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'pkcs1',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs1',
    format: 'pem',
  },
});

// Create the public key file
fs.writeFileSync(__dirname + '/id_rsa_pub.pem', keyPair.publicKey);

// Create the private key file
fs.writeFileSync(__dirname + '/id_rsa_priv.pem', keyPair.privateKey);
