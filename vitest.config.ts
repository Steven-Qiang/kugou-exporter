import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['apps/launcher/test/**/*.test.ts'],
    setupFiles: ['apps/launcher/test/setup.ts'],
    globals: true,
    pool: 'forks',
    // 后端是单实例 SQLite，每个测试文件独立进程，避免用例互相污染
    fileParallelism: false,
    testTimeout: 15000,
  },
});
