import crypto from 'node:crypto';

export interface PasswordHash {
  hash: string;
  salt: string;
}

export function hashPassword(password: string, salt?: string): PasswordHash {
  const saltStr = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, saltStr, 64).toString('hex');
  return { hash, salt: saltStr };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(candidate, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
