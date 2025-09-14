import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.WORKOUT_JWT_SECRET || process.env.JWT_SECRET || 'dev-workout-secret';

function scryptHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, dk) => {
      if (err) return reject(err);
      resolve(dk.toString('hex'));
    });
  });
}

export async function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scryptHash(plain, salt);
  return `${salt}:${hash}`;
}

export async function verifyPassword(plain, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = await scryptHash(plain, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}


