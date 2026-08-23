<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
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

      <h1 class="login-title">
        酷狗歌单导出
      </h1>
      <p class="login-sub">
        KUGOU EXPORTER
      </p>

      <form class="login-form" @submit.prevent="submit">
        <label class="field-label" for="login-username">用户名</label>
        <el-input id="login-username" v-model="form.username" placeholder="请输入用户名" size="large" :prefix-icon="User" />

        <label class="field-label" for="login-password">密码</label>
        <el-input
          id="login-password"
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入密码"
          size="large"
          :prefix-icon="Lock"
          @keyup.enter="submit"
        />

        <el-button class="login-btn grad-btn" type="primary" size="large" native-type="submit" :loading="loading">
          登录
        </el-button>
      </form>

      <button class="demo-link" type="button" @click="enterDemo">
        {{ demoEnabled ? '退出演示模式' : '无需登录，进入演示模式' }}
      </button>

      <div class="login-foot">
        <a href="https://github.com/Steven-Qiang/kugou-exporter" target="_blank" rel="noopener">GitHub</a>
        <span>© Steven-Qiang</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api';
import { useAuth } from '@/stores/auth';
import { disableDemo, enableDemo, isDemo } from '@/utils/mock';

const router = useRouter();
const { login } = useAuth();
const demoEnabled = ref(isDemo());

const loading = ref(false);
const form = reactive({ username: '', password: '' });

function enterDemo() {
  if (demoEnabled.value) {
    disableDemo();
    demoEnabled.value = false;
    ElMessage.success('已退出演示模式');
    router.replace('/login');
    return;
  }
  enableDemo();
  demoEnabled.value = true;
  ElMessage.success('已进入演示模式');
  router.push('/playlist');
}

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  loading.value = true;
  try {
    await login(form.username, form.password);
    disableDemo();
    demoEnabled.value = false;
    ElMessage.success('登录成功');
    router.replace('/accounts');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '登录失败');
    loading.value = false;
  }
}

authApi.setupStatus().then((st) => {
  if (st.needsSetup) router.replace('/setup');
});
</script>

<style scoped>
  .login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 40px 36px 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-logo {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-title {
  margin: 18px 0 2px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-1);
}

.login-sub {
  margin: 0;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--text-3);
}

.login-form {
  width: 100%;
  margin-top: 26px;
}

.field-label {
  display: block;
  margin: 14px 0 6px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
}

.login-btn {
  width: 100%;
  margin-top: 24px;
  height: 42px;
  font-weight: 600;
}

.demo-link {
  margin-top: 18px;
  border: none;
  background: transparent;
  color: var(--text-3);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s ease;
}

.demo-link:hover {
  color: var(--accent);
}

.login-foot {
  width: 100%;
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-3);
}

.login-foot a {
  color: var(--text-2);
  text-decoration: none;
  transition: color 0.15s ease;
}

.login-foot a:hover {
  color: var(--accent);
}
</style>
