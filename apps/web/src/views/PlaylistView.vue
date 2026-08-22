<template>
  <div class="playlist-container">
    <div class="plast-head">
      <div class="header-left">
        <h2>我的歌单</h2>
        <a href="https://github.com/Steven-Qiang/kugou-exporter" target="_blank" class="github-link">
          Steven-Qiang/kugou-exporter@{{ version }}
        </a>
      </div>
      <div v-if="activeAccount" class="user-info">
        <el-avatar :size="30" class="acct-avatar-grad">
          {{ activeAccount.nickname?.charAt(0) || '♪' }}
        </el-avatar>
        <span>{{ activeAccount.nickname || '当前账号' }}</span>
        <el-tag v-if="activeAccount.active" size="small" type="success" round>
          当前
        </el-tag>
      </div>
    </div>

    <div class="playlist-panes">
      <aside class="pane-aside">
        <el-input v-model="searchText" placeholder="搜索歌单" clearable class="search-input" />
        <div v-loading="loading" class="playlist-list">
          <div
            v-for="item in filteredPlaylists"
            :key="item.listid"
            class="playlist-item"
            :class="[{ active: selectedPlaylist?.listid === item.listid }]"
            @click="selectPlaylist(item)"
          >
            <el-image :src="pic(item)" class="playlist-pic" fit="cover" />
            <div class="playlist-info">
              <div class="playlist-name">
                {{ item.name }}
              </div>
              <div class="playlist-count">
                {{ item.count }} 首
              </div>
            </div>
          </div>
          <el-empty v-if="!loading && filteredPlaylists.length === 0" description="该账号暂无歌单" :image-size="60" />
        </div>
      </aside>

      <main class="pane-main">
        <div v-if="selectedPlaylist" v-loading="loadingSongs" class="playlist-detail">
          <div class="detail-header">
            <h3>{{ selectedPlaylist.name }}</h3>
            <el-button type="primary" @click="exportDialogRef?.open(songs, selectedPlaylist.name)">
              导出歌单
            </el-button>
          </div>
          <div class="table-container">
            <el-table :data="songs" stripe>
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="封面" width="70">
                <template #default="{ row }">
                  <el-image :src="pic(row, 120)" class="song-pic" fit="cover" />
                </template>
              </el-table-column>
              <el-table-column prop="name" label="歌曲" sortable />
              <el-table-column prop="albuminfo.name" label="专辑" width="150" sortable />
              <el-table-column prop="collecttime" label="收藏时间" width="180" sortable>
                <template #default="{ row }">
                  {{ formatTime(row.collecttime) }}
                </template>
              </el-table-column>
              <el-table-column prop="timelen" label="时长" width="100" sortable>
                <template #default="{ row }">
                  {{ formatDuration(row.timelen) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button size="small" type="primary" link @click="getSongUrl(row)">
                    获取链接
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <el-empty v-else description="请选择歌单" />
      </main>
    </div>

    <export-dialog ref="exportDialogRef" />
    <song-url-dialog ref="songUrlDialogRef" />
  </div>
</template>

<script setup lang="ts">
import type { Playlist, Song } from '@/types';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import { kugouApi } from '@/api';
import ExportDialog from '@/components/ExportDialog.vue';
import SongUrlDialog from '@/components/SongUrlDialog.vue';
import request from '@/utils/request';
import packageJson from '../../../../package.json';

const version = packageJson.version;

const activeAccount = ref<{ nickname: string; active: boolean } | null>(null);
const loading = ref(false);
const loadingSongs = ref(false);
const searchText = ref('');
const playlists = ref<Playlist[]>([]);
const selectedPlaylist = ref<Playlist | null>(null);
const songs = ref<Song[]>([]);
const exportDialogRef = useTemplateRef('exportDialogRef');
const songUrlDialogRef = useTemplateRef('songUrlDialogRef');

const filteredPlaylists = computed(() => {
  if (!searchText.value) return playlists.value;
  return playlists.value.filter((p) => p.name.includes(searchText.value));
});

function pic(item: any, size = 100): string {
  const p = item.pic || item.create_user_pic || item.cover || '';
  return p ? p.replace('{size}', String(size)) : '';
}

async function loadActiveAccount() {
  try {
    const list = await kugouApi.list();
    activeAccount.value = list.find((a) => a.active) || list[0] || null;
  } catch {
    activeAccount.value = null;
  }
}

async function fetchPlaylists() {
  loading.value = true;
  try {
    await loadActiveAccount();
    const res = await request.get<Playlist & { info: Playlist[] }>('/kugou/playlist');
    playlists.value = res.data.info || [];
    const favorite = playlists.value.find((p) => p.name === '我喜欢');
    if (favorite) {
      selectPlaylist(favorite);
    } else if (playlists.value.length > 0) {
      selectPlaylist(playlists.value[0]);
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('加载歌单失败');
  } finally {
    loading.value = false;
  }
}

async function selectPlaylist(playlist: Playlist) {
  selectedPlaylist.value = playlist;
  songs.value = [];
  loadingSongs.value = true;

  try {
    const allSongs: Song[] = [];
    let currentPage = 1;
    let totalCount = 0;

    while (true) {
      const res = await request.get<any>('/kugou/playlist/tracks', {
        params: { listid: playlist.listid, page: currentPage, pagesize: 100 },
      });
      allSongs.push(...(res.data.info || []));
      totalCount = res.data.count;
      if (allSongs.length >= totalCount) break;
      currentPage++;
    }

    songs.value = [...allSongs].sort((a, b) => a.fsort - b.fsort);
  } catch (error) {
    console.error(error);
    ElMessage.error('加载歌曲失败');
  } finally {
    loadingSongs.value = false;
  }
}

function getSongUrl(song: Song) {
  songUrlDialogRef.value?.open(song, selectedPlaylist.value?.name || '');
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTime(timestamp: number) {
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm');
}

onMounted(() => {
  fetchPlaylists();
});
</script>

<style scoped>
  .playlist-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.plast-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 15px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  color: var(--text-1);
}

.github-link {
  font-size: 13px;
  color: var(--accent);
  text-decoration: none;
}

.github-link:hover {
  text-decoration: underline;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-2);
  font-size: 14px;
}

.acct-avatar-grad {
  background: var(--accent-grad);
  color: #fff;
  font-weight: 700;
}

.playlist-panes {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

.pane-aside {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--border);
}

.search-input {
  flex-shrink: 0;
}

.playlist-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 5px;
}

.playlist-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.16s ease;
  flex-shrink: 0;
  align-items: center;
}

.playlist-item:hover {
  background: var(--surface-hover);
}

.playlist-item.active {
  background: var(--accent-soft);
}

.playlist-item.active .playlist-name {
  color: var(--accent);
  font-weight: 600;
}

.playlist-pic {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  flex-shrink: 0;
  background: var(--surface-muted);
}

.playlist-info {
  flex: 1;
  overflow: hidden;
}

.playlist-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-1);
}

.playlist-count {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
  color: var(--text-3);
}

.pane-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 16px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--border);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-header h3 {
  margin: 0;
  color: var(--text-1);
}

.song-pic {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: var(--surface-muted);
}

.table-container {
  height: calc(100% - 60px);
  overflow-y: auto;
}
</style>
