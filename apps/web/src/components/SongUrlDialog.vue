<template>
  <el-dialog v-model="visible" title="歌曲链接" width="680px" top="5vh" @close="handleClose">
    <div v-if="error" class="url-error">
      {{ error }}
    </div>
    <template v-else-if="song">
      <div class="song-header">
        <img v-if="song.cover" :src="replaceImageSize(song.cover, 96)" class="song-head-cover" alt="">
        <span v-else class="cover-fallback">{{ song.name?.charAt(0) }}</span>
        <div class="song-head-info">
          <div class="song-head-name">
            {{ song.name }}
          </div>
          <div class="song-head-artist">
            {{ artistNames(song) }}
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="url-tabs">
        <el-tab-pane label="服务器代理" name="0">
          <div class="url-list">
            <div class="url-item">
              <span class="url-label">音质</span>
              <quality-select v-model="quality" />
            </div>
            <div class="url-item">
              <span class="url-label">代理链接</span>
              <el-input :model-value="proxyUrl" readonly class="copy-field">
                <template #append>
                  <el-button type="primary" @click="copyUrl(proxyUrl)">
                    复制
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="直接链接" name="1">
          <div v-loading="loadingDirectUrls" class="url-list">
            <div class="url-item">
              <span class="url-label">音质</span>
              <quality-select v-model="directQuality" />
            </div>
            <div v-for="(url, index) in directUrls" :key="index" class="url-item">
              <span class="url-label">链接 {{ index + 1 }}</span>
              <el-input :model-value="url" readonly class="copy-field">
                <template #append>
                  <el-button type="primary" @click="copyUrl(url)">
                    复制
                  </el-button>
                </template>
              </el-input>
            </div>
            <div v-for="(url, index) in backupUrls" :key="`backup-${index}`" class="url-item">
              <span class="url-label">备用 {{ index + 1 }}</span>
              <el-input :model-value="url" readonly class="copy-field">
                <template #append>
                  <el-button type="primary" @click="copyUrl(url)">
                    复制
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="XiaoMusic" name="2">
          <div class="url-list">
            <el-input :model-value="xiaomusicJson" type="textarea" :rows="10" readonly class="json-area" />
            <el-button type="primary" style="align-self: flex-end" @click="copyUrl(xiaomusicJson)">
              复制 JSON
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="原始 JSON" name="3">
          <div v-loading="loadingRawJson" class="url-list">
            <el-input :model-value="rawJson" type="textarea" :rows="10" readonly class="json-area" />
            <el-button type="primary" style="align-self: flex-end" @click="copyUrl(rawJson)">
              复制 JSON
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
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
import { replaceImageSize } from '@/utils/image';
import request from '@/utils/request';
import QualitySelect from './QualitySelect.vue';

const { toClipboard } = useClipboard();

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

const proxyUrl = computed(() => {
  if (!song.value || !serverUrl.value) return '';
  return `${serverUrl.value}/proxy/song/url?hash=${song.value.hash}&quality=${quality.value}`;
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
    const configRes = await request.get<{ serverUrl: string }>('/config/get');
    serverUrl.value = configRes.data.serverUrl;
    playlistName.value = name;
    song.value = s;
  } catch (err) {
    error.value = `获取配置失败: ${err}`;
  }
}

async function fetchDirectUrls() {
  if (!song.value) return;
  loadingDirectUrls.value = true;
  try {
    await request.get('/register/dev');
    const urlRes = await request.get<SongUrl>('/song/url', {
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
  loadingRawJson.value = true;
  try {
    await request.get('/register/dev');
    const urlRes = await request.get<SongUrl>('/song/url', {
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

.song-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.song-head-cover {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
}

.song-head-info {
  min-width: 0;
}

.song-head-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-1);
}

.song-head-artist {
  font-size: 13px;
  color: var(--text-3);
  margin-top: 4px;
}

.cover-fallback {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  background: var(--accent-grad);
}

.url-tabs :deep(.el-tabs__item) {
  font-weight: 600;
}

.url-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.url-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.url-label {
  font-weight: 500;
  color: var(--text-2);
  font-size: 13px;
  min-width: 60px;
  text-align: right;
  flex-shrink: 0;
}

.copy-field {
  flex: 1;
}

.copy-field :deep(input) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.json-area :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.url-loading {
  text-align: center;
  padding: 20px;
  color: var(--text-3);
}
</style>
