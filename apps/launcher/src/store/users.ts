import { db } from '../db';
import { hashPassword, verifyPassword } from '../lib/password';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  salt: string;
  is_admin: number;
  created_at: number;
}

export interface PublicUser {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: number;
}

export function publicUser(user: User): PublicUser {
  return { id: user.id, username: user.username, is_admin: !!user.is_admin, created_at: user.created_at };
}

export function createUser(username: string, password: string, isAdmin = false): User {
  const { hash, salt } = hashPassword(password);
  const now = Date.now();
  const info = db
    .prepare('INSERT INTO users(username, password_hash, salt, is_admin, created_at) VALUES (?,?,?,?,?)')
    .run(username, hash, salt, isAdmin ? 1 : 0, now);
  return db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid) as unknown as User;
}

export function findByUsername(username: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE username=?').get(username) as User | undefined;
}

export function findById(id: number): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id=?').get(id) as unknown as User | undefined;
}

export function authenticate(username: string, password: string): User | null {
  const user = findByUsername(username);
  if (!user) return null;
  return verifyPassword(password, user.salt, user.password_hash) ? user : null;
}

export function countUsers(): number {
  const row = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  return row.c;
}

export function listUsers(): PublicUser[] {
  const rows = db.prepare('SELECT * FROM users ORDER BY id ASC').all() as unknown as User[];
  return rows.map(publicUser);
}

export function updatePassword(userId: number, password: string): void {
  const { hash, salt } = hashPassword(password);
  db.prepare('UPDATE users SET password_hash=?, salt=? WHERE id=?').run(hash, salt, userId);
}

export function deleteUser(userId: number): void {
  db.prepare('DELETE FROM users WHERE id=?').run(userId);
}
