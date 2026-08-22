import type { Express } from 'express';
import { listHistory, addHistory, deleteHistory } from '../store/history';
import { requireAuth } from '../middleware/session';

interface HistoryItem {
  id: number;
  kugouAccountId: number | null;
  playlistName: string;
  format: string;
  count: number;
  content: string;
  createdAt: number;
}

function toPublic(row: {
  id: number;
  kugou_account_id: number | null;
  playlist_name: string;
  format: string;
  count: number;
  content: string;
  created_at: number;
}): HistoryItem {
  return {
    id: row.id,
    kugouAccountId: row.kugou_account_id,
    playlistName: row.playlist_name || '',
    format: row.format,
    count: row.count,
    content: row.content,
    createdAt: row.created_at,
  };
}

export function attachHistoryRoutes(app: Express): void {
  app.get('/history', requireAuth, (req, res) => {
    res.json({ history: listHistory(req.userId ?? 0).map(toPublic) });
  });

  app.post('/history', requireAuth, (req, res) => {
    const body = req.body || {};
    addHistory(
      req.userId ?? 0,
      body.kugouAccountId || null,
      body.playlistName || '',
      body.format || 'json',
      body.count || 0,
      body.content || ''
    );
    res.json({ success: true });
  });

  app.delete('/history/:id', requireAuth, (req, res) => {
    deleteHistory(Number(req.params.id), req.userId ?? 0);
    res.json({ success: true });
  });
}
