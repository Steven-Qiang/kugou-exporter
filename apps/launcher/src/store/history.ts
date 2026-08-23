import { db } from '../db';

export interface HistoryRow {
  id: number;
  user_id: number;
  kugou_account_id: number | null;
  playlist_name: string;
  format: string;
  count: number;
  content: string;
  quality: string;
  created_at: number;
}

export function listHistory(userId: number): HistoryRow[] {
  return db.prepare('SELECT * FROM export_history WHERE user_id=? ORDER BY id DESC LIMIT 50').all(userId) as unknown as HistoryRow[];
}

export function addHistory(
  userId: number,
  kugouAccountId: number | null,
  playlistName: string,
  format: string,
  count: number,
  content: string,
  quality = ''
): void {
  db.prepare(
    'INSERT INTO export_history(user_id, kugou_account_id, playlist_name, format, count, content, quality, created_at) VALUES (?,?,?,?,?,?,?,?)'
  ).run(userId, kugouAccountId, playlistName, format, count, content, quality, Date.now());
}

export function deleteHistory(id: number, userId: number): void {
  db.prepare('DELETE FROM export_history WHERE id=? AND user_id=?').run(id, userId);
}
