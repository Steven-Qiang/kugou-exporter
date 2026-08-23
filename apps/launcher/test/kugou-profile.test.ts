import { describe, expect, it } from 'vitest';
import { normalizeKugouUser } from '../src/lib/kugou-profile';

describe('lib/kugou-profile', () => {
  it('兼容 `{ code, data: { userinfo } }` 包装', () => {
    const p = normalizeKugouUser({ code: 0, data: { userinfo: { userid: 123, nickname: '阿强', pic: 'http://img/{size}/x', vip_type: 1, gender: 1 } } });
    expect(p.userid).toBe(123);
    expect(p.nickname).toBe('阿强');
    expect(p.pic).toBe('http://img/{size}/x');
    expect(p.vipType).toBe(1);
    expect(p.gender).toBe(1);
  });

  it('兼容 `{ data: { data: { userinfo } } }` 深层包装', () => {
    const p = normalizeKugouUser({ code: 0, data: { data: { userinfo: { userid: '456', nickname2: '小美', vip_type: 2 } } } });
    expect(p.userid).toBe(456);
    expect(p.nickname).toBe('小美');
    expect(p.vipType).toBe(2);
  });

  it('兼容 `{ userinfo }` 顶层与 `data` 直接为用户对象', () => {
    expect(normalizeKugouUser({ userinfo: { userid: 1, nickname: 'x' } }).nickname).toBe('x');
    expect(normalizeKugouUser({ data: { userid: 2, nickname: 'y', vip_type: 3 } }).vipType).toBe(3);
  });

  it('无用户信息时返回安全的空资料（vipType 0）', () => {
    const p = normalizeKugouUser({ code: 404, data: null });
    expect(p.vipType).toBe(0);
    expect(p.nickname).toBe('');
    expect(p.pic).toBe('');
    expect(p.userid).toBeUndefined();
    expect(normalizeKugouUser(null).vipType).toBe(0);
  });

  it('非数字 / 缺失字段安全降级', () => {
    const p = normalizeKugouUser({ data: { userinfo: { userid: 'abc', nickname: '', pic: 123 } } });
    expect(p.userid).toBeUndefined();
    expect(p.nickname).toBe('');
    expect(p.pic).toBe('');
  });
});
