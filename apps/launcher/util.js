const kugoumusicapi = require('kugoumusicapi');
const kugoumusicapi_util = require('kugoumusicapi/util');
const { getAccountCookies, setAccount, getActiveUserId } = require('./config');

const lastRefresh = {};

/**
 * Refresh the login token for one account (1h throttle per account).
 * @param {string} [userId]
 * @returns {Promise<object>} the account cookies
 */
async function refreshLogin(userId) {
  const key = userId || getActiveUserId();
  const now = Date.now();
  if (lastRefresh[key] && now - lastRefresh[key] < 60 * 60 * 1000) {
    return getAccountCookies(key);
  }
  lastRefresh[key] = now;
  try {
    const cookies = getAccountCookies(key);
    if (!cookies || Object.keys(cookies).length === 0) return cookies;
    const resp = await kugoumusicapi.login_token(cookies);
    if (resp.status == 200 && resp.cookie && resp.cookie.length > 0) {
      const new_cookies = kugoumusicapi_util.cookieToJson(resp.cookie.join(';'));
      const merged = { ...cookies, ...new_cookies };
      setAccount(key, merged);
      return merged;
    }
    return cookies;
  } catch (error) {
    console.error('refreshToken', error);
    return getAccountCookies(key);
  }
}

/**
 * Register device (dfid) for one account and persist it.
 * @param {string} [userId]
 * @returns {Promise<object>} the account cookies
 */
async function registerDev(userId) {
  const key = userId || getActiveUserId();
  try {
    const cookies = getAccountCookies(key);
    const resp = await kugoumusicapi.register_dev({ cookie: cookies });
    if (resp.body.status == 1 && resp.body?.data?.dfid) {
      const merged = { ...cookies, dfid: resp.body.data.dfid };
      setAccount(key, merged);
      return merged;
    }
    return cookies;
  } catch (error) {
    console.error('register_dev', error);
    return getAccountCookies(key);
  }
}

module.exports = { refreshLogin, registerDev };
