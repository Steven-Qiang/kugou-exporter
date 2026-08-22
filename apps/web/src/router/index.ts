import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuth } from '@/stores/auth';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/setup', name: 'Setup', component: () => import('@/views/SetupView.vue') },
    { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue') },
    { path: '/accounts', name: 'Accounts', component: () => import('@/views/AccountsView.vue') },
    { path: '/playlist', name: 'Playlist', component: () => import('@/views/PlaylistView.vue') },
    { path: '/', redirect: '/accounts' },
  ],
});

router.beforeEach(async (to) => {
  const { loadSetupStatus, fetchMe, user } = useAuth();
  // 首次启动：没有任何用户 -> 引导创建管理员
  const needs = await loadSetupStatus();
  if (needs) {
    return to.name === 'Setup' ? true : { name: 'Setup' };
  }
  // 已初始化，不再显示 setup
  if (to.name === 'Setup') return { name: 'Accounts' };
  // 登录页：已登录则去账号管理
  if (to.name === 'Login' && user.value) return { name: 'Accounts' };
  // 演示模式：放行浏览歌单
  if (!user.value) {
    const ok = await fetchMe();
    if (!ok) {
      // 未登录：仅允许 login / setup
      if (to.name !== 'Login' && to.name !== 'Setup') return { name: 'Login' };
    }
  }
  return true;
});

export default router;
