import type { Express, Response } from 'express';
import kugoumusicapi from 'kugoumusicapi';
import { refreshLogin, registerDev } from '../auth';
import {
  getFirstKugouCookies,
  getKugouCookiesByKgUserid,
  setKugouAccountCookiesById,
  setKugouAccountCookiesByKgUserid,
} from '../store/kugou';

export function attachProxyRoutes(app: Express): void {
  // 代理链接是导出给 XiaoMusic 等外部播放器访问的，不能要求登录态。
  // 优先按 uid（酷狗 userid）定位账号 cookie；没传 uid 或匹配不到时，兜底到系统第一个账号（兼容旧账号/旧链接）。
  app.get('/proxy/song/url', async (req, res: Response) => {
    try {
      const uid = req.query.uid ? String(req.query.uid) : '';

      // 解析目标账号：定一个 persist 目标（账号 id）和对应 cookie
      let accountId: number | null = null;
      let cookies: Record<string, string> | null = null;

      if (uid) {
        const byUser = getKugouCookiesByKgUserid(uid);
        if (Object.keys(byUser).length > 0) {
          accountId = null; // 通过 userid 命中但拿不到 id，改用写回 by userid（见下）
          cookies = byUser;
        }
      }

      // 未命中（无 uid / userid 匹配不到 / 旧账号 kg_userid 为空）→ 兜底第一个账号
      if (!cookies || Object.keys(cookies).length === 0) {
        const first = getFirstKugouCookies();
        if (!first) {
          res.status(404).send('No Kugou account');
          return;
        }
        accountId = first.id;
        cookies = first.cookies;
      }

      // persist 回写：能定位账号 id 时按 id 写；否则按 userid 写（保持后续一致）
      const persist = (c: Record<string, string>) => {
        if (accountId) setKugouAccountCookiesById(accountId, c);
        else if (uid) setKugouAccountCookiesByKgUserid(uid, c);
      };

      await refreshLogin(cookies, `proxy-${accountId ?? uid}`, persist);
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
