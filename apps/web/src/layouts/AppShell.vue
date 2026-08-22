<template>
  <div class="shell">
    <aside class="side">
      <div class="brand-row">
        <div class="brand-mark grad-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div class="brand-text">
          <strong>酷狗歌单 · 一键导出</strong>
          <span>KUGOU EXPORTER</span>
        </div>
      </div>

      <nav class="nav">
        <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item" active-class="active">
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="side-foot">
        <div class="user-meta">
          <span class="user-dot" />
          <span class="user-name">{{ user?.username }}</span>
        </div>
        <el-button size="small" text @click="onLogout">
          退出登录
        </el-button>
      </div>
    </aside>

    <main class="main-area">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';

const { user, logout } = useAuth();
const router = useRouter();

const navItems = [
  { to: '/accounts', label: '酷狗账号', icon: '▦' },
  { to: '/playlist', label: '歌单中心', icon: '♪' },
];

async function onLogout() {
  await logout();
  router.push('/login');
}
</script>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  background: var(--bg-base);
}

.side {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  gap: 24px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  backdrop-filter: blur(var(--glass-blur));
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-text strong {
  font-size: 14px;
  color: var(--text-1);
}

.brand-text span {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--text-3);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--text-2);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.16s ease;
}

.nav-item:hover {
  color: var(--text-1);
  background: var(--surface-hover);
}

.nav-item.active {
  color: var(--accent);
  background: var(--accent-soft);
}

.nav-icon {
  width: 18px;
  text-align: center;
}

.side-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 8px;
  border-top: 1px solid var(--border);
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.user-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
