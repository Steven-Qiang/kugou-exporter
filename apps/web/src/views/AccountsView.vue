<template>
  <div class="accounts">
    <div class="page-head">
      <div>
        <h2>我的酷狗账号</h2>
        <p>添加并管理你的酷狗账号，导出按账号走</p>
      </div>
      <el-button class="grad-btn" type="primary" @click="openConnect">
        + 添加酷狗账号
      </el-button>
    </div>

    <div v-loading="loading" class="list">
      <div v-for="acct in accounts" :key="acct.id" class="account-card" :class="{ active: acct.active }">
        <div class="acct-info">
          <div class="acct-avatar grad-icon">
            {{ firstNick(acct.nickname) }}
          </div>
          <div>
            <div class="acct-name">
              {{ acct.nickname || '未命名账号' }}
              <el-tag v-if="acct.active" size="small" type="success" round>
                当前
              </el-tag>
            </div>
            <div class="acct-sub">
              {{ acct.active ? '正在使用' : '已连接' }}
            </div>
          </div>
        </div>
        <div class="acct-actions">
          <el-button v-if="!acct.active" size="small" @click="activate(acct.id)">
            切换
          </el-button>
          <el-button size="small" text @click="openRename(acct)">
            重命名
          </el-button>
          <el-button size="small" text type="danger" @click="remove(acct.id)">
            删除
          </el-button>
        </div>
      </div>

      <el-empty v-if="!loading && accounts.length === 0" description="还没有酷狗账号，点击右上角添加" />
    </div>

    <!-- 连接酷狗账号：沿用原版酷狗登录（手机 + 扫码 + 账号选择） -->
    <el-dialog v-model="showConnect" title="连接酷狗账号" width="460px" top="8vh" :close-on-click-modal="false">
      <div class="login-tabs">
        <div class="tab-nav">
          <button :class="{ active: activeTab === 'phone' }" @click="activeTab = 'phone'">
            手机登录
          </button>
          <button :class="{ active: activeTab === 'qr' }" @click="activeTab = 'qr'">
            扫码登录
          </button>
        </div>

        <div class="tab-content">
          <div v-show="activeTab === 'phone'" class="tab-pane">
            <div class="form-group">
              <label>手机号</label>
              <el-input v-model="phoneForm.phone" placeholder="请输入手机号" size="large" />
            </div>
            <div class="form-group">
              <label>验证码</label>
              <div class="code-input">
                <el-input v-model="phoneForm.code" placeholder="请输入验证码" size="large" />
                <el-button :disabled="countdown > 0" size="large" @click="sendCode">
                  {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                </el-button>
              </div>
            </div>
            <el-button type="primary" size="large" :loading="loading" class="submit-btn grad-btn" @click="handlePhoneLogin">
              登录并连接
            </el-button>
          </div>

          <div v-show="activeTab === 'qr'" class="tab-pane qr-pane">
            <div v-if="loading" class="qr-loading">
              <el-icon class="is-loading" :size="50">
                <loading-icon />
              </el-icon>
              <p>正在生成二维码...</p>
            </div>
            <template v-else-if="qrCode">
              <div class="qr-image">
                <img :src="qrCode" alt="QR Code">
              </div>
              <p class="qr-hint">
                请使用酷狗音乐APP扫码登录
              </p>
              <el-button text type="primary" @click="generateQR">
                刷新二维码
              </el-button>
            </template>
            <div v-else class="qr-loading">
              <el-button type="primary" size="large" class="grad-btn" @click="generateQR">
                生成二维码
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showAccountSelect" title="选择账号" width="400px" :close-on-click-modal="false">
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
import type { KugouAccount } from '@/api';
import type { QRCheckData, QRCreateData, QRKeyData } from '@/types';
import { Loading as LoadingIcon } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { kugouApi } from '@/api';
import { replaceImageSize } from '@/utils/image';
import request from '@/utils/request';

const loading = ref(false);
const accounts = ref<KugouAccount[]>([]);
const showConnect = ref(false);

const activeTab = ref('phone');
const countdown = ref(0);
const qrCode = ref('');
const qrKey = ref('');
let qrTimer: number | null = null;

const phoneForm = reactive({ phone: '', code: '' });
const accountList = ref<any[]>([]);
const showAccountSelect = ref(false);

function firstNick(nickname: string): string {
  return nickname?.charAt(0) || '♪';
}

async function load() {
  loading.value = true;
  try {
    accounts.value = await kugouApi.list();
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
}

async function activate(id: number) {
  await kugouApi.activate(id);
  ElMessage.success('已切换');
  await load();
}

async function remove(id: number) {
  await ElMessageBox.confirm('确定删除该酷狗账号？', '提示', { type: 'warning' });
  await kugouApi.remove(id);
  ElMessage.success('已删除');
  await load();
}

async function openRename(acct: KugouAccount) {
  const res: any = await ElMessageBox.prompt('新的昵称', '重命名', { inputValue: acct.nickname });
  await kugouApi.rename(acct.id, res.value);
  await load();
}

function openConnect() {
  activeTab.value = 'phone';
  qrCode.value = '';
  qrKey.value = '';
  phoneForm.phone = '';
  phoneForm.code = '';
  countdown.value = 0;
  showConnect.value = true;
}

function stopQrTimer() {
  if (qrTimer) {
    clearInterval(qrTimer);
    qrTimer = null;
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'qr') {
    if (!qrCode.value) {
      generateQR();
    } else {
      checkQRStatus();
    }
  } else {
    stopQrTimer();
  }
});

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
      ElMessage.success('登录成功');
      await saveAccount(res);
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
    const res = await request.get('/login/cellphone', {
      params: { mobile: phoneForm.phone, code: phoneForm.code, userid },
    });
    ElMessage.success('登录成功');
    await saveAccount(res);
  } catch (error) {
    console.error(error);
    loading.value = false;
  }
}

async function generateQR() {
  loading.value = true;
  try {
    const keyRes = await request.get<QRKeyData>('/login/qr/key', {
      params: { timestamp: Date.now() },
    });
    qrKey.value = keyRes.data.qrcode;
    const qrRes = await request.get<QRCreateData>('/login/qr/create', {
      params: { key: qrKey.value, qrimg: true, timestamp: Date.now() },
    });
    qrCode.value = qrRes.data.base64;
    checkQRStatus();
  } catch (error) {
    console.error(error);
    ElMessage.error('生成二维码失败');
  } finally {
    loading.value = false;
  }
}

async function checkQRStatus() {
  stopQrTimer();
  qrTimer = setInterval(async () => {
    try {
      const res = await request.get<QRCheckData>('/login/qr/check', {
        params: { key: qrKey.value, timestamp: Date.now() },
      });
      if (res.data.status === 4) {
        stopQrTimer();
        ElMessage.success('登录成功');
        await saveAccount(res);
      } else if (res.data.status === 0) {
        stopQrTimer();
        ElMessage.error('二维码已过期');
        qrCode.value = '';
      }
    } catch {
      stopQrTimer();
    }
  }, 2000);
}

/** 登录成功后把当前浏览器持有的酷狗 cookie 保存为服务端账号（后端从 req.cookies 读取） */
async function saveAccount(loginRes: any) {
  const nickname
    = loginRes?.data?.nickname || loginRes?.data?.data?.nickname || loginRes?.data?.data?.nickname2 || '酷狗账号';
  await kugouApi.add(nickname || '酷狗账号');
  ElMessage.success('已连接');
  showConnect.value = false;
  stopQrTimer();
  await load();
}

onUnmounted(() => {
  stopQrTimer();
});

load();
</script>

<style scoped>
.accounts {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-head h2 {
  margin: 0 0 4px;
  font-size: 22px;
  color: var(--text-1);
}

.page-head p {
  margin: 0;
  font-size: 13px;
  color: var(--text-3);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
}

.account-card.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.acct-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.acct-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 700;
}

.acct-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.acct-sub {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}

.acct-actions {
  display: flex;
  gap: 4px;
}

/* 原版酷狗登录样式 */
.login-tabs {
  padding: 6px 4px;
}

.tab-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: var(--surface-muted);
  padding: 4px;
  border-radius: 8px;
}

.tab-nav button {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s;
}

.tab-nav button.active {
  background: var(--surface-solid);
  color: var(--accent);
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-pane {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-1);
  font-size: 14px;
  font-weight: 500;
}

.code-input {
  display: flex;
  gap: 10px;
}

.code-input .el-input {
  flex: 1;
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
}

.qr-pane {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: var(--text-3);
}

.qr-image {
  width: 200px;
  height: 200px;
  padding: 15px;
  background: #fff;
  border: 2px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.qr-image img {
  width: 100%;
  height: 100%;
  display: block;
}

.qr-hint {
  margin: 20px 0 10px;
  color: var(--text-2);
  font-size: 14px;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
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
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 4px;
}

.account-username {
  font-size: 13px;
  color: var(--text-3);
}
</style>
