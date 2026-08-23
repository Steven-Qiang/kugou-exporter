import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import getPort from 'get-port';
import kugoumusicapi from 'kugoumusicapi';
import pkg from '../../../package.json';
import { attachAuthRoutes } from './routes/auth';
import { attachConfigRoutes } from './routes/config';
import { attachExportRoutes } from './routes/export';
import { attachHistoryRoutes } from './routes/history';
import { attachKugouRoutes } from './routes/kugou';
import { attachProxyRoutes } from './routes/proxy';
import { cleanupExpiredSessions } from './store/sessions';

function showBanner(): void {
  console.log(
    chalk.cyan(
      '  _                                                                             _                 \n | | __  _   _    __ _    ___    _   _      ___  __  __  _ __     ___    _ __  | |_    ___   _ __ \n | |/ / | | | |  / _` |  / _ \\  | | | |    / _ \\ \\ \\/ / | \'_ \\   / _ \\  | \'__| | __|  / _ \\ | \'__|\n |   <  | |_| | | (_| | | (_) | | |_| |   |  __/  >  <  | |_) | | (_) | | |    | |_  |  __/ | |   \n |_|\\_\\  \\__,_|  \\__, |  \\___/   \\__,_|    \\___| /_/\\_\\ | .__/   \\___/  |_|     \\__|  \\___| |_|   \n                 |___/                                  |_|                                       '
    )
  );
  console.log(chalk.gray('━'.repeat(60)));
  console.log(chalk.yellow(`  🎵 酷狗歌单一键导出 v${pkg.version}`));
  console.log(chalk.gray('  一键导出酷狗歌单，兼容XiaoMusic，内置代理服务，链接永久有效'));
  console.log();
  console.log(chalk.gray('  👤 作者: ') + chalk.white('Steven-Qiang'));
  console.log(chalk.gray('  🔗 仓库: ') + chalk.blue('github.com/Steven-Qiang/kugou-exporter'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();
}

async function start(): Promise<void> {
  showBanner();

  try {
    const port = await getPort({ port: 3000 });
    console.log('🚀 启动服务中...');
    const serverUrl = `http://127.0.0.1:${port}`;

    const app = await kugoumusicapi.consturctServer();

    attachAuthRoutes(app);
    attachKugouRoutes(app);
    attachConfigRoutes(app, () => serverUrl);
    attachProxyRoutes(app);
    attachHistoryRoutes(app);
    attachExportRoutes(app);

    // 生产环境下挂载前端静态资源（若已构建）
    const webDist = path.join(__dirname, '../../web/dist');
    if (fs.existsSync(webDist)) {
      kugoumusicapi.setupStatic(app, webDist);
    }

    app.listen(port, () => {
      console.log(chalk.green(`✅ 服务已启动: http://127.0.0.1:${port}`));
      console.log(chalk.gray('\n按 Ctrl+C 停止服务\n'));
    });

    // 定期清理过期会话（启动时先清一次，之后每小时一次）
    cleanupExpiredSessions();
    setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

start();
