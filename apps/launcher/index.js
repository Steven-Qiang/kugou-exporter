const path = require('path');
const getPort = require('get-port').default;
const chalk = require('chalk').default;
const kugoumusicapi = require('kugoumusicapi');
const { version } = require('../../package.json');
const { getConfig, saveConfig } = require('./config');
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

    // 配置接口
    app.get('/config/get', (req, res) => {
      const config = getConfig();
      if (!config.serverUrl) {
        config.serverUrl = `http://127.0.0.1:${port}`;
      }
      res.json(config);
    });

    app.post('/config/save', (req, res) => {
      if (!req.body.serverUrl) {
        return res.status(400).json({ success: false, message: 'serverUrl 不能为空' });
      }
      saveConfig({
        serverUrl: req.body.serverUrl,
        cookies: req.cookies,
      });
      res.json({ success: true });
    });

    app.get('/proxy/song/url', async (req, res) => {
      try {
        await refreshLogin();
        const cookie = await registerDev();
        const hash = `${req.query.hash}`;
        /** @type {any} */
        const quality = `${req.query.quality || 'high'}`;
        const urlRes = await kugoumusicapi.song_url({
          hash,
          quality,
          cookie,
        });

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
