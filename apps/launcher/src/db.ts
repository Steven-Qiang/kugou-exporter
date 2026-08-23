import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

// 固定到启动器目录下的 data/kugou.db，避免因为启动时 cwd 不同而产生多个数据库。
// src/ 与 dist/ 的 __dirname 都位于 apps/launcher 下，../data 均指向 apps/launcher/data。
const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB = path.join(here, '..', 'data', 'kugou.db');
const dbPath = process.env.KUGOU_DB_PATH || DEFAULT_DB;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS kugou_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    kg_userid TEXT DEFAULT '',
    nickname TEXT DEFAULT '',
    cookies_json TEXT DEFAULT '{}',
    active INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id INTEGER PRIMARY KEY,
    quality TEXT DEFAULT 'high',
    server_url TEXT DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS export_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    kugou_account_id INTEGER,
    playlist_name TEXT DEFAULT '',
    format TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (kugou_account_id) REFERENCES kugou_accounts(id) ON DELETE CASCADE
  );
`);

// 迁移：给「已存在的旧表」补齐后加的列。CREATE TABLE IF NOT EXISTS 不会修改已有表，
// 因此用 PRAGMA table_info 检测缺列并 ALTER TABLE 补齐，兼容旧数据库、旧账号。
function ensureColumn(table: string, column: string, ddl: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as unknown as Array<{ name: string }>;
if (tables.some((t) => t.name === 'kugou_accounts')) {
  ensureColumn('kugou_accounts', 'kg_userid', 'TEXT DEFAULT \'\'');
}
if (tables.some((t) => t.name === 'settings')) {
  ensureColumn('settings', 'server_url', 'TEXT DEFAULT \'\'');
}
if (tables.some((t) => t.name === 'export_history')) {
  ensureColumn('export_history', 'playlist_name', 'TEXT DEFAULT \'\'');
  ensureColumn('export_history', 'quality', 'TEXT DEFAULT \'\'');
}

export function hasUsers(): boolean {
  const row = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  return row.c > 0;
}
