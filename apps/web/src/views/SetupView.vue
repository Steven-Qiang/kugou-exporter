<template>
  <div class="setup-wrap">
    <div class="bg-orb orba" />
    <div class="bg-orb orbb" />
    <div class="bg-orb orbc" />
    <span class="note n1">♪</span>
    <span class="note n2">♫</span>
    <span class="note n3">♩</span>

    <div class="setup-card">
      <div class="progress">
        <span v-for="i in 3" :key="i" class="dot" :class="{ on: step >= i }" />
      </div>

      <div :key="step" class="fade-step">
        <!-- 欢迎 -->
        <div v-if="step === 0" class="panel">
          <div class="logo">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <h1 class="grad-text">
            酷狗歌单 · 一键导出
          </h1>
          <p class="slogan">
            一键导出，小爱音箱随时播
          </p>
          <p class="desc">
            连接你的酷狗账号，把喜欢的歌单一键带到小爱音箱等播放器。
          </p>
          <el-button class="grad-btn" type="primary" size="large" @click="step = 1">
            开始使用
          </el-button>
        </div>

        <!-- 亮点 -->
        <div v-else-if="step === 1" class="panel">
          <div class="feat-list">
            <div v-for="(f, i) in features" :key="f.title" class="feat animated-up" :style="{ animationDelay: `${i * 0.12}s` }">
              <span class="feat-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="f.icon" />
                </svg>
              </span>
              <div>
                <strong>{{ f.title }}</strong>
                <span>{{ f.desc }}</span>
              </div>
            </div>
          </div>
          <el-button class="grad-btn" type="primary" size="large" style="width: 100%" @click="step = 2">
            下一步
          </el-button>
        </div>

        <!-- 创建账号 -->
        <div v-else class="panel">
          <h2>创建你的账号</h2>
          <el-form label-position="top" @submit.prevent="submit">
            <el-form-item label="用户名">
              <el-input v-model="form.username" placeholder="设置用户名" size="large" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="form.password" type="password" show-password placeholder="至少 6 位" size="large" />
            </el-form-item>
            <el-button class="grad-btn" type="primary" size="large" :loading="loading" style="width: 100%" @click="submit">
              创建并进入
            </el-button>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';

const { setup } = useAuth();
const router = useRouter();
const step = ref(0);
const loading = ref(false);
const form = reactive({ username: '', password: '' });

const features = [
  {
    title: '一键导出',
    desc: 'XiaoMusic / JSON / CSV，一步到位',
    icon: 'M7 10l5 5 5-5M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
  },
  {
    title: '链接永久',
    desc: '内置代理，导出链接永久有效',
    icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  },
  {
    title: '多端播放',
    desc: '小爱音箱等播放器，随导随用',
    icon: 'M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14',
  },
];

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
.setup-wrap {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-base) 0%, #ece6df 100%);
  overflow: hidden;
  padding: 24px;
}

/* 背景光斑 */
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
  left: -60px;
  background: radial-gradient(circle, rgba(233, 106, 60, 0.4), transparent 60%);
}

.orbb {
  width: 420px;
  height: 420px;
  bottom: -120px;
  right: -80px;
  background: radial-gradient(circle, rgba(245, 145, 63, 0.35), transparent 60%);
  animation-delay: -3s;
}

.orbc {
  width: 260px;
  height: 260px;
  top: 40%;
  left: 10%;
  background: radial-gradient(circle, rgba(240, 112, 92, 0.28), transparent 60%);
  animation-delay: -6s;
}

/* 漂浮音符 */
.note {
  position: absolute;
  color: var(--accent);
  opacity: 0.35;
  font-size: 22px;
  animation: floatUp 7s ease-in-out infinite;
}

.n1 {
  top: 22%;
  left: 20%;
  animation-delay: 0s;
}
.n2 {
  top: 60%;
  right: 18%;
  font-size: 28px;
  animation-delay: -2.5s;
}
.n3 {
  top: 30%;
  right: 30%;
  font-size: 18px;
  animation-delay: -5s;
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

.setup-card {
  position: relative;
  z-index: 1;
  width: 460px;
  padding: 46px 42px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 24px 70px rgba(40, 38, 35, 0.18);
}

.progress {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 28px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--border-strong);
  transition: all 0.3s ease;
}

.dot.on {
  background: var(--accent);
  transform: scale(1.3);
  box-shadow: 0 0 10px var(--accent-soft);
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.logo {
  width: 78px;
  height: 78px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-grad);
  box-shadow: 0 12px 30px -8px rgba(233, 106, 60, 0.6);
  animation: pop 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel h1 {
  margin: 6px 0 0;
  font-size: 28px;
  font-weight: 800;
}

.panel h2 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1);
}

.slogan {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
}

.desc {
  margin: 2px 0 6px;
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.7;
}

.feat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.feat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  text-align: left;
}

.feat-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.feat strong {
  display: block;
  color: var(--text-1);
  font-size: 15px;
}

.feat span {
  display: block;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}

.fade-step {
  animation: fadeup 0.4s ease;
}

@keyframes fadeup {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animated-pop {
  animation: pop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.animated-up {
  opacity: 0;
  animation: up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes pop {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes up {
  from {
    transform: translateY(14px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
