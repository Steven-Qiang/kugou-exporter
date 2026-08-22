const path = require('path');
const getPort = require('get-port').default;
const chalk = require('chalk').default;
const kugoumusicapi = require('kugoumusicapi');
const { version } = require('../../package.json');
const {
  getConfig,
  saveConfig,
  setServerUrl,
  setSettings,
  setAccount,
  setActiveAccount,
  getActiveUserId,
  getAccountCookies,
  listAccounts,
  accountActive,
} = require('./config');
const { refreshLogin, registerDev } = require('./util');

process.removeAllListeners('warning');

function showBanner() {
  console.log(
    chalk.cyan(
      '  _                                                                             _                 \n | | __  _   _    __ _    ___    _   _      ___  __  __  _ __     ___    _ __  | |_    ___   _ __ \n | |/ / | | | |  / _` |  / _ \\  | | | |    / _ \\ \\ \\/ / | \'_ \\   / _ \\  | \'__| | __|  / _ \\ | \'__|\n |   <  | |_| | | (_| | | (_) | | |_| |   |  __/  >  <  | |_) | | (_) | | |    | |_  |  __/ | |   \n |_|\\_\\  \\__,_|  \\__, |  \\___/   \\__,_|    \\___| /_/\\_\\ | .__/   \\___/  |_|     \\__|  \\___| |_|   \n                 |___/                                  |_|                                       '
    )
  );
  console.log(chalk.gray('━'.repeat(60)));
  console.log(chalk.yellow(`  🎵 酷狗歌单一键导出 v${version}`));
  console.log(chalk.gray('  一键导出酷狗歌单，兼容XiaoMusic，内置代理服务，实时获取最新播放链接'));
  console.log();
  console.log(chalk.gray('  👤 作者: ') + chalk.white('Steven-Qiang'));
  console.log(chalk.gray('  🔗 仓库: ') + chalk.blue('github.com/Steven-Qiang/kugou-exporter'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();
}

/** Serialize a cookies object into a Set-Cookie header string list. */
function toSetCookieHeaders(cookies) {
  return Object.entries(cookies || {}).map(([k, v]) => `${k}=${v}; PATH=/`);
}

/** Inject the target account's cookies into the browser via Set-Cookie. */
function pushCookiesToBrowser(res, userId) {
  const cookies = getAccountCookies(userId);
  if (cookies && Object.keys(cookies).length > 0) {
    for (const header of toSetCookieHeaders(cookies)) res.append('Set-Cookie', header);
  }
}

async function start() {
  showBanner();

  try {
    const port = await getPort({ port: 3000 });
    console.log('🚀 启动服务中...');

    const config = getConfig();
    if (!config.serverUrl) {
      config.serverUrl = `http://127.0.0.1:${port}`;
      saveConfig(config);
    }

    const app = await kugoumusicapi.consturctServer();

    // ---- 配置接口 ----
    // 返回脱敏配置：绝不返回 cookie
    app.get('/config/get', (req, res) => {
      const config = getConfig();
      const serverUrl = config.serverUrl || `http://127.0.0.1:${port}`;
      res.json({
        serverUrl,
        settings: config.settings || { quality: 'high' },
        activeUserId: getActiveUserId(),
        accounts: listAccounts(),
      });
    });

    app.post('/config/save', (req, res) => {
      const body = req.body || {};
      const userId = body.userid ? `${body.userid}` : getActiveUserId();
      const cookies = req.cookies || {};

      if (body.serverUrl) setServerUrl(body.serverUrl);
      if (body.quality) setSettings({ quality: body.quality });

      // 保存该账号的 cookie（来自浏览器请求头）并设为激活账号
      setAccount(userId, cookies, body.nickname);
      setActiveAccount(userId);

      res.json({ success: true, activeUserId: userId });
    });

    // ---- 账号接口 ----
    app.get('/account/list', (req, res) => {
      res.json({ accounts: listAccounts(), activeUserId: getActiveUserId() });
    });

    app.get('/account/switch', (req, res) => {
      const userId = `${req.query.userid || ''}`;
      if (!userId) return res.status(400).json({ success: false, message: 'userid 不能为空' });
      if (!getAccountCookies(userId) || Object.keys(getAccountCookies(userId)).length === 0) {
        return res.status(404).json({ success: false, message: '该账号尚未保存登录态' });
      }
      setActiveAccount(userId);
      // 让浏览器也持有切换后账号的 cookie
      pushCookiesToBrowser(res, userId);
      res.json({ success: true, activeUserId: userId });
    });

    app.post('/account/switch', (req, res) => {
      const userId = req.body.userid ? `${req.body.userid}` : '';
      if (!userId) return res.status(400).json({ success: false, message: 'userid 不能为空' });
      if (!getAccountCookies(userId) || Object.keys(getAccountCookies(userId)).length === 0) {
        return res.status(404).json({ success: false, message: '该账号尚未保存登录态' });
      }
      setActiveAccount(userId);
      pushCookiesToBrowser(res, userId);
      res.json({ success: true, activeUserId: userId });
    });

    // ---- 代理播放链接（多账号 + 兼容旧版） ----
    app.get('/proxy/song/url', async (req, res) => {
      try {
        const uid = req.query.uid ? `${req.query.uid}` : null; // null -> 当前激活账号（旧版行为）
        await refreshLogin(uid);
        const cookie = await registerDev(uid);
        const hash = `${req.query.hash}`;
        const quality = `${req.query.quality || 'high'}`;
        const urlRes = await kugoumusicapi.song_url({ hash, quality, cookie });

        /** @type {any} */
        const urls = urlRes.body?.url || [];
        if (urls.length > 0) {
          res.redirect(301, urls[0]);
        } else {
          res.status(404).send('No URL found');
        }
      } catch (error) {
        console.error(error);
      }
    });

    // @ts-ignore
    if (process.__nexe) {
      kugoumusicapi.setupStatic(app, path.join(__dirname, '../../web/dist'));
    }

    // @ts-ignore
    app.service = app.listen(port, () => {
      console.log(chalk.green(`✅ 服务已启动: http://127.0.0.1:${port}`));
      console.log(chalk.gray('\n按 Ctrl+C 停止服务\n'));
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

start();
