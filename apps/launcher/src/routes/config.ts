import type { Express } from 'express';
import { requireAuth } from '../middleware/session';
import { getSettings, setQuality, setServerUrl } from '../store/settings';

export function attachConfigRoutes(app: Express, getServerUrl: () => string): void {
  app.get('/config/get', requireAuth, (req, res) => {
    const settings = getSettings(req.userId ?? 0);
    res.json({ serverUrl: settings.serverUrl || getServerUrl(), settings });
  });

  app.post('/config/save', requireAuth, (req, res) => {
    if (req.body?.quality) setQuality(req.userId ?? 0, req.body.quality);
    if (req.body?.serverUrl) setServerUrl(req.userId ?? 0, String(req.body.serverUrl));
    res.json({ success: true });
  });
}
