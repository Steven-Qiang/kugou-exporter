// 备份 kugou_accounts 全表（含 cookies_json，属于敏感数据）到 data/kugou-account-backup.json
// 用法：node scripts/backup-kugou-account.cjs
// 仅打印行数与路径，绝不打印 cookie 明文。
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = process.env.KUGOU_DB_PATH || path.join(__dirname, '..', 'apps', 'launcher', 'data', 'kugou.db');
const db = new DatabaseSync(dbPath, { readOnly: true });
db.exec('PRAGMA busy_timeout = 3000');

const rows = db.prepare('SELECT * FROM kugou_accounts').all();
db.close();

const out = path.join(path.dirname(dbPath), 'kugou-account-backup.json');
fs.writeFileSync(out, JSON.stringify({ exportedAt: new Date().toISOString(), accounts: rows }, null, 2));
console.log(`backup written: ${out} (${rows.length} account(s))`);
