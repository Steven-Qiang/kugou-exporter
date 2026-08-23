<template>
  <div class="setup-page">
    <!-- 动态背景 -->
    <div class="bg-scene" aria-hidden="true">
      <div class="glow glow-a" />
      <div class="glow glow-b" />
      <div class="glow glow-c" />
      <div class="grid" />
      <span class="note n1">♪</span>
      <span class="note n2">♫</span>
      <span class="note n3">♩</span>
      <span class="note n4">♬</span>
      <span class="note n5">♪</span>
      <span class="note n6">♫</span>
    </div>

    <div class="setup-shell">
      <!-- 左侧品牌面板 -->
      <aside class="brand-panel">
        <div class="brand-head">
          <div class="brand-logo">
            <svg
              viewBox="0 0 24 24"
              width="34"
              height="34"
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
            <h1 class="grad-text">
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
          <li v-for="(f, i) in features" :key="f.title" :style="{ animationDelay: `${i * 0.14}s` }">
            <span class="feature-icon">{{ f.icon }}</span>
            <div>
              <strong>{{ f.title }}</strong>
              <span>{{ f.desc }}</span>
            </div>
          </li>
        </ul>

        <!-- 均衡器动画 -->
        <div class="eq" aria-hidden="true">
          <span v-for="i in 7" :key="i" :style="{ animationDelay: `${i * 0.14}s` }" />
        </div>

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
                  width="14"
                  height="14"
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
          <div v-if="step === 0" class="panel panel-welcome enter">
            <div class="logo-halo">
              <div class="logo">
                <svg
                  viewBox="0 0 24 24"
                  width="40"
                  height="40"
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
            </div>
            <h1 class="welcome-title">
              欢迎使用
            </h1>
            <p class="typewriter">
              {{ typedText }}
              <span class="caret" />
            </p>
            <p class="welcome-desc">
              连接你的酷狗账号，把喜欢的歌单一键带到小爱音箱等播放器。
            </p>
            <el-button class="grad-btn big-btn" type="primary" size="large" @click="step = 1">
              开始使用
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
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
              <div
                v-for="(f, i) in features"
                :key="f.title"
                class="feat-card enterup"
                :style="{ animationDelay: `${i * 0.1}s` }"
              >
                <span class="feat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
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
                width="18"
                height="18"
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
                  width="20"
                  height="20"
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
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;700;800&display=swap');

.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

/* 动态背景 */
.bg-scene {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: radial-gradient(1200px 800px at 20% 10%, var(--bg-glow-1) 0%, transparent 55%), var(--bg-base);
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
  animation: drift 16s ease-in-out infinite;
}

.glow-a {
  width: 520px;
  height: 520px;
  top: -140px;
  left: -120px;
  background: radial-gradient(circle, rgba(233, 106, 60, 0.35), transparent 62%);
}

.glow-b {
  width: 460px;
  height: 460px;
  bottom: -160px;
  right: -100px;
  background: radial-gradient(circle, rgba(245, 145, 63, 0.32), transparent 62%);
  animation-delay: -5s;
}

.glow-c {
  width: 300px;
  height: 300px;
  top: 40%;
  left: 55%;
  background: radial-gradient(circle, rgba(240, 112, 92, 0.22), transparent 60%);
  animation-delay: -9s;
}

@keyframes drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(36px, -28px) scale(1.1);
  }
}

.grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.5), transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.5), transparent 75%);
}

/* 漂浮音符 */
.note {
  position: absolute;
  font-size: 30px;
  color: var(--accent);
  opacity: 0;
  animation: floatNote 9s ease-in-out infinite;
}

.n1 {
  top: 18%;
  left: 12%;
  animation-delay: 0s;
}
.n2 {
  top: 62%;
  left: 8%;
  font-size: 24px;
  animation-delay: -2s;
}
.n3 {
  top: 26%;
  right: 14%;
  font-size: 26px;
  animation-delay: -4s;
}
.n4 {
  top: 72%;
  right: 10%;
  font-size: 34px;
  animation-delay: -6s;
}
.n5 {
  top: 44%;
  left: 78%;
  animation-delay: -3s;
}
.n6 {
  top: 50%;
  left: 40%;
  font-size: 22px;
  animation-delay: -7s;
}

@keyframes floatNote {
  0%,
  100% {
    transform: translateY(0) rotate(0);
    opacity: 0;
  }
  50% {
    transform: translateY(-26px) rotate(12deg);
    opacity: 0.55;
  }
}

/* Shell */
.setup-shell {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  width: 100%;
  max-width: 980px;
  min-height: 600px;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: var(--shadow-2);
  border: 1px solid var(--border);
  background: var(--surface);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

/* 品牌面板 */
.brand-panel {
  position: relative;
  padding: 48px 44px;
  background: linear-gradient(165deg, #1c1d20 0%, #2a241f 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 22px;
  overflow: hidden;
}

.brand-panel::after {
  content: '';
  position: absolute;
  right: -90px;
  top: -90px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  filter: blur(30px);
}

.brand-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: var(--accent-grad);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 30px -8px rgba(233, 106, 60, 0.6);
  animation: pop 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.brand-head h1 {
  margin: 0;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: none;
  -webkit-text-fill-color: currentColor;
  color: #fff;
}

.brand-sub {
  margin: 3px 0 0;
  font-size: 11px;
  letter-spacing: 2.5px;
  opacity: 0.82;
}

.brand-desc {
  position: relative;
  z-index: 1;
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.94;
}

.feature-list {
  position: relative;
  z-index: 1;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  opacity: 0;
  animation: fadeStagger 0.7s ease forwards;
}

.feature-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.16);
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

/* 均衡器 */
.eq {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 34px;
  margin-top: 4px;
  opacity: 0.75;
}

.eq span {
  width: 5px;
  border-radius: 3px;
  background: var(--accent-grad);
  animation: eqBounce 1.2s ease-in-out infinite;
  height: 20%;
}

@keyframes eqBounce {
  0%,
  100% {
    height: 18%;
  }
  50% {
    height: 100%;
  }
}

.brand-footer {
  position: relative;
  z-index: 1;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 12px;
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
  opacity: 0.82;
}

/* 表单面板 */
.form-panel {
  padding: 44px 46px;
  display: flex;
  flex-direction: column;
}

.steps {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 30px;
}

.step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-3);
  transition: color 0.2s ease;
}

.step-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  border: 1.5px solid var(--border-strong);
  color: var(--text-3);
  transition: all 0.25s ease;
}

.step.active .step-dot {
  color: #fff;
  border-color: transparent;
  background: var(--accent);
  box-shadow: 0 6px 16px -4px var(--accent-soft);
  transform: scale(1.12);
}

.step.done .step-dot {
  color: #fff;
  border-color: transparent;
  background: var(--accent-2);
}

.step-label {
  font-size: 13px;
  font-weight: 600;
}

.step.active .step-label {
  color: var(--text-1);
}

.step-line {
  width: 34px;
  height: 2px;
  border-radius: 2px;
  background: var(--border);
  transition: background 0.25s ease;
}

.step-line.filled {
  background: var(--accent-2);
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

/* 动画 */
.enter {
  animation: panelEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.enterup {
  opacity: 0;
  animation: upIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes panelEnter {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes upIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 欢迎 */
.panel-welcome {
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 18px;
}

.logo-halo {
  position: relative;
  width: 108px;
  height: 108px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-halo::before {
  content: '';
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%);
  animation: pulse 2.6s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(0.85);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.logo {
  width: 100%;
  height: 100%;
  border-radius: 30px;
  background: var(--accent-grad);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18px 44px -10px rgba(233, 106, 60, 0.65);
}

.welcome-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  background: var(--accent-grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.typewriter {
  min-height: 26px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-1);
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  margin-left: 2px;
  background: var(--accent);
  vertical-align: text-bottom;
  animation: blink 1s steps(2) infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.welcome-desc {
  margin: 0;
  max-width: 320px;
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.7;
}

.big-btn {
  width: 100%;
  height: 48px;
  margin-top: 8px;
  font-size: 15px;
}

.big-btn :deep(span) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.skip-link {
  margin-top: 14px;
  border: none;
  background: transparent;
  color: var(--text-3);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.18s ease;
}

.skip-link:hover {
  color: var(--accent);
}

/* 亮点 */
.panel-title {
  margin: 0;
  font-size: 24px;
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
  gap: 22px;
}

.feat-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  transition: all 0.22s ease;
}

.feat-card:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px -10px var(--accent-soft);
}

.feat-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
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
  font-size: 15px;
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
  gap: 14px;
}

.mini-logo {
  width: 46px;
  height: 46px;
  border-radius: 14px;
}

.field-label {
  display: block;
  margin: 12px 0 8px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
}

.submit-btn {
  margin-top: 22px;
}

@media (max-width: 860px) {
  .setup-shell {
    grid-template-columns: 1fr;
    max-width: 470px;
    min-height: auto;
  }

  .brand-panel {
    padding: 32px 28px;
  }

  .feature-list,
  .eq {
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
