<template>
  <div class="setup-page">
    <div class="setup-card">
      <div class="setup-logo">
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

      <h1 class="setup-title">
        创建管理员账号
      </h1>
      <p class="setup-sub">
        首次使用，设置管理员账号；密码至少 6 位
      </p>

      <form class="setup-form" @submit.prevent="submit">
        <label class="field-label" for="setup-username">用户名</label>
        <el-input id="setup-username" v-model="form.username" placeholder="设置用户名" size="large" :prefix-icon="User" />

        <label class="field-label" for="setup-password">密码</label>
        <el-input
          id="setup-password"
          v-model="form.password"
          type="password"
          show-password
          placeholder="至少 6 位"
          size="large"
          :prefix-icon="Lock"
          @keyup.enter="submit"
        />

        <el-button class="setup-btn grad-btn" type="primary" size="large" native-type="submit" :loading="loading">
          {{ loading ? '创建中...' : '创建并进入' }}
        </el-button>
      </form>

      <p class="setup-tip">
        管理员可创建多个子用户，并为每个用户分别维护酷狗账号与导出设置
      </p>

      <div class="setup-foot">
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
import { useAuth } from '@/stores/auth';

const { setup } = useAuth();
const router = useRouter();
const loading = ref(false);
const form = reactive({ username: '', password: '' });

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  if (form.password.length < 6) {
    ElMessage.warning('密码至少 6 位');
    return;
  }
  loading.value = true;
  try {
    await setup(form.username, form.password);
    ElMessage.success('创建成功');
    router.replace('/accounts');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '创建失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
  .setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.setup-card {
  width: 100%;
  max-width: 380px;
  padding: 40px 36px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.setup-logo {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setup-title {
  margin: 18px 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-1);
}

.setup-sub {
  margin: 0;
  font-size: 13px;
  color: var(--text-3);
}

.setup-form {
  width: 100%;
  margin-top: 24px;
}

.field-label {
  display: block;
  margin: 14px 0 6px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
}

.setup-btn {
  width: 100%;
  margin-top: 24px;
  height: 42px;
  font-weight: 600;
}

.setup-tip {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--text-3);
  text-align: center;
  line-height: 1.7;
}

.setup-foot {
  width: 100%;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-3);
}

.setup-foot a {
  color: var(--text-2);
  text-decoration: none;
  transition: color 0.15s ease;
}

.setup-foot a:hover {
  color: var(--accent);
}
</style>
