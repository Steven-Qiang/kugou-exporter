import type { Express, Request, Response } from 'express';
import { requireAuth, SESSION_COOKIE } from '../middleware/session';
import { createSession, deleteSession } from '../store/sessions';
import { authenticate, countUsers, createUser, findByUsername, publicUser } from '../store/users';

const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function issueSession(res: Response, userId: number): void {
  const { token } = createSession(userId);
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: MAX_AGE, path: '/' });
}

export function attachAuthRoutes(app: Express): void {
  app.get('/auth/setup/status', (_req: Request, res: Response) => {
    res.json({ needsSetup: countUsers() === 0 });
  });

  app.post('/auth/setup', (req: Request, res: Response) => {
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
    const username = String(req.body?.username || '');
    const password = String(req.body?.password || '');
    const user = authenticate(username, password);
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }
    issueSession(res, user.id);
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
    if (findByUsername(username)) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }
    const user = createUser(username, password, false);
    res.json({ success: true, user: publicUser(user) });
  });
}
