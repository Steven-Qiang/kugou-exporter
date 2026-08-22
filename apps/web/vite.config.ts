import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  json: {
    stringify: true,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true,
    // 忽略编辑器原子写入产生的临时文件/临时目录，避免 chokidar 因 EBUSY 崩溃。
    // 这样修改源码时热重载正常，不会反复重启 dev。
    watch: {
      ignored: ['**/.*.tmpdir/**', '**/*.tmp', '**/*.tmpdir/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
