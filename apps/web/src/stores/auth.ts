import type { SessionUser } from '@/api';
import { ref } from 'vue';
import { authApi } from '@/api';

const user = ref<SessionUser | null>(null);
const needsSetup = ref(false);

export function useAuth() {
  async function loadSetupStatus(): Promise<boolean> {
    try {
      const st = await authApi.setupStatus();
      needsSetup.value = st.needsSetup;
      return st.needsSetup;
    } catch {
      return false;
    }
  }

  async function fetchMe(): Promise<boolean> {
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
    return res.user;
  }

  async function setup(username: string, password: string): Promise<SessionUser> {
    const res = await authApi.setup(username, password);
    user.value = res.user;
    needsSetup.value = false;
    return res.user;
  }

  async function logout(): Promise<void> {
    await authApi.logout();
    user.value = null;
  }

  return { user, needsSetup, loadSetupStatus, fetchMe, login, setup, logout };
}
