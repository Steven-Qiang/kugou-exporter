import { describe, expect, it } from 'vitest';
import {
  addKugouAccount,
  countKugouAccounts,
  deleteKugouAccount,
  getActiveKugouAccount,
  getActiveKugouCookies,
  getKugouAccountOwned,
  getKugouCookies,
  getKugouCookiesByKgUserid,
  listKugouAccounts,
  setActiveKugouAccount,
  updateKugouAccountNickname,
} from '../src/store/kugou';
import { createUser } from '../src/store/users';

describe('store/kugou', () => {
  const user = createUser('kugou-owner', 'secret123', false);
  const stranger = createUser('kugou-stranger', 'secret123', false);

  it('新增账号：抓取 cookie 与 kg_userid，首个自动激活', () => {
    const a = addKugouAccount(user.id, '主账号', { userid: '99999', token: 'abc' }, true);
    expect(a.kg_userid).toBe('99999');
    expect(a.active).toBe(1);
    expect(getActiveKugouAccount(user.id)?.id).toBe(a.id);
    expect(getActiveKugouCookies(user.id)).toEqual({ userid: '99999', token: 'abc' });
    expect(countKugouAccounts()).toBe(1);
  });

  it('再增账号不会自动激活（除非显式 makeActive）', () => {
    const b = addKugouAccount(user.id, '副账号', { userid: '88888', token: 'def' }, false);
    expect(countKugouAccounts()).toBe(2);
    expect(b.active).toBe(0);
    expect(getActiveKugouAccount(user.id)?.kg_userid).toBe('99999');
  });

  it('激活切换：switch 成功且互斥', () => {
    const accounts = listKugouAccounts(user.id);
    const second = accounts.find((x) => x.kg_userid === '88888')!;
    expect(setActiveKugouAccount(second.id, user.id)).toBe(true);
    const active = getActiveKugouAccount(user.id)!;
    expect(active.id).toBe(second.id);
    expect(listKugouAccounts(user.id).filter((x) => x.active)).toHaveLength(1);
  });

  it('越权操作返回 false（跨用户不生效）', () => {
    const first = listKugouAccounts(user.id).find((x) => x.kg_userid === '99999')!;
    expect(setActiveKugouAccount(first.id, stranger.id)).toBe(false);
    expect(updateKugouAccountNickname(first.id, stranger.id, 'hack')).toBe(false);
    expect(deleteKugouAccount(first.id, stranger.id)).toBe(false);
    expect(getKugouAccountOwned(first.id, stranger.id)).toBeUndefined();
  });

  it('重命名 / 删除（归属校验）', () => {
    const first = listKugouAccounts(user.id).find((x) => x.kg_userid === '99999')!;
    expect(updateKugouAccountNickname(first.id, user.id, '改名')).toBe(true);
    expect(listKugouAccounts(user.id).find((x) => x.id === first.id)?.nickname).toBe('改名');
    expect(deleteKugouAccount(first.id, user.id)).toBe(true);
    expect(listKugouAccounts(user.id).find((x) => x.id === first.id)).toBeUndefined();
  });

  it('按 kg_userid 反查 cookie（供公开代理用）', () => {
    expect(getKugouCookiesByKgUserid('88888')).toEqual({ userid: '88888', token: 'def' });
    expect(getKugouCookiesByKgUserid('nope')).toEqual({});
  });

  it('getKugouCookies 按 id+归属返回，越权为空', () => {
    const second = listKugouAccounts(user.id).find((x) => x.kg_userid === '88888')!;
    expect(getKugouCookies(second.id, user.id)).toEqual({ userid: '88888', token: 'def' });
    expect(getKugouCookies(second.id, stranger.id)).toEqual({});
  });
});
