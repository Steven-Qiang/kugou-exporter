<template>
  <div class="login-wrap">
    <div class="bg-orb orba" />
    <div class="bg-orb orbb" />
    <span class="note n1">♪</span>
    <span class="note n2">♫</span>

    <div class="auth-card">
      <div class="brand">
        <div class="logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <h1 class="grad-text">
          酷狗歌单 · 一键导出
        </h1>
        <p class="sub">
          登录你的账号，管理歌单并一键导出
        </p>
      </div>

      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" size="large" placeholder="用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password size="large" placeholder="密码" @keyup.enter="submit" />
        </el-form-item>
        <el-button class="grad-btn grad-btn-lg" type="primary" :loading="loading" style="width: 100%" @click="submit">
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api';
import { useAuth } from '@/stores/auth';

const { login } = useAuth();
const router = useRouter();
const loading = ref(false);
const form = reactive({ username: '', password: '' });

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  loading.value = true;
  try {
    await login(form.username, form.password);
    router.replace('/accounts');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '登录失败');
  } finally {
    loading.value = false;
  }
}

authApi.setupStatus().then((st) => {
  if (st.needsSetup) router.replace('/setup');
});
</script>

<style scoped>
.login-wrap {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-base) 0%, #ece6df 100%);
  overflow: hidden;
  padding: 24px;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.5;
  animation: float 9s ease-in-out infinite;
}

.orba {
  width: 380px;
  height: 380px;
  top: -80px;
  right: -60px;
  background: radial-gradient(circle, rgba(233, 106, 60, 0.4), transparent 60%);
}

.orbb {
  width: 420px;
  height: 420px;
  bottom: -120px;
  left: -80px;
  background: radial-gradient(circle, rgba(245, 145, 63, 0.35), transparent 60%);
  animation-delay: -3s;
}

.note {
  position: absolute;
  color: var(--accent);
  opacity: 0.35;
  animation: floatUp 7s ease-in-out infinite;
}

.n1 {
  top: 24%;
  left: 18%;
  animation-delay: 0s;
}
.n2 {
  top: 58%;
  right: 18%;
  font-size: 26px;
  animation-delay: -3s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(20px, -20px) scale(1.08);
  }
}

@keyframes floatUp {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-18px);
    opacity: 0.55;
  }
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 400px;
  padding: 40px 36px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 22px 60px rgba(40, 38, 35, 0.18);
}

.brand {
  text-align: center;
  margin-bottom: 26px;
}

.logo {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-grad);
  box-shadow: 0 12px 30px -8px rgba(233, 106, 60, 0.55);
  animation: pop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.brand h1 {
  margin: 0 0 6px;
  font-size: 23px;
  font-weight: 800;
}

.brand p {
  margin: 0;
  font-size: 13px;
  color: var(--text-3);
}

.grad-btn-lg {
  height: 44px;
}

@keyframes pop {
  from {
    transform: scale(0.75);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
