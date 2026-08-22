import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuth } from '@/stores/auth';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/setup', name: 'Setup', component: () => import('@/views/SetupView.vue') },
    { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue') },
    {
      path: '/',
      component: () => import('@/layouts/AppShell.vue'),
      children: [
        { path: '', redirect: '/accounts' },
        { path: 'accounts', name: 'Accounts', component: () => import('@/views/AccountsView.vue') },
        { path: 'playlist', name: 'Playlist', component: () => import('@/views/PlaylistView.vue') },
      ],
    },
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

  if (to.name === 'Login' && user.value) return { name: 'Accounts' };

  if (!user.value) {
    const ok = await fetchMe();
    if (!ok && to.name !== 'Login') return { name: 'Login' };
  }
  return true;
});

export default router;
