<template>
  <div class="login-page">
    <div class="login-shell">
      <!-- Brand panel -->
      <aside class="brand-panel">
        <div class="brand-head">
          <div class="brand-logo grad-icon">
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
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
          <div>
            <h1 class="grad-text">
              酷狗歌单导出
            </h1>
            <p class="brand-sub">
              KUGOU EXPORTER
            </p>
          </div>
        </div>

        <p class="brand-desc">
          轻松同步到小爱音箱等播放器，随时畅听。
        </p>

        <ul class="feature-list">
          <li v-for="f in features" :key="f.title">
            <span class="feature-icon">{{ f.icon }}</span>
            <div>
              <strong>{{ f.title }}</strong>
              <span>{{ f.desc }}</span>
            </div>
          </li>
        </ul>

        <div class="brand-footer">
          <a href="https://github.com/Steven-Qiang/kugou-exporter" target="_blank">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
              />
            </svg>
            <span>GitHub</span>
          </a>
          <span class="copyright">© Steven-Qiang</span>
        </div>
      </aside>

      <!-- Form panel -->
      <main class="form-panel">
        <div class="form-card">
          <div class="form-head">
            <h2>登录账号</h2>
            <p>使用你的账号登录</p>
          </div>

          <label class="field-label">用户名</label>
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" :prefix-icon="User" />

          <label class="field-label">密码</label>
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            @keyup.enter="submit"
          />

          <el-button
            class="grad-btn submit-btn"
            type="primary"
            size="large"
            :loading="loading"
            @click="submit"
          >
            登录
          </el-button>

          <div class="form-footer">
            <button class="demo-link" type="button" @click="enterDemo">
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              {{ demoEnabled ? '退出演示模式' : '无需登录，进入演示模式' }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api';
import { useAuth } from '@/stores/auth';
import { disableDemo, enableDemo, isDemo } from '@/utils/mock';

const router = useRouter();
const { login } = useAuth();
const demoEnabled = ref(isDemo());

const features = [
  { icon: '🎵', title: '多格式导出', desc: 'XiaoMusic / JSON / CSV 一键生成' },
  { icon: '🔗', title: '永久代理链接', desc: '实时获取最新播放地址，拒绝过期' },
  { icon: '☁️', title: '多端部署', desc: '支持内网、外网与 Docker' },
];

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
  padding: 40px 20px;
}

.login-shell {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  width: 100%;
  max-width: 960px;
  min-height: 560px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-2);
  border: 1px solid var(--border);
  background: var(--surface);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

.brand-panel {
  position: relative;
  padding: 48px 44px;
  background: linear-gradient(160deg, #1c1d20 0%, #2a241f 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 22px;
  overflow: hidden;
}

.brand-panel::after {
  content: '';
  position: absolute;
  right: -80px;
  top: -80px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  filter: blur(20px);
}

.brand-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 16px;
}

.brand-head h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: none;
  -webkit-text-fill-color: currentColor;
  color: #fff;
}

.brand-sub {
  margin: 2px 0 0;
  font-size: 11px;
  letter-spacing: 2px;
  opacity: 0.85;
}

.brand-desc {
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.94;
  position: relative;
  z-index: 1;
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.feature-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.feature-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.feature-list strong {
  display: block;
  font-size: 14px;
  font-weight: 600;
}

.feature-list li span:last-child {
  font-size: 12px;
  opacity: 0.86;
  line-height: 1.5;
}

.brand-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
  position: relative;
  z-index: 1;
}

.brand-footer a {
  color: #fff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.copyright {
  opacity: 0.85;
}

.form-panel {
  padding: 48px 44px;
  display: flex;
  align-items: center;
}

.form-card {
  width: 100%;
  background: transparent;
  border: none;
  box-shadow: none;
}

.form-head h2 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
}

.form-head p {
  margin: 0 0 24px;
  color: var(--text-2);
  font-size: 14px;
}

.field-label {
  display: block;
  margin: 16px 0 8px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
}

.submit-btn {
  width: 100%;
  margin-top: 26px;
  height: 44px;
}

.form-footer {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: center;
}

.demo-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.demo-link:hover {
  opacity: 0.8;
}

@media (max-width: 860px) {
  .login-shell {
    grid-template-columns: 1fr;
    max-width: 460px;
    min-height: auto;
  }

  .brand-panel {
    padding: 32px 28px;
  }

  .feature-list {
    display: none;
  }

  .brand-footer {
    margin-top: 12px;
  }

  .form-panel {
    padding: 32px 28px;
  }
}
</style>
