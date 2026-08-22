import crypto from 'node:crypto';
import { db } from '../db';

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export function createSession(userId: number): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + SESSION_TTL;
  db.prepare('INSERT INTO sessions(token, user_id, created_at, expires_at) VALUES (?,?,?,?)').run(token, userId, now, expiresAt);
  return { token, expiresAt };
}

export function getSession(token: string): { userId: number } | null {
  const row = db.prepare('SELECT * FROM sessions WHERE token=?').get(token) as { user_id: number; expires_at: number } | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token=?').run(token);
    return null;
  }
  return { userId: row.user_id };
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token=?').run(token);
}
