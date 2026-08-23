import { describe, expect, it } from 'vitest';
import { db } from '../src/db';
import { cleanupExpiredSessions, createSession, deleteSession, getSession } from '../src/store/sessions';
import { authenticate, countUsers, createUser, deleteUser, findById, listUsers, publicUser, updatePassword } from '../src/store/users';

describe('store/users', () => {
  it('创建用户并校验密码', () => {
    const u = createUser('alice', 'secret123', false);
    expect(u.username).toBe('alice');
    expect(u.is_admin).toBe(0);
    expect(authenticate('alice', 'secret123')?.id).toBe(u.id);
    expect(authenticate('alice', 'wrong')).toBeNull();
    expect(findById(u.id)?.username).toBe('alice');
  });

  it('管理员与普通用户 is_admin 正确', () => {
    const admin = createUser('boss', 'secret123', true);
    expect(admin.is_admin).toBe(1);
    expect(publicUser(admin).is_admin).toBe(true);
    expect(countUsers()).toBeGreaterThanOrEqual(2);
  });

  it('修改密码后旧密码失效', () => {
    const u = createUser('bob', 'oldpass', false);
    updatePassword(u.id, 'newpass123');
    expect(authenticate('bob', 'oldpass')).toBeNull();
    expect(authenticate('bob', 'newpass123')?.id).toBe(u.id);
  });

  it('listUsers 不含密码字段', () => {
    const users = listUsers();
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).not.toHaveProperty('password_hash');
    expect(users[0]).not.toHaveProperty('salt');
  });

  it('删除用户并级联清理其会话', () => {
    const u = createUser('carol', 'secret123', false);
    const { token } = createSession(u.id);
    expect(getSession(token)).not.toBeNull();
    deleteUser(u.id);
    expect(findById(u.id)).toBeUndefined();
    expect(getSession(token)).toBeNull(); // FK 级联删除
  });
});

describe('store/sessions', () => {
  it('创建 / 读取 / 删除会话', () => {
    const u = createUser('dave', 'secret123', false);
    const { token } = createSession(u.id);
    expect(getSession(token)?.userId).toBe(u.id);
    deleteSession(token);
    expect(getSession(token)).toBeNull();
  });

  it('过期会话返回 null 并被清理', () => {
    const u = createUser('eve', 'secret123', false);
    const past = Date.now() - 1000;
    db.prepare('INSERT INTO sessions(token, user_id, created_at, expires_at) VALUES (?,?,?,?)').run(
      'expired-token',
      u.id,
      past - 1000,
      past
    );
    expect(getSession('expired-token')).toBeNull();
    // 再次访问不存在的 token 也为 null
    expect(getSession('expired-token')).toBeNull();
  });

  it('cleanupExpiredSessions 清理过期的行', () => {
    const u = createUser('frank', 'secret123', false);
    const past = Date.now() - 5000;
    db.prepare('INSERT INTO sessions(token, user_id, created_at, expires_at) VALUES (?,?,?,?)').run(
      'stale-token',
      u.id,
      past,
      past
    );
    const removed = cleanupExpiredSessions();
    expect(removed).toBeGreaterThanOrEqual(1);
    expect(getSession('stale-token')).toBeNull();
  });
});
