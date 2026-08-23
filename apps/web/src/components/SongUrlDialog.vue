<template>
  <el-dialog v-model="visible" title="歌曲链接" width="680px" top="5vh" @close="handleClose">
    <div v-if="error" class="url-error">
      {{ error }}
    </div>
    <template v-else-if="song">
      <!-- Hero -->
      <div class="song-hero">
        <img v-if="song.cover" :src="replaceImageSize(song.cover, 96)" class="song-cover" alt="">
        <span v-else class="song-cover cover-fallback">{{ song.name?.charAt(0) }}</span>
        <div class="song-meta">
          <div class="song-name" :title="song.name">
            {{ song.name }}
          </div>
          <div class="song-sub">
            <span>{{ artistNames(song) }}</span>
            <span v-if="playlistName" class="sep">·</span>
            <span v-if="playlistName">来自歌单 · {{ playlistName }}</span>
          </div>
        </div>
      </div>

      <!-- Segmented tabs -->
      <div class="seg" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="seg-item"
          :class="{ active: activeTab === t.value }"
          @click="activeTab = t.value"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- 服务器代理 -->
      <div v-if="activeTab === '0'" class="panel">
        <p class="hint">
          播放器请求时，服务器实时获取最新音频地址 · 链接永久有效
        </p>
        <div class="field">
          <span class="field-label">音质</span>
          <quality-select v-model="quality" />
        </div>
        <div class="field">
          <span class="field-label">代理链接</span>
          <el-input :model-value="proxyUrl" readonly class="copy-input">
            <template #append>
              <el-button type="primary" @click="copyUrl(proxyUrl)">
                复制
              </el-button>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 直接链接 -->
      <div v-else-if="activeTab === '1'" class="panel">
        <p class="hint">
          酷狗直链约 2–4 小时过期 · 更推荐使用服务器代理
        </p>
        <div class="field">
          <span class="field-label">音质</span>
          <quality-select v-model="directQuality" />
        </div>
        <div v-loading="loadingDirectUrls" class="links">
          <div v-if="directUrls.length" class="group">
            <div class="group-label">
              主链接
            </div>
            <div v-for="(url, index) in directUrls" :key="index" class="field">
              <span class="field-label">链接 {{ index + 1 }}</span>
              <el-input :model-value="url" readonly class="copy-input">
                <template #append>
                  <el-button type="primary" @click="copyUrl(url)">
                    复制
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
          <div v-if="backupUrls.length" class="group">
            <div class="group-label">
              备用链接
            </div>
            <div v-for="(url, index) in backupUrls" :key="`b-${index}`" class="field">
              <span class="field-label">备用 {{ index + 1 }}</span>
              <el-input :model-value="url" readonly class="copy-input">
                <template #append>
                  <el-button type="primary" @click="copyUrl(url)">
                    复制
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>

      <!-- XiaoMusic -->
      <div v-else-if="activeTab === '2'" class="panel">
        <div class="json-head">
          <span class="json-title">XiaoMusic 单曲 JSON</span>
          <el-button type="primary" round @click="copyUrl(xiaomusicJson)">
            复制 JSON
          </el-button>
        </div>
        <el-input :model-value="xiaomusicJson" type="textarea" :rows="9" readonly class="json-area" />
      </div>

      <!-- 原始 JSON -->
      <div v-else-if="activeTab === '3'" class="panel">
        <div v-loading="loadingRawJson" class="raw-wrap">
          <div class="json-head">
            <span class="json-title">原始 API 响应</span>
            <el-button type="primary" round @click="copyUrl(rawJson)">
              复制 JSON
            </el-button>
          </div>
          <el-input :model-value="rawJson" type="textarea" :rows="9" readonly class="json-area" />
        </div>
      </div>
    </template>
    <div v-else class="url-loading">
      加载中...
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import type { Song, SongUrl } from '@/types';
import { ElMessage } from 'element-plus';
import useClipboard from 'vue-clipboard3';
import { configApi, kugouApi } from '@/api';
import { replaceImageSize } from '@/utils/image';
import request from '@/utils/request';
import QualitySelect from './QualitySelect.vue';

const { toClipboard } = useClipboard();

const tabs = [
  { label: '服务器代理', value: '0' },
  { label: '直接链接', value: '1' },
  { label: 'XiaoMusic', value: '2' },
  { label: '原始 JSON', value: '3' },
];

const visible = ref(false);
const quality = ref('high');
const directQuality = ref('high');
const activeTab = ref('0');
const directUrls = ref<string[]>([]);
const backupUrls = ref<string[]>([]);
const loadingDirectUrls = ref(false);
const loadingRawJson = ref(false);
const rawJson = ref('');
const error = ref('');
const song = ref<Song | null>(null);
const playlistName = ref('');
const serverUrl = ref('');
const activeKgUserid = ref<string>('');

const proxyUrl = computed(() => {
  if (!song.value || !serverUrl.value) return '';
  const base = serverUrl.value.replace(/\/+$/, '');
  const uid = activeKgUserid.value ? `&uid=${encodeURIComponent(activeKgUserid.value)}` : '';
  return `${base}/proxy/song/url?hash=${song.value.hash}&quality=${quality.value}${uid}`;
});

const xiaomusicJson = computed(() => {
  if (!song.value || !serverUrl.value || !playlistName.value) return '';
  return JSON.stringify(
    [
      {
        name: playlistName.value,
        musics: [{ name: song.value.name, url: proxyUrl.value }],
      },
    ],
    null,
    2
  );
});

function artistNames(s: Song): string {
  return s.singerinfo?.map((x) => x.name).join(' / ') || '未知';
}

async function open(s: Song, name: string) {
  visible.value = true;
  error.value = '';
  directUrls.value = [];
  backupUrls.value = [];
  rawJson.value = '';
  activeTab.value = '0';

  try {
    const cfg = await configApi.get();
    serverUrl.value = cfg.serverUrl;
    try {
      const accounts = await kugouApi.list();
      const active = accounts.find((a) => a.active);
      activeKgUserid.value = active?.kgUserid || '';
    } catch {
      activeKgUserid.value = '';
    }
    playlistName.value = name;
    song.value = s;
  } catch (err) {
    error.value = `获取配置失败: ${err}`;
  }
}

async function fetchDirectUrls() {
  if (!song.value) return;
  error.value = '';
  loadingDirectUrls.value = true;
  try {
    const urlRes = await request.get<SongUrl>('/kugou/song/url', {
      params: { hash: song.value.hash, quality: directQuality.value },
    });
    directUrls.value = urlRes.data?.url || [];
    backupUrls.value = urlRes.data?.backupUrl || [];
    if (directUrls.value.length === 0 && backupUrls.value.length === 0) error.value = '该歌曲没有可用链接';
  } catch (err) {
    error.value = `获取链接失败: ${err}`;
  } finally {
    loadingDirectUrls.value = false;
  }
}

async function fetchRawJson() {
  if (!song.value) return;
  error.value = '';
  loadingRawJson.value = true;
  try {
    const urlRes = await request.get<SongUrl>('/kugou/song/url', {
      params: { hash: song.value.hash, quality: directQuality.value },
    });
    rawJson.value = JSON.stringify(urlRes.data, null, 2);
  } catch (err) {
    error.value = `获取链接失败: ${err}`;
  } finally {
    loadingRawJson.value = false;
  }
}

async function copyUrl(url: string) {
  try {
    await toClipboard(url);
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.error('复制失败，请手动复制');
  }
}

function handleClose() {
  visible.value = false;
  directUrls.value = [];
  backupUrls.value = [];
  rawJson.value = '';
  activeTab.value = '0';
  song.value = null;
}

watch(activeTab, (val) => {
  error.value = ''; // 切换 tab 时清掉上一次的错误残留
  if (val === '1' && song.value && directUrls.value.length === 0) fetchDirectUrls();
  if (val === '3' && song.value && !rawJson.value) fetchRawJson();
});

watch(directQuality, () => {
  if (activeTab.value === '1' && song.value) fetchDirectUrls();
  if (activeTab.value === '3' && song.value) fetchRawJson();
});

defineExpose({ open });
</script>

<style scoped>
  .url-error {
  padding: 14px 16px;
  background: rgba(245, 108, 108, 0.12);
  border: 1px solid rgba(245, 108, 108, 0.3);
  border-radius: 12px;
  color: #f56c6c;
  font-size: 13px;
}

.song-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.song-cover {
  width: 72px;
  height: 72px;
  border-radius: 14px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: var(--shadow-1);
}

.song-meta {
  min-width: 0;
}

.song-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-3);
}

.song-sub .sep {
  color: var(--border-strong);
}

.cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  background: var(--accent-grad);
}

.seg {
  display: inline-flex;
  padding: 4px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 18px;
}

.seg-item {
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.seg-item:hover {
  color: var(--text-1);
}

.seg-item.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 4px 12px -4px var(--accent-soft);
}

.panel {
  padding-top: 2px;
}

.hint {
  font-size: 12px;
  color: var(--text-3);
  margin: 0 0 16px;
  line-height: 1.5;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
}

.copy-input {
  width: 100%;
}

.copy-input :deep(input) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.links {
  display: flex;
  flex-direction: column;
}

.group {
  margin-bottom: 8px;
}

.group-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-3);
  margin: 4px 0 12px;
}

.json-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.json-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
}

.json-area {
  width: 100%;
}

.json-area :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.raw-wrap {
  display: flex;
  flex-direction: column;
}

.url-loading {
  text-align: center;
  padding: 20px;
  color: var(--text-3);
}
</style>
