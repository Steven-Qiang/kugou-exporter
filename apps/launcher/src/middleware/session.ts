import type { NextFunction, Request, Response } from 'express';
import { getSession } from '../store/sessions';
import { findById, publicUser } from '../store/users';

export const SESSION_COOKIE = 'kugou_session';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: '会话已过期' });
    return;
  }
  const user = findById(session.userId);
  if (!user) {
    res.status(401).json({ error: '用户不存在' });
    return;
  }
  req.user = publicUser(user);
  req.userId = user.id;
  req.sessionToken = token;
  next();
}
