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
              酷狗歌单一键导出
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
            <p>选择一种方式登录你的酷狗账号</p>
          </div>

          <div class="tabs">
            <button :class="{ active: activeTab === 'phone' }" @click="activeTab = 'phone'">
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
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
              手机登录
            </button>
            <button :class="{ active: activeTab === 'qr' }" @click="activeTab = 'qr'">
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
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM21 14v3M14 21h3M21 21h0" />
              </svg>
              扫码登录
            </button>
          </div>

          <div v-show="activeTab === 'phone'" class="pane">
            <label class="field-label">手机号</label>
            <el-input v-model="phoneForm.phone" placeholder="请输入手机号" size="large" :prefix-icon="Iphone" />
            <label class="field-label">验证码</label>
            <div class="code-row">
              <el-input v-model="phoneForm.code" placeholder="请输入验证码" size="large" :prefix-icon="Key" />
              <el-button size="large" :disabled="countdown > 0" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </el-button>
            </div>
            <el-button
              class="grad-btn submit-btn"
              type="primary"
              size="large"
              :loading="loading"
              @click="handlePhoneLogin"
            >
              登录
            </el-button>
          </div>

          <div v-show="activeTab === 'qr'" class="pane qr-pane">
            <div v-if="loading" class="qr-state">
              <div class="spinner" />
              <span>正在生成二维码...</span>
            </div>
            <template v-else-if="qrCode">
              <div class="qr-box">
                <img :src="qrCode" alt="QR Code">
              </div>
              <p class="qr-hint">
                请使用酷狗音乐 App 扫码登录
              </p>
              <el-button text type="primary" @click="generateQR">
                刷新二维码
              </el-button>
            </template>
            <el-empty v-else description="点击下方按钮生成二维码" :image-size="88" />
          </div>

          <div class="form-footer">
            <button class="demo-link" @click="enterDemo">
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

    <el-dialog v-model="showAccountSelect" title="选择账号" width="400px" :close-on-click-modal="false" align-center>
      <div class="account-list">
        <div
          v-for="account in accountList"
          :key="account.userid"
          class="account-item"
          @click="selectAccount(account.userid)"
        >
          <el-avatar :src="replaceImageSize(account.pic, 100)" :size="50" />
          <div class="account-info">
            <div class="account-name">
              {{ account.nickname }}
            </div>
            <div class="account-username">
              {{ account.username }}
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { QRCheckData, QRCreateData, QRKeyData } from '@/types';
import { Iphone, Key } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { replaceImageSize } from '@/utils/image';
import { disableDemo, enableDemo, isDemo } from '@/utils/mock';
import request from '@/utils/request';

const router = useRouter();
const demoEnabled = ref(isDemo());

const features = [
  { icon: '📱', title: '手机/扫码登录', desc: '验证码或二维码，快捷安全' },
  { icon: '🎵', title: '多格式导出', desc: 'XiaoMusic / JSON / CSV 一键生成' },
  { icon: '🔗', title: '永久代理链接', desc: '实时获取最新播放地址，拒绝过期' },
  { icon: '☁️', title: '多端部署', desc: '支持内网、外网与 Docker' },
];

const activeTab = ref('phone');
const loading = ref(false);
const countdown = ref(0);
const qrCode = ref('');
const qrKey = ref('');
let qrTimer: number | null = null;

watch(activeTab, (newTab) => {
  if (newTab === 'qr') {
    if (!qrCode.value) generateQR();
    else checkQRStatus();
  } else if (qrTimer) {
    clearInterval(qrTimer);
    qrTimer = null;
  }
});

const phoneForm = reactive({ phone: '', code: '' });
const accountList = ref<any[]>([]);
const showAccountSelect = ref(false);

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

async function sendCode() {
  if (!phoneForm.phone) {
    ElMessage.warning('请输入手机号');
    return;
  }
  try {
    await request.get('/captcha/sent', { params: { mobile: phoneForm.phone } });
    ElMessage.success('验证码已发送');
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) clearInterval(timer);
    }, 1000);
  } catch (error) {
    console.error(error);
  }
}

async function handlePhoneLogin() {
  if (!phoneForm.phone || !phoneForm.code) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  loading.value = true;
  try {
    const res = await request.get('/login/cellphone', {
      params: { mobile: phoneForm.phone, code: phoneForm.code },
    });
    if (res.status === 1) {
      disableDemo();
      demoEnabled.value = false;
      ElMessage.success('登录成功');
      router.push('/playlist');
    }
  } catch (error: any) {
    if (error.response?.data?.data?.info_list) {
      accountList.value = error.response.data.data.info_list;
      showAccountSelect.value = true;
      loading.value = false;
    } else {
      console.error(error);
      loading.value = false;
    }
  }
}

async function selectAccount(userid: number) {
  showAccountSelect.value = false;
  loading.value = true;
  try {
    await request.get('/login/cellphone', {
      params: { mobile: phoneForm.phone, code: phoneForm.code, userid },
    });
    disableDemo();
    demoEnabled.value = false;
    ElMessage.success('登录成功');
    router.push('/playlist');
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function generateQR() {
  loading.value = true;
  try {
    const keyRes = await request.get<QRKeyData>('/login/qr/key', { params: { timestamp: Date.now() } });
    qrKey.value = keyRes.data.qrcode;
    const qrRes = await request.get<QRCreateData>('/login/qr/create', {
      params: { key: qrKey.value, qrimg: true, timestamp: Date.now() },
    });
    qrCode.value = qrRes.data.base64;
    checkQRStatus();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function checkQRStatus() {
  if (qrTimer) clearInterval(qrTimer);
  qrTimer = setInterval(async () => {
    try {
      const res = await request.get<QRCheckData>('/login/qr/check', {
        params: { key: qrKey.value, timestamp: Date.now() },
      });
      if (res.data.status === 4) {
        clearInterval(qrTimer!);
        qrTimer = null;
        disableDemo();
        demoEnabled.value = false;
        ElMessage.success('登录成功');
        router.push('/playlist');
      } else if (res.data.status === 0) {
        clearInterval(qrTimer!);
        qrTimer = null;
        ElMessage.error('二维码已过期');
        qrCode.value = '';
      }
    } catch {
      clearInterval(qrTimer!);
      qrTimer = null;
    }
  }, 2000);
}

onUnmounted(() => {
  if (qrTimer) {
    clearInterval(qrTimer);
    qrTimer = null;
  }
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
  background: var(--accent-grad);
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

.tabs {
  display: flex;
  gap: 6px;
  padding: 5px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 24px;
}

.tabs button {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.tabs button.active {
  background: var(--surface-solid);
  color: var(--accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.field-label {
  display: block;
  margin: 16px 0 8px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
}

.code-row {
  display: flex;
  gap: 10px;
}

.code-row .el-input {
  flex: 1;
}

.submit-btn {
  width: 100%;
  margin-top: 22px;
  height: 44px;
}

.pane {
  min-height: 300px;
}

.qr-pane {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.qr-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: var(--text-3);
  font-size: 13px;
}

.spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid var(--accent-soft);
  border-top-color: var(--accent);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.qr-box {
  width: 216px;
  height: 216px;
  padding: 12px;
  background: #fff;
  border-radius: 16px;
  box-shadow: var(--shadow-1);
}

.qr-box img {
  width: 100%;
  height: 100%;
  display: block;
}

.qr-hint {
  margin: 0;
  color: var(--text-2);
  font-size: 13px;
}

.form-footer {
  margin-top: 18px;
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

.account-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.account-item:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.account-info {
  flex: 1;
}

.account-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.account-username {
  font-size: 13px;
  color: var(--text-3);
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
