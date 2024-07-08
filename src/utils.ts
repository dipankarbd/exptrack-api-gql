import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { sign } from 'jsonwebtoken';

const privKeyPath = path.join(__dirname, '../', 'id_rsa_priv.pem');
const PRIV_KEY = fs.readFileSync(privKeyPath, 'utf8');

export const generatePassword = (password: string) => {
  const salt = crypto.randomBytes(32).toString('hex');
  const genHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');
  return {
    salt: salt,
    hash: genHash,
  };
};

export const varifyPassword = (
  password: string,
  hash: string,
  salt: string,
): boolean => {
  const checkHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');
  return hash === checkHash;
};

export const generateToken = (userId: number) => {
  const expiresIn = 7 * 24 * 60 * 60;

  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
  };

  const signedToken = sign(payload, PRIV_KEY, {
    expiresIn: expiresIn,
    algorithm: 'RS256',
  });

  return {
    token: 'Bearer ' + signedToken,
    expires: `${expiresIn}s`,
  };
};
