// 从 data/kugou-account-backup.json 还原酷狗账户到数据库（挂到指定用户名下）。
// 用法：node scripts/restore-kugou-account.cjs [backup.json] [username=admin]
// 幂等：同 user_id + kg_userid 已存在则跳过。仅打印脱敏信息。
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = process.env.KUGOU_DB_PATH || path.join(__dirname, '..', 'apps', 'launcher', 'data', 'kugou.db');
const backupPath = process.argv[2] || path.join(path.dirname(dbPath), 'kugou-account-backup.json');
const username = process.argv[3] || 'admin';

let data;
try {
  data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
} catch (e) {
  console.error(`cannot read backup: ${e.message}`);
  process.exit(1);
}
const accounts = data.accounts;
if (!Array.isArray(accounts) || accounts.length === 0) {
  console.error('no accounts found in backup');
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA busy_timeout = 5000');

const user = db.prepare('SELECT id FROM users WHERE username=?').get(username);
if (!user) {
  console.error(`user "${username}" not found`);
  process.exit(1);
}

for (const a of accounts) {
  const kgUserid = String(a.kg_userid || '');
  const existing = db
    .prepare('SELECT id FROM kugou_accounts WHERE user_id=? AND kg_userid=?')
    .get(user.id, kgUserid);
  if (existing) {
    console.log(`skip (already exists): id=${existing.id} kg=${kgUserid}`);
    continue;
  }
  const info = db
    .prepare(
      'INSERT INTO kugou_accounts(user_id, kg_userid, nickname, cookies_json, active, created_at, updated_at) VALUES (?,?,?,?,?,?,?)'
    )
    .run(
      user.id,
      kgUserid,
      a.nickname || '',
      a.cookies_json || '{}',
      a.active ? 1 : 0,
      a.created_at || Date.now(),
      a.updated_at || Date.now()
    );
  console.log(`restored: id=${info.lastInsertRowid} kg=${kgUserid} nickname=${a.nickname || ''}`);
}

db.close();
console.log('done');
