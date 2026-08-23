import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// 让 db.ts 指向一个一次性临时数据库，隔离测试与环境（真实库不被触碰）。
const dir = mkdtempSync(join(tmpdir(), 'kugou-test-'));
process.env.KUGOU_DB_PATH = join(dir, 'kugou.db');

process.on('exit', () => {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});
