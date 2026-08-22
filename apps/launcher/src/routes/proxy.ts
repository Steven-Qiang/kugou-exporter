import type { Express, Response } from 'express';
import kugoumusicapi from 'kugoumusicapi';
import { refreshLogin, registerDev } from '../auth';
import { requireAuth } from '../middleware/session';
import {
  getActiveKugouAccount,
  getActiveKugouCookies,
  getKugouCookies,
  setKugouAccountCookies,
} from '../store/kugou';

export function attachProxyRoutes(app: Express): void {
  app.get('/proxy/song/url', requireAuth, async (req, res: Response) => {
    try {
      const userId = req.userId ?? 0;
      const uid = req.query.uid ? Number(req.query.uid) : null;

      // 解析目标账号：有 uid 用该账号，否则用当前激活账号（兼容旧版）
      let accountId: number | null = uid;
      let cookies = uid ? getKugouCookies(uid, userId) : getActiveKugouCookies(userId);
      if (!uid) {
        const active = getActiveKugouAccount(userId);
        if (!active) {
          res.status(404).send('No Kugou account');
          return;
        }
        accountId = active.id;
        cookies = getActiveKugouCookies(userId);
      }

      const persist = (c: Record<string, string>) => {
        if (accountId) setKugouAccountCookies(accountId, userId, c);
      };

      await refreshLogin(cookies, `u${accountId}`, persist);
      const cookie = await registerDev(cookies, persist);

      const hash = String(req.query.hash);
      const quality = String(req.query.quality || 'high');
      const urlRes = await kugoumusicapi.song_url({ hash, quality, cookie });

      const urls = urlRes.body?.url || [];
      if (urls.length > 0) res.redirect(301, urls[0]);
      else res.status(404).send('No URL found');
    } catch (error) {
      console.error(error);
      if (!res.headersSent) res.status(500).send('Proxy error');
    }
  });
}
