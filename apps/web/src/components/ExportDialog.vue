<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    top="5vh"
    :close-on-click-modal="!exporting"
    :close-on-press-escape="!exporting"
    width="620px"
    @close="handleClose"
  >
    <!-- Step: choose format -->
    <div v-if="!exporting && !exportResult" class="export-steps">
      <div class="export-option" @click="showXiaomusicConfig">
        <span class="option-badge grad-icon">
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
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </span>
        <div class="option-text">
          <strong>XiaoMusic 格式</strong>
          <span>歌名 + 服务器代理链接，链接永久有效</span>
        </div>
        <span class="option-arrow">›</span>
      </div>

      <div class="export-option" @click="handleExport('json')">
        <span class="option-badge grad-icon">
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5M12 15V3" />
          </svg>
        </span>
        <div class="option-text">
          <strong>原始 JSON</strong>
          <span>完整歌曲元数据，不含播放链接</span>
        </div>
        <span class="option-arrow">›</span>
      </div>

      <div class="export-option" @click="handleExport('csv')">
        <span class="option-badge grad-icon">
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" />
          </svg>
        </span>
        <div class="option-text">
          <strong>CSV 表格</strong>
          <span>歌名 / 歌手 / 专辑 / 时长，Excel 可打开</span>
        </div>
        <span class="option-arrow">›</span>
      </div>
    </div>

    <!-- Step: doing export -->
    <div v-if="exporting" class="export-progress">
      <div class="progress-ring" :style="{ '--p': exportProgress }">
        <span class="progress-num">{{ exportProgress }}%</span>
      </div>
      <div class="progress-info">
        <div class="progress-status">
          {{ exportStatus }}
        </div>
        <div v-if="exportDetail.totalSongs > 0" class="progress-detail">
          共 {{ exportDetail.totalSongs }} 首，已处理 {{ exportDetail.fetchedCount }} 首
          <span v-if="exportDetail.currentSong">· 当前：{{ exportDetail.currentSong }}</span>
        </div>
      </div>
    </div>

    <!-- Step: result -->
    <div v-if="exportResult" class="export-result">
      <el-input v-model="exportResult" type="textarea" :rows="14" readonly class="result-area" />
      <div class="result-actions">
        <el-button type="primary" :icon="CopyDocument" @click="copyResult">
          复制
        </el-button>
        <el-button type="success" :icon="Download" @click="downloadResult">
          下载文件
        </el-button>
        <el-button @click="resetExport">
          继续导出
        </el-button>
      </div>
    </div>

    <template #footer>
      <template v-if="!exporting && !exportResult">
        <el-button text :icon="Clock" @click="toggleHistory">
          导出历史
        </el-button>
        <el-button @click="visible = false">
          取消
        </el-button>
      </template>
    </template>
  </el-dialog>

  <!-- XiaoMusic config dialog -->
  <el-dialog v-model="configVisible" title="导出 XiaoMusic 格式" width="560px" top="5vh">
    <div v-if="vipInfo" class="vip-card">
      <div class="vip-row">
        <span>当前账号：{{ vipInfo.nickname }}</span>
        <span v-if="vipInfo.vip_type > 0" class="vip-badge">VIP</span>
      </div>
      <p class="vip-tip">
        高品质音频可能需要 VIP 会员才能获取
      </p>
    </div>

    <el-form label-position="top">
      <el-form-item label="服务器地址">
        <el-input v-model="form.serverUrl" placeholder="http://127.0.0.1:3000" />
        <p class="form-tip">
          本项目启动后的服务地址（本机 / 局域网 / 公网 / Docker），播放时需保持服务器运行
        </p>
      </el-form-item>
      <el-form-item label="音质">
        <quality-select v-model="form.quality" />
      </el-form-item>
    </el-form>

    <div class="info-card">
      <strong>代理链接说明</strong>
      <ul>
        <li>导出的播放链接为服务代理地址</li>
        <li>播放器请求时，服务器实时调用酷狗音乐 API 获取最新音频地址</li>
        <li>解决酷狗直链 2–4 小时过期问题，代理链接永久有效</li>
        <li>需保持本项目服务器运行，支持内网 / 外网 / Docker</li>
      </ul>
    </div>

    <template #footer>
      <el-button @click="configVisible = false">
        取消
      </el-button>
      <el-button class="grad-btn" type="primary" @click="confirmExport">
        确定
      </el-button>
    </template>
  </el-dialog>

  <!-- Export history drawer -->
  <el-drawer v-model="historyVisible" title="导出历史" size="360px">
    <div v-if="history.length === 0" class="empty-history">
      <el-empty description="暂无导出记录" :image-size="90" />
    </div>
    <div v-else class="history-list">
      <div v-for="item in history" :key="item.id" class="history-item">
        <div class="history-meta">
          <div class="history-title">
            {{ item.playlistName || '歌单' }}
          </div>
          <div class="history-sub">
            {{ fmtTime(item.createdAt) }} · {{ fmtFormat(item.format) }} · {{ item.count }} 首
          </div>
        </div>
        <div class="history-actions">
          <el-button size="small" text @click="reuseHistory(item)">
            下载
          </el-button>
          <el-button size="small" text type="danger" @click="deleteHistory(item.id)">
            删除
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import type { ExportHistoryItem } from '@/api';
import type { Song, XiaomusicPlaylist, XiaomusicSong } from '@/types';
import { Clock, CopyDocument, Download } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import useClipboard from 'vue-clipboard3';
import { configApi, historyApi, kugouApi } from '@/api';
import { buildCsvContent, buildProxyUrl, csvFilename, downloadText, jsonFilename } from '@/utils/export';
import request from '@/utils/request';
import QualitySelect from './QualitySelect.vue';

const { toClipboard } = useClipboard();

const visible = ref(false);
const configVisible = ref(false);
const historyVisible = ref(false);
const songs = ref<Song[]>([]);
const playlistName = ref('');

const form = ref({ serverUrl: '', quality: 'high' });
const vipInfo = ref<{ nickname: string; vip_type: number } | null>(null);
const exporting = ref(false);
const exportProgress = ref(0);
const exportStatus = ref('');
const exportDetail = ref({
  totalSongs: 0,
  fetchedCount: 0,
  currentSong: '',
  successCount: 0,
});
const exportResult = ref('');
const currentExportType = ref<'xiaomusic' | 'json' | 'csv'>('xiaomusic');
const activeAccountId = ref<number | null>(null);
const activeKgUserid = ref<string>('');
const history = ref<ExportHistoryItem[]>([]);

const dialogTitle = computed(() => {
  if (exporting.value) return '导出进度';
  if (exportResult.value) return '导出结果';
  return '导出歌单';
});

async function loadHistory() {
  try {
    history.value = await historyApi.list();
  } catch {
    history.value = [];
  }
}

function toggleHistory() {
  loadHistory();
  historyVisible.value = true;
}

function fmtTime(t: number): string {
  return dayjs(t).format('MM-DD HH:mm');
}

function fmtFormat(f: string): string {
  return f === 'xiaomusic' ? 'XiaoMusic' : f.toUpperCase();
}

function reuseHistory(item: ExportHistoryItem) {
  const filename
    = item.format === 'csv' ? csvFilename(item.playlistName) : jsonFilename(item.playlistName, item.format as any);
  downloadText(item.content, filename, item.format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json');
}

async function deleteHistory(id: number) {
  try {
    await historyApi.remove(id);
    ElMessage.success('已删除');
    await loadHistory();
  } catch {
    ElMessage.error('删除失败');
  }
}

async function loadConfig() {
  try {
    const cfg = await configApi.get();
    form.value.serverUrl = cfg.serverUrl;
    if (cfg.settings?.quality) form.value.quality = cfg.settings.quality;
    // 激活账号 id（用于历史记录）+ 酷狗 userid（用于代理链接 uid）
    try {
      const accounts = await kugouApi.list();
      const active = accounts.find((a) => a.active);
      activeAccountId.value = active ? active.id : null;
      activeKgUserid.value = active?.kgUserid || '';
    } catch {
      activeAccountId.value = null;
      activeKgUserid.value = '';
    }
    // VIP 信息
    try {
      const me = await request.get<any>('/kugou/me');
      const u = me?.data?.data?.userinfo || me?.data?.data?.info || me?.data?.data || me?.data;
      if (u?.nickname || u?.nickname2) {
        vipInfo.value = { nickname: u.nickname || u.nickname2 || '当前账号', vip_type: Number(u.vip_type) || 0 };
      } else {
        vipInfo.value = null;
      }
    } catch {
      vipInfo.value = null;
    }
  } catch (error) {
    console.error(error);
  }
}

function showXiaomusicConfig() {
  configVisible.value = true;
}

function proxyUrlFor(song: Song): string {
  return buildProxyUrl(form.value.serverUrl, song, form.value.quality, activeKgUserid.value || undefined);
}

async function confirmExport() {
  if (!form.value.serverUrl) {
    ElMessage.warning('请填写服务器地址');
    return;
  }
  try {
    await configApi.save({ serverUrl: form.value.serverUrl, quality: form.value.quality });
  } catch {
    ElMessage.error('保存配置失败');
    return;
  }
  configVisible.value = false;
  await handleExport('xiaomusic');
}

async function recordHistory(format: string, count: number, content: string) {
  try {
    await historyApi.add({
      kugouAccountId: activeAccountId.value,
      playlistName: playlistName.value,
      format,
      count,
      content,
    });
  } catch {
    /* ignore */
  }
}

async function handleExport(type: 'xiaomusic' | 'json' | 'csv') {
  currentExportType.value = type;
  exporting.value = true;
  exportProgress.value = 0;
  exportStatus.value = '正在生成...';
  exportDetail.value = { totalSongs: songs.value.length, fetchedCount: 0, currentSong: '', successCount: 0 };

  try {
    const sortedSongs = [...songs.value].sort((a, b) => a.fsort - b.fsort);

    if (type === 'xiaomusic') {
      const xiaomusicSongs: XiaomusicSong[] = [];
      for (let i = 0; i < sortedSongs.length; i++) {
        const song = sortedSongs[i];
        exportDetail.value.currentSong = song.name;
        exportDetail.value.fetchedCount = i + 1;
        xiaomusicSongs.push({ name: song.name, url: proxyUrlFor(song) });
        exportProgress.value = Math.floor(((i + 1) / sortedSongs.length) * 100);
        exportStatus.value = `正在生成链接 ${i + 1}/${sortedSongs.length}`;
      }
      const data: XiaomusicPlaylist[] = [{ name: playlistName.value, musics: xiaomusicSongs }];
      exportResult.value = JSON.stringify(data, null, 2);
    } else if (type === 'json') {
      exportResult.value = JSON.stringify(sortedSongs, null, 2);
      exportProgress.value = 100;
    } else if (type === 'csv') {
      const content = buildCsvContent(sortedSongs);
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = csvFilename(playlistName.value);
      a.click();
      URL.revokeObjectURL(url);
      exportProgress.value = 100;
      await recordHistory(type, sortedSongs.length, content);
      ElMessage.success(`导出成功！共 ${sortedSongs.length} 首`);
      // CSV 没有“结果预览”，直接结束导出态并关闭弹窗（否则 handleClose 的守卫会挡住关闭）
      exporting.value = false;
      handleClose();
      return;
    }

    await recordHistory(type, sortedSongs.length, exportResult.value);
    exportStatus.value = '导出完成！';
    exportProgress.value = 100;
    ElMessage.success(`导出成功！共 ${sortedSongs.length} 首`);
  } catch (error) {
    console.error(error);
    ElMessage.error('导出失败');
    handleClose();
  } finally {
    exporting.value = false;
  }
}

async function copyResult() {
  try {
    await toClipboard(exportResult.value);
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.error('复制失败，请手动复制');
  }
}

function downloadResult() {
  const filename
    = currentExportType.value === 'csv'
      ? csvFilename(playlistName.value)
      : jsonFilename(playlistName.value, currentExportType.value);
  downloadText(exportResult.value, filename);
  ElMessage.success('下载成功');
}

function resetExport() {
  exportResult.value = '';
  exportProgress.value = 0;
}

function handleClose() {
  if (!exporting.value) {
    exportResult.value = '';
    exportProgress.value = 0;
    visible.value = false;
  }
}

async function open(songList: Song[], name: string) {
  visible.value = true;
  songs.value = songList;
  playlistName.value = name;
  exportResult.value = '';
  await loadConfig();
}

defineExpose({ open });
</script>

<style scoped>
  .export-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.export-option:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.option-badge {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  min-width: 0;
}

.option-text strong {
  display: block;
  font-size: 15px;
  font-weight: 700;
}

.option-text span {
  display: block;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 3px;
}

.option-arrow {
  font-size: 22px;
  color: var(--text-3);
}

.export-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 20px 0 10px;
}

.progress-ring {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(var(--accent) calc(var(--p) * 1%), rgba(150, 150, 150, 0.14) 0);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring::before {
  content: '';
  position: absolute;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--surface-solid);
}

.progress-num {
  position: relative;
  font-weight: 700;
  font-size: 22px;
  color: var(--accent);
}

.progress-info {
  text-align: center;
}

.progress-status {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.progress-detail {
  font-size: 13px;
  color: var(--text-3);
  margin-top: 6px;
}

.export-result {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-area :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.vip-card {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(230, 162, 60, 0.12);
  border: 1px solid rgba(230, 162, 60, 0.3);
  margin-bottom: 16px;
}

.vip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.vip-badge {
  padding: 1px 8px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b4513;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
}

.vip-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #b8860b;
}

.form-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-3);
}

.info-card {
  margin-top: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--accent-soft);
  border: 1px solid var(--accent);
}

.info-card strong {
  font-size: 13px;
  color: var(--accent);
}

.info-card ul {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.7;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
}

.history-sub {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 3px;
}

.history-actions {
  flex-shrink: 0;
}

.empty-history {
  padding-top: 40px;
}
</style>
