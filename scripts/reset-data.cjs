// 清空全部业务数据（users / sessions / kugou_accounts / settings / export_history），
// 回到首次安装状态（/setup 引导页）。酷狗账号请先跑 backup-kugou-account.cjs 备份。
// 用法：node scripts/reset-data.cjs
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = process.env.KUGOU_DB_PATH || path.join(__dirname, '..', 'apps', 'launcher', 'data', 'kugou.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA busy_timeout = 5000');

for (const table of ['export_history', 'settings', 'kugou_accounts', 'sessions', 'users']) {
  const info = db.prepare(`DELETE FROM ${table}`).run();
  console.log(`cleared ${table}: ${info.changes} row(s)`);
}

db.close();
console.log('done, app is back to first-run state');
