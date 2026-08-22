<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    top="20px"
    :close-on-click-modal="!exporting"
    :close-on-press-escape="!exporting"
    width="600px"
    @close="handleClose"
  >
    <div v-if="!exporting && !exportResult">
      <div class="export-buttons">
        <div class="export-button-item">
          <el-button type="primary" @click="showXiaomusicConfig">
            导出 XiaoMusic 格式
          </el-button>
          <div class="button-desc">
            适用于 XiaoMusic，包含歌名和服务器代理链接，链接永久有效
          </div>
        </div>
        <div class="export-button-item">
          <el-button type="success" @click="handleExport('json')">
            导出原始 JSON
          </el-button>
          <div class="button-desc">
            完整的歌曲元数据，包含专辑、歌手、时长等信息，不包含播放链接
          </div>
        </div>
        <div class="export-button-item">
          <el-button type="info" @click="handleExport('csv')">
            导出 CSV
          </el-button>
          <div class="button-desc">
            表格格式，包含歌名、歌手、专辑、时长，可用 Excel 打开
          </div>
        </div>
      </div>
    </div>
    <div v-if="exporting">
      <el-progress :percentage="exportProgress" :stroke-width="20" />
      <div class="export-info">
        <div class="export-status">
          {{ exportStatus }}
        </div>
        <div v-if="exportDetail.totalSongs > 0" class="export-detail">
          <div>总歌曲数: {{ exportDetail.totalSongs }}</div>
          <div v-if="exportDetail.currentSong">
            当前: {{ exportDetail.currentSong }}
          </div>
          <div v-if="exportDetail.fetchedCount > 0">
            已处理: {{ exportDetail.fetchedCount }}/{{ exportDetail.totalSongs }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="exportResult" class="export-result">
      <el-input v-model="exportResult" type="textarea" :rows="15" readonly />
      <div class="export-actions">
        <el-button type="primary" @click="copyResult">
          复制
        </el-button>
        <el-button type="success" @click="downloadResult">
          下载
        </el-button>
      </div>
    </div>
  </el-dialog>
  <el-dialog v-model="configVisible" title="导出 XiaoMusic 格式" width="600px" top="20px">
    <div v-if="vipInfo" class="vip-section">
      <p class="vip-title">
        VIP 信息
      </p>
      <div class="vip-content">
        <span>当前账号：{{ vipInfo.nickname }}</span>
        <span v-if="vipInfo.vip_type > 0" class="vip-badge">VIP</span>
      </div>
      <p class="vip-tip">
        高品质音频可能需要 VIP 会员才能获取
      </p>
    </div>
    <el-form :model="form" label-width="100px">
      <el-form-item label="服务器地址">
        <el-input v-model="form.serverUrl" placeholder="http://127.0.0.1:3000" />
        <div class="form-tip">
          本项目启动后的服务地址（本机/局域网/公网/Docker），播放时需保持服务器运行
        </div>
      </el-form-item>
      <el-form-item label="音质">
        <quality-select v-model="form.quality" />
      </el-form-item>
    </el-form>
    <div class="info-section">
      <p class="info-title">
        代理链接说明
      </p>
      <ul class="info-list">
        <li>导出的播放链接为服务代理地址</li>
        <li>当XiaoMusic请求代理链接时，服务器实时调用酷狗音乐 API 获取最新的音频文件地址</li>
        <li>解决了酷狗音乐直接链接具有时效性（通常 2-4 小时）的问题</li>
        <li>代理链接永久有效，但需要保持本项目服务器处于运行状态</li>
        <li>支持内网、外网、Docker 等多种部署方式，只需确保XiaoMusic能访问服务器地址</li>
      </ul>
    </div>
    <template #footer>
      <el-button @click="configVisible = false">
        取消
      </el-button>
      <el-button type="primary" @click="confirmExport">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { Song, XiaomusicPlaylist, XiaomusicSong } from '@/types';
import { ElMessage } from 'element-plus';
import useClipboard from 'vue-clipboard3';
import request from '@/utils/request';
import QualitySelect from './QualitySelect.vue';

const { toClipboard } = useClipboard();

const visible = ref(false);
const configVisible = ref(false);
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

const dialogTitle = computed(() => {
  if (exporting.value) return '导出进度';
  if (exportResult.value) return '导出结果';
  return '导出歌单';
});

async function loadConfig() {
  try {
    const res = await request.get<{ serverUrl: string }>('/config/get');
    form.value.serverUrl = res.data.serverUrl;
    form.value.quality = (res.data as any)?.settings?.quality || 'high';
    // 账号昵称 + VIP 信息（多租户后端通过 /kugou/me 取）
    try {
      const me = await request.get<any>('/kugou/me');
      const u = me?.data?.data?.userinfo || me?.data?.data?.info || me?.data?.data || me?.data;
      if (u?.nickname || u?.nickname2) {
        vipInfo.value = {
          nickname: u.nickname || u.nickname2 || '当前账号',
          vip_type: Number(u.vip_type) || 0,
        };
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

async function confirmExport() {
  if (!form.value.serverUrl) {
    ElMessage.warning('请填写服务器地址');
    return;
  }

  try {
    await request.post('/config/save', form.value);
  } catch {
    ElMessage.error('保存配置失败');
    return;
  }

  configVisible.value = false;
  await handleExport('xiaomusic');
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
        const url = `${form.value.serverUrl}/proxy/song/url?hash=${song.hash}&quality=${form.value.quality}`;
        xiaomusicSongs.push({ name: song.name, url });
        exportDetail.value.successCount++;
        exportProgress.value = Math.floor(((i + 1) / sortedSongs.length) * 100);
        exportStatus.value = `正在生成链接 ${i + 1}/${sortedSongs.length}`;
      }
      const xiaomusicData: XiaomusicPlaylist[] = [{ name: playlistName.value, musics: xiaomusicSongs }];
      exportResult.value = JSON.stringify(xiaomusicData, null, 2);
    } else if (type === 'json') {
      exportResult.value = JSON.stringify(sortedSongs, null, 2);
      exportProgress.value = 100;
      exportDetail.value.successCount = sortedSongs.length;
    } else if (type === 'csv') {
      const headers = ['歌名', '歌手', '专辑', '时长'];
      const rows = sortedSongs.map((song) => [
        song.name,
        song.singerinfo?.map((x) => x.name)?.join(', ') || '',
        song.albuminfo?.name || '',
        formatDuration(song.timelen),
      ]);
      const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${playlistName.value}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      exportProgress.value = 100;
      exportDetail.value.successCount = sortedSongs.length;
      exportStatus.value = '导出完成！';
      ElMessage.success(`导出成功！共 ${exportDetail.value.successCount} 首歌曲`);
      handleClose();
      return;
    }

    exportStatus.value = '导出完成！';
    exportProgress.value = 100;
    ElMessage.success(`导出成功！共 ${exportDetail.value.successCount} 首歌曲`);
  } catch (error) {
    console.error(error);
    ElMessage.error('导出失败');
    handleClose();
  } finally {
    exporting.value = false;
  }
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  const blob = new Blob([exportResult.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = currentExportType.value === 'csv' ? 'csv' : 'json';
  a.download = `${playlistName.value}.${ext}`;
  a.click();
  ElMessage.success('下载成功');
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
  .form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.info-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #ecf5ff;
  border-radius: 4px;
  border: 1px solid #d9ecff;
}

.info-title {
  margin: 0 0 10px 0;
  font-weight: 500;
  color: #409eff;
  font-size: 14px;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
}

.vip-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #fff7e6;
  border-radius: 4px;
  border: 1px solid #ffe7ba;
}

.vip-title {
  margin: 0 0 10px 0;
  font-weight: 500;
  color: #e6a23c;
  font-size: 14px;
}

.vip-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 13px;
}

.vip-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b4513;
  font-size: 12px;
  font-weight: bold;
  border-radius: 4px;
}

.vip-tip {
  margin: 0;
  color: #e6a23c;
  font-size: 12px;
}

.export-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.export-button-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-button-item .el-button {
  width: 100%;
}

.button-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  padding-left: 4px;
}

.export-info {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.export-status {
  margin-bottom: 10px;
  font-weight: 500;
  color: #303133;
}

.export-detail {
  font-size: 14px;
  color: #606266;
}

.export-result {
  margin-top: 20px;
}

.export-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
