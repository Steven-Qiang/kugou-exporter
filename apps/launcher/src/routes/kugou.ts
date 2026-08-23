import type { Express, Response } from 'express';
import kugoumusicapi from 'kugoumusicapi';
import { normalizeKugouUser } from '../lib/kugou-profile';
import { requireAuth, SESSION_COOKIE } from '../middleware/session';
import {
  addKugouAccount,
  deleteKugouAccount,
  getActiveKugouAccount,
  getActiveKugouCookies,
  getKugouAccountOwned,
  getKugouCookies,
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
    // 剔除应用自身的会话 cookie（kugou_session）等非酷狗凭据，避免把会话令牌持久化进酷狗 cookie 数据
    const safety = req.cookies ? { ...req.cookies } : {};
    delete safety[SESSION_COOKIE];
    const cookies = safety;
    const makeActive = req.body?.active === undefined ? true : !!req.body.active;
    const acct = addKugouAccount(req.userId ?? 0, nickname, cookies, makeActive);
    res.json({ success: true, account: publicKugouAccount(acct) });
  });

  app.post('/kugou/:id/activate', requireAuth, (req, res) => {
    const ok = setActiveKugouAccount(Number(req.params.id), req.userId ?? 0);
    if (!ok) {
      res.status(404).json({ error: '账号不存在或无权操作' });
      return;
    }
    res.json({ success: true });
  });

  app.post('/kugou/:id/rename', requireAuth, (req, res) => {
    const ok = updateKugouAccountNickname(Number(req.params.id), req.userId ?? 0, String(req.body?.nickname || ''));
    if (!ok) {
      res.status(404).json({ error: '账号不存在或无权操作' });
      return;
    }
    res.json({ success: true });
  });

  app.delete('/kugou/:id', requireAuth, (req, res) => {
    const ok = deleteKugouAccount(Number(req.params.id), req.userId ?? 0);
    if (!ok) {
      res.status(404).json({ error: '账号不存在或无权操作' });
      return;
    }
    res.json({ success: true });
  });

  // ---- 数据接口（用激活酷狗账号的 cookie，服务端直连，前端无需持有 cookie）----

  // 单个账号的详情（头像 / 会员等）。也用该账号自身 cookie 直连酷狗，归属校验。
  app.get('/kugou/account/:id', requireAuth, async (req, res: Response) => {
    const id = Number(req.params.id);
    const userId = req.userId ?? 0;
    const acct = getKugouAccountOwned(id, userId);
    if (!acct) {
      res.status(404).json({ error: '账号不存在或无权操作' });
      return;
    }
    const cookie = getKugouCookies(id, userId);
    try {
      const resp = await kugoumusicapi.user_detail({ cookie });
      const profile = normalizeKugouUser(resp?.body);
      // 顺带用最新昵称回写，保持列表昵称新鲜（仅在酷狗返回了昵称时）
      if (profile.nickname) updateKugouAccountNickname(id, userId, profile.nickname);
      res.json({ success: true, profile });
    } catch (e: any) {
      console.error('[kugou account detail] error', e?.message || e);
      res.status(502).json({ success: false, error: '获取账号详情失败', profile: { vipType: 0 } });
    }
  });

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
