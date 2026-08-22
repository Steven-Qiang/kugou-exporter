import type { UserInfo } from '@/types';
import { createRouter, createWebHashHistory } from 'vue-router';
import request from '@/utils/request';

let cachedUserInfo: UserInfo | null = null;

export function getCachedUserInfo() {
  return cachedUserInfo;
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/playlist',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/playlist',
      name: 'Playlist',
      component: () => import('@/views/PlaylistView.vue'),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  if (to.path !== '/login') {
    try {
      const res = await request.get<UserInfo>('/user/detail');
      cachedUserInfo = res.data;
      // 把当前账号的登录态存到服务端（多账号：按 userid 归档，设为激活账号）
      request.post('/config/save', { userid: res.data.userid }).catch(() => {});
      next();
    } catch {
      cachedUserInfo = null;
      next('/login');
    }
  } else {
    next();
  }
});

export default router;
