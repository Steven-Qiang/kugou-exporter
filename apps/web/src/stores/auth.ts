import type { SessionUser } from '@/api';
import { ref } from 'vue';
import { authApi } from '@/api';

const user = ref<SessionUser | null>(null);
const needsSetup = ref(false);

// 路由守卫缓存：避免每次切换页面都重复请求 /auth/setup/status（较重），减少切换卡顿
// 注意：不缓存“未登录”判定 —— 否则登录后守卫会跳过重查而错误跳回 /login。
let setupStatusCached = false;

export function useAuth() {
  async function loadSetupStatus(): Promise<boolean> {
    if (setupStatusCached) return needsSetup.value;
    try {
      const st = await authApi.setupStatus();
      needsSetup.value = st.needsSetup;
    } catch {
      needsSetup.value = false;
    }
    setupStatusCached = true;
    return needsSetup.value;
  }

  async function fetchMe(): Promise<boolean> {
    if (user.value) return true;
    // 未登录时始终重查（/auth/me 为轻量 401），保证登录/登出后状态正确
    try {
      user.value = await authApi.me();
      needsSetup.value = false;
      return true;
    } catch {
      user.value = null;
      return false;
    }
  }

  async function login(username: string, password: string): Promise<SessionUser> {
    const res = await authApi.login(username, password);
    user.value = res.user;
    needsSetup.value = false;
    setupStatusCached = true;
    return res.user;
  }

  async function setup(username: string, password: string): Promise<SessionUser> {
    const res = await authApi.setup(username, password);
    user.value = res.user;
    needsSetup.value = false;
    setupStatusCached = true;
    return res.user;
  }

  async function logout(): Promise<void> {
    // 先清本地态再异步清会话，UI 立即响应不卡顿
    user.value = null;
    setupStatusCached = true;
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
  }

  return { user, needsSetup, loadSetupStatus, fetchMe, login, setup, logout };
}
