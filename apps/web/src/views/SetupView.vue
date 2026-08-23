<template>
  <div class="setup-page">
    <div class="setup-shell">
      <!-- 左侧品牌面板 -->
      <aside class="brand-panel">
        <div class="brand-head">
          <div class="brand-logo">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="#fff"
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
            <h1>
              酷狗歌单导出
            </h1>
            <p class="brand-sub">
              KUGOU EXPORTER
            </p>
          </div>
        </div>

        <p class="brand-desc">
          登录你的酷狗账号，把喜欢的歌单一键带到小爱音箱等播放器。
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
          <a href="https://github.com/Steven-Qiang/kugou-exporter" target="_blank" rel="noopener">
            <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor">
              <path
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
              />
            </svg>
            <span>GitHub</span>
          </a>
          <span class="copyright">© Steven-Qiang</span>
        </div>
      </aside>

      <!-- 右侧表单面板 -->
      <main class="form-panel">
        <!-- 步骤指示器 -->
        <div class="steps">
          <template v-for="(s, i) in steps" :key="i">
            <div class="step" :class="{ active: step === i, done: step > i }" @click="step = i">
              <span class="step-dot">
                <svg
                  v-if="step > i"
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="#fff"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span class="step-label">{{ s }}</span>
            </div>
            <span v-if="i < steps.length - 1" class="step-line" :class="{ filled: step > i }" />
          </template>
        </div>

        <!-- 步骤内容 -->
        <div :key="step" class="step-body">
          <!-- 欢迎 -->
          <div v-if="step === 0" class="panel panel-welcome">
            <div class="logo">
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="#fff"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h1 class="welcome-title">
              欢迎使用
            </h1>
            <p class="typewriter">
              {{ typedText }}
            </p>
            <p class="welcome-desc">
              连接你的酷狗账号，把喜欢的歌单一键带到小爱音箱等播放器。
            </p>
            <el-button class="grad-btn big-btn" type="primary" size="large" @click="step = 1">
              开始使用
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </el-button>
            <button class="skip-link" type="button" @click="step = 2">
              跳过引导，直接创建账号 ›
            </button>
          </div>

          <!-- 亮点 -->
          <div v-else-if="step === 1" class="panel panel-features">
            <h2 class="panel-title">
              它会为你做什么
            </h2>
            <p class="panel-sub">
              一次连接，随时随地畅听你的歌单
            </p>
            <div class="feat-grid">
              <div v-for="f in features" :key="f.title" class="feat-card">
                <span class="feat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path :d="f.svg" />
                  </svg>
                </span>
                <div class="feat-text">
                  <strong>{{ f.title }}</strong>
                  <span>{{ f.desc }}</span>
                </div>
              </div>
            </div>
            <el-button class="grad-btn big-btn" type="primary" size="large" style="width: 100%" @click="step = 2">
              下一步
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </el-button>
            <button class="skip-link" type="button" @click="step = 2">
              跳过引导，直接创建账号 ›
            </button>
          </div>

          <!-- 创建账号 -->
          <div v-else class="panel panel-form">
            <div class="form-top">
              <div class="mini-logo grad-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="#fff"
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
                <h2 class="panel-title">
                  创建你的账号
                </h2>
                <p class="panel-sub">
                  用管理员账号登录，管理你的酷狗账号
                </p>
              </div>
            </div>

            <el-form label-position="top" @submit.prevent="submit">
              <label class="field-label">用户名</label>
              <el-input v-model="form.username" placeholder="设置用户名" size="large" :prefix-icon="User" />
              <label class="field-label">密码</label>
              <el-input
                v-model="form.password"
                type="password"
                show-password
                placeholder="至少 6 位"
                size="large"
                :prefix-icon="Lock"
                @keyup.enter="submit"
              />
              <el-button
                class="grad-btn big-btn submit-btn"
                type="primary"
                size="large"
                :loading="loading"
                @click="submit"
              >
                {{ loading ? '创建中...' : '创建并进入' }}
              </el-button>
            </el-form>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';

const { setup } = useAuth();
const router = useRouter();
const step = ref(0);
const loading = ref(false);
const form = reactive({ username: '', password: '' });

const steps = ['欢迎', '亮点', '创建账号'];

const features = [
  {
    icon: '🎵',
    title: '多格式导出',
    desc: 'XiaoMusic / JSON / CSV 一键生成',
    svg: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  },
  {
    icon: '🔗',
    title: '永久代理链接',
    desc: '实时获取最新播放地址，拒绝过期',
    svg: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  },
  {
    icon: '☁️',
    title: '多端部署',
    desc: '支持内网、外网与 Docker',
    svg: 'M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14',
  },
];

// 打字机 slogan
const slogan = '一键导出，小爱音箱随时播';
const typedText = ref('');
let typeTimer: ReturnType<typeof setInterval> | null = null;
let typerIndex = 0;
function startTyping() {
  if (step.value !== 0) return;
  typedText.value = '';
  typerIndex = 0;
  typeTimer = setInterval(() => {
    typerIndex++;
    typedText.value = slogan.slice(0, typerIndex);
    if (typerIndex >= slogan.length) {
      if (typeTimer) clearInterval(typeTimer);
      typeTimer = null;
    }
  }, 90);
}

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

onMounted(() => {
  startTyping();
});

onUnmounted(() => {
  if (typeTimer) clearInterval(typeTimer);
});
</script>

<style scoped>
  .setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.setup-shell {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  width: 100%;
  max-width: 920px;
  min-height: 520px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-1);
  border: 1px solid var(--border);
  background: var(--surface);
}

/* 品牌面板 */
.brand-panel {
  padding: 44px 40px;
  background: var(--surface-solid);
  border-right: 1px solid var(--border);
  color: var(--text-1);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.brand-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-head h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-1);
}

.brand-sub {
  margin: 2px 0 0;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--text-3);
}

.brand-desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-2);
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.feature-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
}

.feature-list strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
}

.feature-list li div span:last-child {
  display: block;
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.5;
}

.brand-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-3);
}

.brand-footer a {
  color: var(--text-2);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s ease;
}

.brand-footer a:hover {
  color: var(--accent);
}

.copyright {
  color: var(--text-3);
}

/* 表单面板 */
.form-panel {
  padding: 40px 42px;
  display: flex;
  flex-direction: column;
}

.steps {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 28px;
}

.step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-3);
  transition: color 0.15s ease;
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border-strong);
  color: var(--text-3);
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.step.active .step-dot,
.step.done .step-dot {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.step-label {
  font-size: 13px;
  font-weight: 500;
}

.step.active .step-label {
  color: var(--text-1);
}

.step-line {
  width: 28px;
  height: 2px;
  border-radius: 2px;
  background: var(--border);
  transition: background-color 0.15s ease;
}

.step-line.filled {
  background: var(--accent);
}

.step-body {
  flex: 1;
  display: flex;
}

.panel {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* 欢迎 */
.panel-welcome {
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
}

.logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: var(--text-1);
}

.typewriter {
  min-height: 24px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.welcome-desc {
  margin: 0;
  max-width: 300px;
  font-size: 13px;
  color: var(--text-3);
  line-height: 1.7;
}

.big-btn {
  width: 100%;
  height: 44px;
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
}

.big-btn :deep(span) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.skip-link {
  margin-top: 12px;
  border: none;
  background: transparent;
  color: var(--text-3);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s ease;
}

.skip-link:hover {
  color: var(--accent);
}

/* 亮点 */
.panel-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text-1);
}

.panel-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-3);
}

.panel-features {
  justify-content: center;
  gap: 18px;
}

.feat-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  transition: border-color 0.15s ease;
}

.feat-card:hover {
  border-color: var(--accent);
}

.feat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent);
  flex-shrink: 0;
}

.feat-text strong {
  display: block;
  color: var(--text-1);
  font-size: 14px;
}

.feat-text span {
  display: block;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}

/* 创建账号 */
.panel-form {
  gap: 18px;
}

.form-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.field-label {
  display: block;
  margin: 12px 0 6px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
}

.submit-btn {
  margin-top: 18px;
}

@media (max-width: 860px) {
  .setup-shell {
    grid-template-columns: 1fr;
    max-width: 460px;
    min-height: auto;
  }

  .brand-panel {
    padding: 28px 24px;
  }

  .feature-list {
    display: none;
  }

  .brand-footer {
    margin-top: 10px;
  }

  .form-panel {
    padding: 28px 24px;
  }
}
</style>
