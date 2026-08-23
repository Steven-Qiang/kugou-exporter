import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/password';

describe('lib/password', () => {
  it('hash + verify round-trip 正确', () => {
    const { hash, salt } = hashPassword('secret123');
    expect(salt).toBeTruthy();
    expect(hash).toBeTruthy();
    expect(verifyPassword('secret123', salt, hash)).toBe(true);
  });

  it('错误密码返回 false', () => {
    const { hash, salt } = hashPassword('secret123');
    expect(verifyPassword('wrong', salt, hash)).toBe(false);
  });

  it('使用指定 salt（便于测试/迁移）', () => {
    const { hash, salt } = hashPassword('pw', 'abcd1234');
    expect(salt).toBe('abcd1234');
    expect(verifyPassword('pw', 'abcd1234', hash)).toBe(true);
  });

  it('每次调用生成不同 salt/hash（随机性）', () => {
    const a = hashPassword('same-pw');
    const b = hashPassword('same-pw');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });
});
