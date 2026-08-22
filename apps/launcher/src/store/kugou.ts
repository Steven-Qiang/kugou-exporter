import { db } from '../db';

export interface KugouAccount {
  id: number;
  user_id: number;
  kg_userid: string;
  nickname: string;
  cookies_json: string;
  active: number;
  created_at: number;
  updated_at: number;
}

export interface PublicKugouAccount {
  id: number;
  kgUserid: string;
  nickname: string;
  active: boolean;
  created_at: number;
  updated_at: number;
}

function parseCookies(json: string): Record<string, string> {
  try {
    return JSON.parse(json || '{}') || {};
  } catch {
    return {};
  }
}

function countAccounts(userId: number): number {
  const row = db.prepare('SELECT COUNT(*) AS c FROM kugou_accounts WHERE user_id=?').get(userId) as { c: number };
  return row.c;
}

export function publicKugouAccount(acct: KugouAccount): PublicKugouAccount {
  return {
    id: acct.id,
    kgUserid: acct.kg_userid,
    nickname: acct.nickname,
    active: !!acct.active,
    created_at: acct.created_at,
    updated_at: acct.updated_at,
  };
}

export function listKugouAccounts(userId: number): KugouAccount[] {
  return db.prepare('SELECT * FROM kugou_accounts WHERE user_id=? ORDER BY active DESC, id DESC').all(userId) as unknown as KugouAccount[];
}

export function getActiveKugouAccount(userId: number): KugouAccount | undefined {
  return db.prepare('SELECT * FROM kugou_accounts WHERE user_id=? AND active=1').get(userId) as unknown as KugouAccount | undefined;
}

export function getKugouAccountOwned(id: number, userId: number): KugouAccount | undefined {
  return db.prepare('SELECT * FROM kugou_accounts WHERE id=? AND user_id=?').get(id, userId) as unknown as KugouAccount | undefined;
}

export function addKugouAccount(
  userId: number,
  nickname: string,
  cookies: Record<string, string>,
  makeActive: boolean
): KugouAccount {
  const now = Date.now();
  const active = makeActive || countAccounts(userId) === 0 ? 1 : 0;
  if (active) db.prepare('UPDATE kugou_accounts SET active=0 WHERE user_id=?').run(userId);
  const kgUserid = String(cookies.userid || '');
  const info = db
    .prepare('INSERT INTO kugou_accounts(user_id, kg_userid, nickname, cookies_json, active, created_at, updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(userId, kgUserid, nickname, JSON.stringify(cookies || {}), active, now, now);
  return db.prepare('SELECT * FROM kugou_accounts WHERE id=?').get(info.lastInsertRowid) as unknown as KugouAccount;
}

export function setKugouAccountCookies(id: number, userId: number, cookies: Record<string, string>): void {
  db.prepare('UPDATE kugou_accounts SET cookies_json=?, updated_at=? WHERE id=? AND user_id=?').run(
    JSON.stringify(cookies || {}),
    Date.now(),
    id,
    userId
  );
}

/** 按账号 id 直接写回 cookie，不校验用户归属 —— 供公开代理刷新登录态使用 */
export function setKugouAccountCookiesById(id: number, cookies: Record<string, string>): void {
  db.prepare('UPDATE kugou_accounts SET cookies_json=?, updated_at=? WHERE id=?').run(
    JSON.stringify(cookies || {}),
    Date.now(),
    id
  );
}

/** 按酷狗 userid 写回 cookie，不校验用户归属 —— 供公开代理刷新登录态使用 */
export function setKugouAccountCookiesByKgUserid(kgUserid: string, cookies: Record<string, string>): void {
  db.prepare('UPDATE kugou_accounts SET cookies_json=?, updated_at=? WHERE kg_userid=?').run(
    JSON.stringify(cookies || {}),
    Date.now(),
    String(kgUserid)
  );
}

export function setActiveKugouAccount(id: number, userId: number): void {
  db.prepare('UPDATE kugou_accounts SET active=0 WHERE user_id=?').run(userId);
  db.prepare('UPDATE kugou_accounts SET active=1, updated_at=? WHERE id=? AND user_id=?').run(Date.now(), id, userId);
}

export function updateKugouAccountNickname(id: number, userId: number, nickname: string): void {
  db.prepare('UPDATE kugou_accounts SET nickname=?, updated_at=? WHERE id=? AND user_id=?').run(nickname, Date.now(), id, userId);
}

export function deleteKugouAccount(id: number, userId: number): void {
  db.prepare('DELETE FROM kugou_accounts WHERE id=? AND user_id=?').run(id, userId);
}

export function getKugouCookies(id: number, userId: number): Record<string, string> {
  const acct = getKugouAccountOwned(id, userId);
  return acct ? parseCookies(acct.cookies_json) : {};
}

/** 按账号 id 直接取 cookie，不校验用户归属 —— 供公开代理链接（uid）使用 */
export function getKugouCookiesById(id: number): Record<string, string> {
  const acct = db.prepare('SELECT * FROM kugou_accounts WHERE id=?').get(id) as unknown as KugouAccount | undefined;
  return acct ? parseCookies(acct.cookies_json) : {};
}

/** 按酷狗 userid 反查账号 cookie（跨用户，供公开代理链接用） */
export function getKugouCookiesByKgUserid(kgUserid: string): Record<string, string> {
  const acct = db
    .prepare('SELECT * FROM kugou_accounts WHERE kg_userid=? ORDER BY id DESC LIMIT 1')
    .get(String(kgUserid)) as unknown as KugouAccount | undefined;
  return acct ? parseCookies(acct.cookies_json) : {};
}

/** 系统里第一个账号的 cookie（无 uid 时的默认兜底；兼容旧账号/旧链接） */
export function getFirstKugouCookies(): { id: number; cookies: Record<string, string> } | null {
  const acct = db
    .prepare('SELECT * FROM kugou_accounts ORDER BY id ASC LIMIT 1')
    .get() as unknown as KugouAccount | undefined;
  if (!acct) return null;
  return { id: acct.id, cookies: parseCookies(acct.cookies_json) };
}

export function getActiveKugouCookies(userId: number): Record<string, string> {
  const acct = getActiveKugouAccount(userId);
  return acct ? parseCookies(acct.cookies_json) : {};
}
