import type { Express } from 'express';
import { requireAuth } from '../middleware/session';
import { addHistory, deleteHistory, listHistory } from '../store/history';

export function attachHistoryRoutes(app: Express): void {
  app.get('/history', requireAuth, (req, res) => {
    res.json({ history: listHistory(req.userId ?? 0) });
  });

  app.post('/history', requireAuth, (req, res) => {
    const body = req.body || {};
    addHistory(req.userId ?? 0, body.kugouAccountId || null, body.format || 'json', body.count || 0, body.content || '');
    res.json({ success: true });
  });

  app.delete('/history/:id', requireAuth, (req, res) => {
    deleteHistory(Number(req.params.id), req.userId ?? 0);
    res.json({ success: true });
  });
}
