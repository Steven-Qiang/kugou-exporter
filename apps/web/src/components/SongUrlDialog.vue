<template>
  <el-dialog v-model="visible" title="歌曲链接" width="650px" @close="handleClose">
    <div v-if="error" class="url-error">
      {{ error }}
    </div>
    <div v-else-if="song">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="服务器代理" name="0">
          <div class="url-list">
            <div class="url-item">
              <span class="url-label">音质</span>
              <quality-select v-model="quality" />
            </div>
            <div class="url-item">
              <span class="url-label">代理链接</span>
              <el-input :model-value="proxyUrl" readonly>
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
              <el-input :model-value="url" readonly>
                <template #append>
                  <el-button type="primary" @click="copyUrl(url)">
                    复制
                  </el-button>
                </template>
              </el-input>
            </div>
            <div v-for="(url, index) in backupUrls" :key="`backup-${index}`" class="url-item">
              <span class="url-label">备用 {{ index + 1 }}</span>
              <el-input :model-value="url" readonly>
                <template #append>
                  <el-button type="primary" @click="copyUrl(url)">
                    复制
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="XiaoMusic 格式" name="2">
          <div class="url-list">
            <el-input :model-value="xiaomusicJson" type="textarea" :rows="10" readonly />
            <el-button type="primary" style="margin-top: 10px" @click="copyUrl(xiaomusicJson)">
              复制 JSON
            </el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="原始 JSON" name="3">
          <div v-loading="loadingRawJson" class="url-list">
            <el-input :model-value="rawJson" type="textarea" :rows="10" readonly />
            <el-button type="primary" style="margin-top: 10px" @click="copyUrl(rawJson)">
              复制 JSON
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div v-else class="url-loading">
      加载中...
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import type { Song, SongUrl } from '@/types';
import { ElMessage } from 'element-plus';
import useClipboard from 'vue-clipboard3';
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
        musics: [
          {
            name: song.value.name,
            url: proxyUrl.value,
          },
        ],
      },
    ],
    null,
    2
  );
});

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
    const urlRes = await request.get<SongUrl>('/kugou/song/url', {
      params: { hash: song.value.hash, quality: directQuality.value },
    });
    directUrls.value = urlRes.data?.url || [];
    backupUrls.value = urlRes.data?.backupUrl || [];
    if (directUrls.value.length === 0 && backupUrls.value.length === 0) {
      error.value = '该歌曲没有可用链接';
    }
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
  if (val === '1' && song.value && directUrls.value.length === 0) {
    fetchDirectUrls();
  }
  if (val === '3' && song.value && !rawJson.value) {
    fetchRawJson();
  }
});

watch(directQuality, () => {
  if (activeTab.value === '1' && song.value) {
    fetchDirectUrls();
  }
  if (activeTab.value === '3' && song.value) {
    fetchRawJson();
  }
});

defineExpose({ open });
</script>

<style scoped>
  .url-error {
  padding: 15px;
  background: #fef0f0;
  border-radius: 4px;
  border: 1px solid #fde2e2;
  color: #f56c6c;
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
  color: #606266;
  font-size: 14px;
  min-width: 60px;
  text-align: right;
}

.url-loading {
  text-align: center;
  padding: 20px;
  color: #909399;
}
</style>
