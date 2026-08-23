<template>
  <div class="accounts-page">
    <div class="accounts">
      <!-- 页头 -->
      <div class="page-head">
        <div>
          <h2>我的酷狗账号</h2>
          <p>{{ accounts.length ? '添加并管理你的酷狗账号，导出按账号走' : '连接你的第一个酷狗账号，即可开始导出' }}</p>
        </div>
      </div>

      <!-- 演示模式提示 -->
      <div v-if="demo" class="demo-banner">
        <span class="demo-dot">&#9672;</span>
        <span>
          当前为
          <b>演示模式</b>
          ，展示的是演示账号，不会连接你的真实酷狗账号。退出演示模式后即可添加真实账号。
        </span>
      </div>

      <!-- 无账号（仅在确已加载且为空时）：内嵌连接表单，避免先闪“连接卡片” -->
      <div v-if="loaded && accounts.length === 0" class="connect-inline">
        <div class="connect-head">
          <el-avatar :size="42" class="connect-avatar grad-icon">
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
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </el-avatar>
          <div>
            <h3>连接酷狗账号</h3>
            <p>使用手机验证码或扫码登录，连接后即可导出歌单</p>
          </div>
        </div>

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
              <el-button
                type="primary"
                size="large"
                :loading="submitLoading"
                class="submit-btn grad-btn"
                @click="handlePhoneLogin"
              >
                登录并连接
              </el-button>
            </div>

            <div v-show="activeTab === 'qr'" class="tab-pane qr-pane">
              <div v-if="qrPending" class="qr-loading">
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

        <!-- 登录提示 -->
        <p class="connect-note">
          连接后，你的歌单会展示在「歌单」页面，可一键导出到 XiaoMusic。
        </p>
      </div>

      <!-- 有账号：账号列表（行式卡片） -->
      <div v-else v-loading="loading" class="acct-list">
        <div v-for="acct in accounts" :key="acct.id" class="acct-row" :class="{ active: acct.active }">
          <span class="row-avatar">{{ firstNick(acct.nickname) }}</span>
          <div class="row-body">
            <div class="row-name" :title="acct.nickname || '未命名账号'">
              {{ acct.nickname || '未命名账号' }}
            </div>
            <div class="row-sub">
              <span v-if="acct.active" class="row-dot" />
              <span>{{ acct.active ? '当前账号' : '已连接' }}</span>
              <span v-if="acct.kgUserid" class="row-uid">UID {{ acct.kgUserid }}</span>
            </div>
          </div>
          <div class="row-actions">
            <el-button v-if="!acct.active" size="small" type="primary" class="act-switch" @click="activate(acct.id)">
              切换
            </el-button>
            <el-button size="small" text class="act-ghost" @click="openRename(acct)">
              重命名
            </el-button>
            <el-button size="small" text type="danger" class="act-ghost act-danger" @click="remove(acct.id)">
              删除
            </el-button>
          </div>
        </div>

        <!-- 添加账号行 -->
        <button class="acct-row add-row" @click="openConnect">
          <span class="add-icon">+</span>
          <span>添加酷狗账号</span>
        </button>
      </div>
    </div>

    <!-- 已有账号时，点「添加酷狗账号」才弹此弹窗 -->
    <el-dialog
      v-model="showConnect"
      title="连接酷狗账号"
      width="460px"
      top="8vh"
      :close-on-click-modal="false"
      class="connect-dialog"
    >
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
            <el-button
              type="primary"
              size="large"
              :loading="submitLoading"
              class="submit-btn grad-btn"
              @click="handlePhoneLogin"
            >
              登录并连接
            </el-button>
          </div>
          <div v-show="activeTab === 'qr'" class="tab-pane qr-pane">
            <div v-if="qrPending" class="qr-loading">
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
import { disableDemo, isDemo } from '@/utils/mock';
import request from '@/utils/request';

const demo = isDemo();
const loaded = ref(false);
const loading = ref(false);
const qrPending = ref(false);
const submitLoading = ref(false);
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
    loaded.value = true;
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
  // 演示模式为纯预览：不展示真实酷狗登录（避免用户对项目盗号疑虑）
  if (demo) {
    ElMessageBox.confirm(
      '演示模式仅用于预览，不会连接你的真实酷狗账号。是否退出演示模式，去连接真实的酷狗账号？',
      '演示模式',
      {
        confirmButtonText: '退出演示模式',
        cancelButtonText: '继续预览',
        type: 'info',
      }
    )
      .then(() => {
        disableDemo();
        window.location.reload();
      })
      .catch(() => {});
    return;
  }
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
  loading.value = false;
  submitLoading.value = true;
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
      submitLoading.value = false;
    } else {
      console.error(error);
      submitLoading.value = false;
    }
  }
}

async function selectAccount(userid: number) {
  showAccountSelect.value = false;
  submitLoading.value = true;
  try {
    const res = await request.get('/login/cellphone', {
      params: { mobile: phoneForm.phone, code: phoneForm.code, userid },
    });
    ElMessage.success('登录成功');
    await saveAccount(res);
  } catch (error) {
    console.error(error);
    submitLoading.value = false;
  }
}

async function generateQR() {
  qrPending.value = true;
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
    qrPending.value = false;
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
  .accounts-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.accounts {
  flex: 1;
  overflow-y: auto;
  padding: 24px 26px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
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

/* 演示模式提示（低调的内联信息条） */
.demo-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 12px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-3);
  line-height: 1.6;
}

.demo-banner b {
  color: var(--accent);
  font-weight: 600;
}

.demo-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

/* 内嵌连接表单 */
.connect-inline {
  max-width: 440px;
  width: 100%;
  margin: 8px auto 0;
  padding: 30px 32px;
  border-radius: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-1);
  animation: rise 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.connect-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.connect-avatar {
  border-radius: 14px;
}

.connect-head h3 {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: var(--text-1);
}

.connect-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-3);
}

.connect-note {
  margin: 18px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-3);
  text-align: center;
  line-height: 1.6;
}

/* 原版酷狗登录样式 */
/* 连接弹窗：固定高度、禁用滚动条，避免切换登录方式时高度跳动/出现滚动条 */
.connect-dialog .el-dialog__body {
  max-height: none !important;
  overflow: hidden !important;
  padding-bottom: 8px;
}

.connect-dialog .el-dialog {
  overflow: hidden;
}

.login-tabs {
  padding: 2px 0;
}

/* 固定内容区高度：手机 / 扫码两个 pane 高度一致，切换时弹窗高度不变 */
.tab-content {
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.tab-content .tab-pane {
  flex: 1;
}

.tab-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
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
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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
  min-height: 240px;
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

/* 账号列表：行式卡片 */
.acct-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 240px; /* 加载遮罩有空间，避免空列表塌陷 */
}

.acct-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  text-align: left;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.acct-row:hover {
  background: var(--surface-hover);
}

.acct-row.active {
  border-color: var(--accent);
}

/* 头像：实色首字 */
.row-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-3);
}

.row-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #12b76a;
  flex-shrink: 0;
}

.row-uid {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--surface-muted);
  font-size: 11px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.act-switch {
  font-weight: 600;
}

.act-ghost {
  font-weight: 500;
}

/* 添加账号行 */
.add-row {
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 1.5px dashed var(--border-strong);
  background: transparent;
  cursor: pointer;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 600;
}

.add-row:hover {
  border-color: var(--accent);
  background: var(--surface-hover);
  color: var(--text-1);
}

.add-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  flex-shrink: 0;
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
  margin-bottom: 4px;
}

.account-username {
  font-size: 13px;
  color: var(--text-3);
}

@media (max-width: 720px) {
  .accounts {
    padding: 16px;
  }

  .connect-inline {
    padding: 24px 20px;
  }
}
</style>
