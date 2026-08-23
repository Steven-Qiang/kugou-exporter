// 重置某用户密码（与 launcher 相同的 scrypt 算法）。
// 用法：node scripts/admin-reset-password.cjs <username> <password>
const crypto = require('node:crypto');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const username = process.argv[2];
const password = process.argv[3];
if (!username || !password) {
  console.error('usage: node scripts/admin-reset-password.cjs <username> <password>');
  process.exit(1);
}

const dbPath = process.env.KUGOU_DB_PATH || path.join(__dirname, '..', 'apps', 'launcher', 'data', 'kugou.db');
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA busy_timeout = 5000');
const info = db.prepare('UPDATE users SET password_hash=?, salt=? WHERE username=?').run(hash, salt, username);
db.close();

if (info.changes === 0) {
  console.error(`user "${username}" not found`);
  process.exit(1);
}
console.log(`password reset OK for user "${username}"`);
