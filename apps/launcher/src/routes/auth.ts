import type { Express, Request, Response } from 'express';
import { requireAuth, SESSION_COOKIE } from '../middleware/session';
import { createSession, deleteSession } from '../store/sessions';
import {
  authenticate,
  countUsers,
  createUser,
  deleteUser,
  findById,
  findByUsername,
  listUsers,
  publicUser,
  updatePassword,
} from '../store/users';

const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// ---- 简单内存登录限流（防爆破）----
const attempts = new Map<string, { count: number; first: number }>();
function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > windowMs) {
    attempts.set(key, { count: 1, first: now });
    return true;
  }
  if (rec.count >= max) return false;
  rec.count++;
  return true;
}

function issueSession(res: Response, userId: number): void {
  const { token } = createSession(userId);
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: MAX_AGE, path: '/' });
}

export function attachAuthRoutes(app: Express): void {
  app.get('/auth/setup/status', (_req: Request, res: Response) => {
    res.json({ needsSetup: countUsers() === 0 });
  });

  app.post('/auth/setup', (req: Request, res: Response) => {
    if (!rateLimit(`setup:${req.ip}`, 10, 15 * 60 * 1000)) {
      res.status(429).json({ error: '操作过于频繁，请稍后再试' });
      return;
    }
    if (countUsers() > 0) {
      res.status(400).json({ error: '已初始化，不能重复创建管理员' });
      return;
    }
    const username = String(req.body?.username || '');
    const password = String(req.body?.password || '');
    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: '密码至少 6 位' });
      return;
    }
    if (findByUsername(username)) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }
    const user = createUser(username, password, true);
    issueSession(res, user.id);
    res.json({ success: true, user: publicUser(user) });
  });

  app.post('/auth/login', (req: Request, res: Response) => {
    if (!rateLimit(`login:${req.ip}`, 10, 15 * 60 * 1000)) {
      res.status(429).json({ error: '登录尝试过于频繁，请稍后再试' });
      return;
    }
    const username = String(req.body?.username || '');
    const password = String(req.body?.password || '');
    const user = authenticate(username, password);
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }
    issueSession(res, user.id);
    if (attempts.has(`login:${req.ip}`)) attempts.delete(`login:${req.ip}`);
    res.json({ success: true, user: publicUser(user) });
  });

  app.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
    if (req.sessionToken) deleteSession(req.sessionToken);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ success: true });
  });

  app.get('/auth/me', requireAuth, (req: Request, res: Response) => {
    res.json({ user: req.user, needsSetup: false });
  });

  // 修改自己的密码
  app.post('/auth/change-password', requireAuth, (req: Request, res: Response) => {
    const oldPassword = String(req.body?.oldPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 6) {
      res.status(400).json({ error: '新密码至少 6 位' });
      return;
    }
    if (!authenticate(req.user?.username || '', oldPassword)) {
      res.status(401).json({ error: '原密码错误' });
      return;
    }
    updatePassword(req.userId ?? 0, newPassword);
    res.json({ success: true });
  });

  // ---- 管理员：用户管理 ----
  app.get('/auth/users', requireAuth, (req: Request, res: Response) => {
    if (!req.user?.is_admin) {
      res.status(403).json({ error: '需要管理员权限' });
      return;
    }
    res.json({ users: listUsers() });
  });

  app.post('/auth/users', requireAuth, (req: Request, res: Response) => {
    if (!req.user?.is_admin) {
      res.status(403).json({ error: '需要管理员权限' });
      return;
    }
    const username = String(req.body?.username || '');
    const password = String(req.body?.password || '');
    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: '密码至少 6 位' });
      return;
    }
    if (findByUsername(username)) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }
    const user = createUser(username, password, false);
    res.json({ success: true, user: publicUser(user) });
  });

  app.post('/auth/users/:id/reset-password', requireAuth, (req: Request, res: Response) => {
    if (!req.user?.is_admin) {
      res.status(403).json({ error: '需要管理员权限' });
      return;
    }
    const id = Number(req.params.id);
    const target = findById(id);
    if (!target) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    const password = String(req.body?.password || '');
    if (password.length < 6) {
      res.status(400).json({ error: '密码至少 6 位' });
      return;
    }
    updatePassword(id, password);
    res.json({ success: true });
  });

  app.delete('/auth/users/:id', requireAuth, (req: Request, res: Response) => {
    if (!req.user?.is_admin) {
      res.status(403).json({ error: '需要管理员权限' });
      return;
    }
    const id = Number(req.params.id);
    if (id === req.userId) {
      res.status(400).json({ error: '不能删除当前登录账号' });
      return;
    }
    const target = findById(id);
    if (!target) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    const adminCount = listUsers().filter((u) => u.is_admin).length;
    if (target.is_admin && adminCount <= 1) {
      res.status(400).json({ error: '不能删除唯一的管理员' });
      return;
    }
    deleteUser(id);
    res.json({ success: true });
  });
}
