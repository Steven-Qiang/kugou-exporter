import { db } from '../db';

export interface Settings {
  quality: string;
  serverUrl: string;
}

export function getSettings(userId: number): Settings {
  const row = db
    .prepare('SELECT quality, server_url FROM settings WHERE user_id=?')
    .get(userId) as { quality: string; server_url: string } | undefined;
  return row ? { quality: row.quality, serverUrl: row.server_url } : { quality: 'high', serverUrl: '' };
}

export function setQuality(userId: number, quality: string): void {
  db.prepare(
    'INSERT INTO settings(user_id, quality) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET quality=excluded.quality'
  ).run(userId, quality);
}

export function setServerUrl(userId: number, serverUrl: string): void {
  db.prepare(
    'INSERT INTO settings(user_id, server_url) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET server_url=excluded.server_url'
  ).run(userId, serverUrl);
}
