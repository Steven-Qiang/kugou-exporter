const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const configPath = process.env.CONFIG_PATH || path.join(process.cwd(), 'config.yaml');

const defaultConfig = {
  serverUrl: '',
  settings: { quality: 'high' },
  activeUserId: 'default',
  accounts: {},
};

/**
 * Read + normalize the config. Legacy single-account config (top-level
 * `cookies`) is migrated once to `accounts[activeUserId]` on disk.
 * @returns {any}
 */
function getConfig() {
  if (!fs.existsSync(configPath)) {
    return { ...defaultConfig, accounts: {} };
  }
  let raw;
  try {
    raw = yaml.load(fs.readFileSync(configPath, 'utf8'));
  } catch {
    raw = null;
  }

  // Legacy migration
  if (raw && raw.cookies && !raw.accounts) {
    const userId = raw.activeUserId || 'default';
    const migrated = {
      serverUrl: raw.serverUrl || '',
      settings: { quality: 'high' },
      activeUserId: userId,
      accounts: { [userId]: { cookies: raw.cookies || {}, nickname: '' } },
    };
    fs.writeFileSync(configPath, yaml.dump(migrated), 'utf8');
    return migrated;
  }

  return normalize(raw);
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultConfig, accounts: {} };
  }
  return {
    serverUrl: raw.serverUrl || '',
    settings: { quality: raw.settings?.quality || 'high' },
    activeUserId: raw.activeUserId || 'default',
    accounts: raw.accounts || {},
  };
}

function saveConfig(config) {
  const clean = {
    serverUrl: config.serverUrl || '',
    settings: config.settings || { quality: 'high' },
    activeUserId: config.activeUserId || 'default',
    accounts: config.accounts || {},
  };
  fs.writeFileSync(configPath, yaml.dump(clean), 'utf8');
}

/* ---------- account helpers ---------- */

function getActiveUserId() {
  return getConfig().activeUserId || 'default';
}

function getActiveAccount() {
  const c = getConfig();
  return c.accounts?.[c.activeUserId || 'default'] || null;
}

function getAccountCookies(userId) {
  const c = getConfig();
  const acct = c.accounts?.[userId];
  return (acct && acct.cookies) || {};
}

function getActiveCookies() {
  return getAccountCookies(getActiveUserId());
}

function hasAccountCookies(userId) {
  const c = getConfig();
  const acct = c.accounts?.[userId];
  return !!(acct && acct.cookies && Object.keys(acct.cookies).length > 0);
}

function hasActiveCookies() {
  return hasAccountCookies(getActiveUserId());
}

function setAccount(userId, cookies, nickname = '') {
  const c = getConfig();
  c.accounts = c.accounts || {};
  const prev = c.accounts[userId] || {};
  c.accounts[userId] = {
    cookies: cookies || {},
    nickname: nickname || prev.nickname || '',
    updatedAt: Date.now(),
  };
  saveConfig(c);
}

function setActiveAccount(userId) {
  const c = getConfig();
  c.activeUserId = userId || 'default';
  saveConfig(c);
}

function setSettings(settings) {
  const c = getConfig();
  c.settings = { ...c.settings, ...(settings || {}) };
  saveConfig(c);
}

function setServerUrl(serverUrl) {
  const c = getConfig();
  c.serverUrl = serverUrl;
  saveConfig(c);
}

function listAccounts() {
  const c = getConfig();
  return Object.entries(c.accounts || {}).map(([userId, acct]) => ({
    userId,
    nickname: (acct && acct.nickname) || '',
    hasCookies: !!(acct && acct.cookies && Object.keys(acct.cookies).length > 0),
  }));
}

function accountActive(userId) {
  return getActiveUserId() === userId;
}

module.exports = {
  getConfig,
  saveConfig,
  getActiveUserId,
  getActiveAccount,
  getActiveCookies,
  getAccountCookies,
  hasActiveCookies,
  hasAccountCookies,
  setAccount,
  setActiveAccount,
  setSettings,
  setServerUrl,
  listAccounts,
  accountActive,
};
