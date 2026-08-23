<template>
  <div class="settings-page">
    <div class="page-head">
      <h2>设置</h2>
      <p>管理你的登录密码与本应用的用户</p>
    </div>

    <div class="settings-grid" :class="{ 'no-users': !isAdmin }">
      <!-- 左列：导出设置 + 修改密码（上下排列） -->
      <div class="settings-col">
        <!-- 导出设置 -->
        <section class="card">
          <h3 class="card-title">
            导出设置
          </h3>
          <p class="card-sub">
            配置 XiaoMusic 导出使用的服务器地址与音质，保存后导出时无需再填写
          </p>
          <el-form label-position="top" @submit.prevent="saveExportConfig">
            <label class="field-label">服务器地址</label>
            <el-input v-model="exportForm.serverUrl" placeholder="http://127.0.0.1:3000" size="large" :prefix-icon="Link" />
            <p class="form-tip">
              本项目启动后的服务地址（本机 / 局域网 / 公网 / Docker），播放时需保持服务器运行
            </p>
            <label class="field-label">导出音质</label>
            <quality-select v-model="exportForm.quality" size="large" />
            <div class="card-info">
              <strong>代理链接说明</strong>
              <ul>
                <li>导出的 XiaoMusic 播放链接为服务代理地址，播放器请求时服务器实时获取最新音频</li>
                <li>解决酷狗直链 2–4 小时过期问题，代理链接长期有效</li>
                <li>需保持本项目服务器运行，支持内网 / 外网 / Docker</li>
                <li>音质越高可能要求酷狗账号具备对应权限（如 VIP 高品质音质）</li>
              </ul>
            </div>
            <div class="form-actions">
              <el-button
                class="grad-btn submit-btn"
                type="primary"
                size="large"
                :loading="cfgSaving"
                @click="saveExportConfig"
              >
                保存导出设置
              </el-button>
            </div>
          </el-form>
        </section>

        <!-- 修改密码 -->
        <section class="card">
          <h3 class="card-title">
            修改密码
          </h3>
          <p class="card-sub">
            修改当前登录账号的密码
          </p>
          <el-form label-position="top" @submit.prevent="submitPassword">
            <label class="field-label">当前密码</label>
            <el-input
              v-model="pw.oldPassword"
              type="password"
              show-password
              placeholder="输入当前密码"
              size="large"
              :prefix-icon="Lock"
            />
            <label class="field-label">新密码</label>
            <el-input
              v-model="pw.newPassword"
              type="password"
              show-password
              placeholder="至少 6 位"
              size="large"
              :prefix-icon="Key"
            />
            <label class="field-label">确认新密码</label>
            <el-input
              v-model="pw.confirm"
              type="password"
              show-password
              placeholder="再次输入新密码"
              size="large"
              :prefix-icon="Key"
              @keyup.enter="submitPassword"
            />
            <div class="card-info">
              <strong>安全提示</strong>
              <ul>
                <li>密码至少 6 位，建议使用字母 + 数字组合，避免与其他平台重复</li>
                <li>修改成功前需验证当前密码，修改后请使用新密码登录</li>
                <li>忘记当前密码时，可联系管理员在「用户管理」中重置</li>
                <li>为子用户重置密码同样会在「用户管理」中进行</li>
              </ul>
            </div>
            <div class="form-actions">
              <el-button
                class="grad-btn submit-btn"
                type="primary"
                size="large"
                :loading="pwLoading"
                @click="submitPassword"
              >
                保存新密码
              </el-button>
            </div>
          </el-form>
        </section>
      </div>

      <!-- 右列：用户管理（独立一列） -->
      <section v-if="isAdmin" class="card wide">
        <div class="card-head">
          <div>
            <h3 class="card-title">
              用户管理
            </h3>
            <p class="card-sub">
              创建、重置密码或删除子用户
            </p>
          </div>
          <el-button type="primary" :icon="Plus" @click="openCreate">
            新增用户
          </el-button>
        </div>

        <el-table v-loading="usersLoading" :data="users" class="user-table">
          <el-table-column label="用户" min-width="140">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="30" class="user-avatar">
                  {{ row.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="user-cell-name">{{ row.username }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="角色" width="90">
            <template #default="{ row }">
              <el-tag :type="row.is_admin ? 'warning' : 'info'" size="small" round>
                {{ row.is_admin ? '管理员' : '用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">
              <span class="nowrap">
                {{ fmtTime(row.created_at) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center">
            <template #default="{ row }">
              <div v-if="row.id === appUser?.id" class="row-self">
                当前账号
              </div>
              <div v-else class="row-actions">
                <el-button size="small" text :icon="Refresh" @click="resetPassword(row)">
                  重置密码
                </el-button>
                <el-button
                  size="small"
                  text
                  type="danger"
                  :icon="Delete"
                  :disabled="row.id === appUser?.id"
                  @click="removeUser(row)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <!-- 新增用户 -->
    <el-dialog v-model="createVisible" title="新增用户" width="420px" :close-on-click-modal="false">
      <el-form label-position="top">
        <label class="field-label">用户名</label>
        <el-input v-model="createForm.username" placeholder="请输入用户名" size="large" :prefix-icon="User" />
        <label class="field-label">密码</label>
        <el-input
          v-model="createForm.password"
          type="password"
          show-password
          placeholder="至少 6 位"
          size="large"
          :prefix-icon="Lock"
        />
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">
          取消
        </el-button>
        <el-button class="grad-btn" type="primary" :loading="createLoading" @click="createUser">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { SessionUser } from '@/api';
import { Delete, Key, Link, Lock, Plus, Refresh, User } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reactive, ref } from 'vue';
import { configApi, userApi } from '@/api';
import QualitySelect from '@/components/QualitySelect.vue';
import { useAuth } from '@/stores/auth';

const { user: appUser } = useAuth();
const isAdmin = computed(() => !!appUser.value?.is_admin);

// ---- 导出设置 ----
const exportForm = ref({ serverUrl: '', quality: 'high' });
const cfgSaving = ref(false);

async function loadExportConfig() {
  try {
    const cfg = await configApi.get();
    exportForm.value.serverUrl = cfg.serverUrl;
    if (cfg.settings?.quality) exportForm.value.quality = cfg.settings.quality;
  } catch {
    /* ignore */
  }
}

async function saveExportConfig() {
  cfgSaving.value = true;
  try {
    await configApi.save({ serverUrl: exportForm.value.serverUrl.trim(), quality: exportForm.value.quality });
    ElMessage.success('导出设置已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    cfgSaving.value = false;
  }
}

const pw = reactive({ oldPassword: '', newPassword: '', confirm: '' });
const pwLoading = ref(false);

function fmtTime(t: number): string {
  return dayjs(t).format('YYYY-MM-DD HH:mm');
}

async function submitPassword() {
  if (!pw.oldPassword || !pw.newPassword) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  if (pw.newPassword.length < 6) {
    ElMessage.warning('新密码至少 6 位');
    return;
  }
  if (pw.newPassword !== pw.confirm) {
    ElMessage.warning('两次输入的新密码不一致');
    return;
  }
  pwLoading.value = true;
  try {
    await userApi.changePassword(pw.oldPassword, pw.newPassword);
    ElMessage.success('密码已更新');
    pw.oldPassword = '';
    pw.newPassword = '';
    pw.confirm = '';
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '修改失败');
  } finally {
    pwLoading.value = false;
  }
}

// ---- 用户管理 ----
const users = ref<SessionUser[]>([]);
const usersLoading = ref(false);
const createVisible = ref(false);
const createLoading = ref(false);
const createForm = reactive({ username: '', password: '' });

async function loadUsers() {
  usersLoading.value = true;
  try {
    users.value = await userApi.users();
  } catch {
    users.value = [];
  } finally {
    usersLoading.value = false;
  }
}

function openCreate() {
  createForm.username = '';
  createForm.password = '';
  createVisible.value = true;
}

async function createUser() {
  if (!createForm.username || !createForm.password) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  if (createForm.password.length < 6) {
    ElMessage.warning('密码至少 6 位');
    return;
  }
  createLoading.value = true;
  try {
    await userApi.create(createForm.username, createForm.password);
    ElMessage.success('已创建');
    createVisible.value = false;
    await loadUsers();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '创建失败');
  } finally {
    createLoading.value = false;
  }
}

async function resetPassword(row: SessionUser) {
  const res: any = await ElMessageBox.prompt('输入该用户的新密码', `重置「${row.username}」的密码`, {
    inputType: 'password',
    inputPattern: /^.{6,}$/,
    inputErrorMessage: '密码至少 6 位',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  });
  try {
    await userApi.resetPassword(row.id, res.value);
    ElMessage.success('密码已重置');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '重置失败');
  }
}

async function removeUser(row: SessionUser) {
  await ElMessageBox.confirm(`确定删除用户「${row.username}」？该操作不可撤销`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  });
  try {
    await userApi.remove(row.id);
    ElMessage.success('已删除');
    await loadUsers();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '删除失败');
  }
}

onMounted(() => {
  loadExportConfig();
  if (isAdmin.value) loadUsers();
});
</script>

<style scoped>
  .settings-page {
  height: 100%;
  overflow-y: auto;
  padding: 26px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.settings-grid {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(560px, 1.4fr);
  gap: 20px;
  align-items: start;
}

/* 非管理员：没有用户管理卡片，两张设置卡并排铺满 */
.settings-grid.no-users {
  grid-template-columns: 1fr;
}

.settings-grid.no-users .settings-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 20px;
}

.settings-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  align-items: stretch;
}

/* 卡片等高，表单撑满，主按钮贴底 → 左右两卡按钮底边对齐 */
.settings-col .card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.settings-col .card .el-form {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.settings-col .submit-btn {
  margin-top: 0;
}

/* 按钮贴底且与上方输入框保持 20px 间距 */
.settings-col .form-actions {
  margin-top: auto;
  padding-top: 20px;
}

.card {
  padding: 24px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow-1);
}

.card.wide {
  min-width: 0;
}

.card-title {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1);
}

.card-sub {
  margin: 0 0 18px;
  font-size: 12px;
  color: var(--text-3);
}

.form-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.6;
}

/* 说明卡：弹性拉满剩余空间，消除两卡等高带来的空白带 */
.card-info {
  margin-top: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
}

.card-info strong {
  font-size: 13px;
  color: var(--text-1);
}

.card-info ul {
  margin: 8px 0 0;
  padding-left: 16px;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.8;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.field-label {
  display: block;
  margin: 14px 0 8px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
}

.submit-btn {
  width: 100%;
  margin-top: 20px;
  height: 44px;
}

.user-table {
  margin-top: 6px;
}

.user-table .nowrap {
  white-space: nowrap;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.row-self {
  font-size: 12px;
  color: var(--text-3);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  background: var(--accent-grad);
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
}

.user-cell-name {
  font-weight: 600;
  color: var(--text-1);
}

@media (max-width: 1120px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
