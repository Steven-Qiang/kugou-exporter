import type { Express, Response } from 'express';
import kugoumusicapi from 'kugoumusicapi';
import { requireAuth } from '../middleware/session';
import {
  addKugouAccount,
  deleteKugouAccount,
  getActiveKugouAccount,
  getActiveKugouCookies,
  listKugouAccounts,
  publicKugouAccount,
  setActiveKugouAccount,
  updateKugouAccountNickname,
} from '../store/kugou';

/** 用“当前激活的酷狗账号”的 cookie 调用酷狗接口，返回其 body。 */
async function withActiveKugou(userId: number, fn: (cookie: Record<string, string>) => Promise<any>) {
  const acct = getActiveKugouAccount(userId);
  if (!acct) return { status: 401, body: { code: 401, data: null, msg: '尚未添加或激活酷狗账号' } };
  const cookie = getActiveKugouCookies(userId);
  try {
    const resp = await fn(cookie);
    return { status: resp.status || 200, body: resp.body };
  } catch (e: any) {
    console.error('[kugou] error', e?.message || e);
    return { status: 502, body: { code: 502, data: null, msg: '酷狗接口调用失败', detail: e?.body || e?.message } };
  }
}

export function attachKugouRoutes(app: Express): void {
  app.get('/kugou', requireAuth, (req, res) => {
    res.json({ accounts: listKugouAccounts(req.userId ?? 0).map(publicKugouAccount) });
  });

  // 添加酷狗账号：保存当前请求里的浏览器 cookie（前端在完成酷狗登录后调用）
  app.post('/kugou', requireAuth, (req, res) => {
    const nickname = String(req.body?.nickname || '');
    const cookies = req.cookies || {};
    const makeActive = req.body?.active === undefined ? true : !!req.body.active;
    const acct = addKugouAccount(req.userId ?? 0, nickname, cookies, makeActive);
    res.json({ success: true, account: publicKugouAccount(acct) });
  });

  app.post('/kugou/:id/activate', requireAuth, (req, res) => {
    setActiveKugouAccount(Number(req.params.id), req.userId ?? 0);
    res.json({ success: true });
  });

  app.post('/kugou/:id/rename', requireAuth, (req, res) => {
    updateKugouAccountNickname(Number(req.params.id), req.userId ?? 0, String(req.body?.nickname || ''));
    res.json({ success: true });
  });

  app.delete('/kugou/:id', requireAuth, (req, res) => {
    deleteKugouAccount(Number(req.params.id), req.userId ?? 0);
    res.json({ success: true });
  });

  // ---- 数据接口（用激活酷狗账号的 cookie，服务端直连，前端无需持有 cookie）----
  app.get('/kugou/me', requireAuth, async (req, res: Response) => {
    const r = await withActiveKugou(req.userId ?? 0, (cookie) => kugoumusicapi.user_detail({ cookie }));
    res.status(r.status).json(r.body);
  });

  app.get('/kugou/playlist', requireAuth, async (req, res: Response) => {
    const r = await withActiveKugou(req.userId ?? 0, (cookie) => kugoumusicapi.user_playlist({ cookie }));
    res.status(r.status).json(r.body);
  });

  app.get('/kugou/playlist/tracks', requireAuth, async (req, res: Response) => {
    const listid = Number(req.query.listid);
    const page = Number(req.query.page || 1);
    const pagesize = Number(req.query.pagesize || 100);
    const r = await withActiveKugou(req.userId ?? 0, (cookie) =>
      kugoumusicapi.playlist_track_all_new({ cookie, listid, page, pagesize }));
    res.status(r.status).json(r.body);
  });

  app.get('/kugou/song/url', requireAuth, async (req, res: Response) => {
    const hash = String(req.query.hash);
    const quality = String(req.query.quality || 'high');
    const r = await withActiveKugou(req.userId ?? 0, (cookie) => kugoumusicapi.song_url({ hash, quality, cookie }));
    res.status(r.status).json(r.body);
  });
}
