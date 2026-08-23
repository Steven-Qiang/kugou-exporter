<template>
  <div class="app-shell">
    <!-- 移动端遮罩 -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

    <!-- 侧边导航栏 -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="brand">
        <div class="brand-icon grad-icon">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div v-if="expanded" class="brand-text">
          <strong>酷狗歌单导出</strong>
          <span>KUGOU EXPORTER</span>
        </div>
      </div>

      <nav class="nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
          :title="expanded ? '' : item.label"
          @click="sidebarOpen = false"
        >
          <el-icon class="nav-ico">
            <component :is="item.icon" />
          </el-icon>
          <span v-if="expanded" class="nav-label">{{ item.label }}</span>
        </router-link>

        <span v-if="inDemo" class="demo-badge" title="退出演示模式" @click="exitDemo">
          {{ expanded ? '演示模式 · 退出' : '演示' }}
        </span>
      </nav>

      <div class="sidebar-bottom">
        <div class="side-row">
          <theme-toggle />
          <span v-if="expanded" class="side-row-label">主题</span>
        </div>
        <el-dropdown trigger="click" @command="onCommand">
          <div class="user-chip" :title="expanded ? '' : appUser?.username">
            <el-avatar :size="30" class="user-avatar">
              {{ (appUser?.username || 'U').charAt(0).toUpperCase() }}
            </el-avatar>
            <template v-if="expanded">
              <span class="user-name">{{ appUser?.username }}</span>
              <el-icon class="user-arrow">
                <arrow-down />
              </el-icon>
            </template>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="appUser?.is_admin" command="users">
                <span class="menu-item">用户管理</span>
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <span class="menu-item">设置</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <span class="menu-item menu-logout">退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="sidebar-footer">
        <a class="github-link" :href="GITHUB_URL" target="_blank" rel="noopener" title="GitHub 开源仓库 · 欢迎 Star">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
          <span v-if="expanded">GitHub 开源</span>
        </a>
        <span v-if="expanded" class="sidebar-meta">v{{ pkg.version }} · © Steven-Qiang</span>
      </div>
    </aside>

    <!-- 移动端汉堡 -->
    <button class="menu-btn" title="打开菜单" @click="sidebarOpen = !sidebarOpen">
      <el-icon><menu-icon /></el-icon>
    </button>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, Headset, Menu as MenuIcon, Setting, User } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { useAuth } from '@/stores/auth';
import { disableDemo, isDemo } from '@/utils/mock';
import pkg from '../../../../package.json';

const GITHUB_URL = 'https://github.com/Steven-Qiang/kugou-exporter';

const route = useRoute();
const router = useRouter();
const { user: appUser, logout } = useAuth();
const inDemo = ref(isDemo());

const sidebarOpen = ref(false);
const isNarrow = ref(false);
// 窄屏（平板宽度）收成图标栏，隐藏文字；桌面/移动抽屉都显示文字
const expanded = computed(() => !isNarrow.value);

const navItems = [
  { to: '/accounts', label: '账号管理', icon: User },
  { to: '/playlist', label: '歌单', icon: Headset },
  { to: '/settings', label: '设置', icon: Setting },
];

function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`);
}

function updateBreakpoints() {
  const w = window.innerWidth;
  isNarrow.value = w > 760 && w <= 980;
}

function onCommand(command: string) {
  if (command === 'logout') {
    // 先跳转再异步清会话，避免等待网络导致退出卡顿
    router.push('/login');
    logout();
  } else if (command === 'settings' || command === 'users') {
    router.push('/settings');
  }
}

function exitDemo() {
  disableDemo();
  inDemo.value = false;
  // 立即清掉演示用户，避免守卫因 user 存在而短路，仍显示“演示用户/演示模式”
  logout();
  // 演示模式退出后回到应用登录页；守卫会在不在演示态下重查登录态
  router.push('/login');
}

onMounted(() => {
  updateBreakpoints();
  window.addEventListener('resize', updateBreakpoints);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateBreakpoints);
});
</script>

<style scoped>
  .app-shell {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* 侧栏 */
.sidebar {
  width: 200px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 12px;
  background: var(--surface-solid);
  border-right: 1px solid var(--border);
  box-shadow: 1px 0 0 rgba(17, 24, 39, 0.02);
  z-index: 30;
  transition:
    width 0.22s ease,
    transform 0.22s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 6px 14px;
  border-bottom: 1px solid var(--border);
}

.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}

.brand-text strong {
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
}

.brand-text span {
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--text-3);
  white-space: nowrap;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 12px;
  color: var(--text-2);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--accent);
  background: var(--surface-hover);
}

.nav-item.active {
  color: #fff;
  background: var(--accent-grad);
  box-shadow: 0 8px 20px -8px var(--accent-soft);
}

.nav-ico {
  font-size: 18px;
  flex-shrink: 0;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.demo-badge {
  margin-top: 6px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.demo-badge:hover {
  background: var(--accent);
  color: #fff;
}

.sidebar-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 4px 4px;
  border-top: 1px solid var(--border);
}

.side-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border-radius: 12px;
  color: var(--text-2);
  font-size: 13px;
}

.side-row-label {
  flex: 1;
  font-weight: 600;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.18s ease;
}

.user-chip:hover {
  background: var(--surface-hover);
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 8px 2px;
  border-top: 1px solid var(--border);
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.18s ease;
  white-space: nowrap;
}

.github-link:hover {
  color: var(--accent);
}

.sidebar-meta {
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
}

.user-avatar {
  background: var(--accent-grad);
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
}

.user-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  color: var(--text-3);
  font-size: 13px;
}

.menu-item {
  min-width: 90px;
}

.menu-logout {
  color: #f56c6c;
}

/* 平板：收成图标栏 */
@media (max-width: 980px) {
  .sidebar {
    width: 64px;
    padding: 14px 8px;
  }
}

/* 移动端：抽屉式侧栏 */
@media (max-width: 760px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 200px;
    transform: translateX(-100%);
    box-shadow: var(--shadow-2);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 20;
  }
}

/* 内容区 */
.content {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.menu-btn {
  display: none;
  position: fixed;
  left: 12px;
  top: 12px;
  z-index: 40;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-1);
  cursor: pointer;
  box-shadow: var(--shadow-1);
}

@media (max-width: 760px) {
  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
