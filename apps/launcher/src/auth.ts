import kugoumusicapi from 'kugoumusicapi';
import { cookieToJson } from 'kugoumusicapi/util';

const lastRefresh: Record<string, number> = {};

export type PersistCookies = (cookies: Record<string, string>) => void;

/**
 * 为指定账号刷新登录态（1 小时节流，按 key）。刷新后的 cookie 通过 persist 回写。
 */
export async function refreshLogin(
  cookies: Record<string, string>,
  key: string,
  persist: PersistCookies
): Promise<Record<string, string>> {
  const now = Date.now();
  if (lastRefresh[key] && now - lastRefresh[key] < 60 * 60 * 1000) return cookies;
  lastRefresh[key] = now;
  try {
    if (!cookies || Object.keys(cookies).length === 0) return cookies;
    const resp = await kugoumusicapi.login_token(cookies);
    if (resp.status == 200 && resp.cookie && resp.cookie.length > 0) {
      const merged = { ...cookies, ...cookieToJson(resp.cookie.join(';')) };
      persist(merged);
      return merged;
    }
    return cookies;
  } catch (error) {
    console.error('refreshToken', error);
    return cookies;
  }
}

/**
 * 为指定账号注册设备（dfid）并持久化。
 */
export async function registerDev(cookies: Record<string, string>, persist: PersistCookies): Promise<Record<string, string>> {
  try {
    const resp = await kugoumusicapi.register_dev({ cookie: cookies });
    if (resp.body.status == 1 && resp.body?.data?.dfid) {
      const merged = { ...cookies, dfid: resp.body.data.dfid };
      persist(merged);
      return merged;
    }
    return cookies;
  } catch (error) {
    console.error('register_dev', error);
    return cookies;
  }
}
