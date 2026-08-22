<template>
  <div class="playlist-page">
    <!-- Top bar -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="app-brand grad-icon">
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
        </div>
        <div class="brand-text">
          <strong>酷狗歌单导出</strong>
          <span>KUGOU EXPORTER</span>
        </div>
        <button v-if="inDemo" class="demo-badge" title="退出演示模式" @click="exitDemo">
          演示模式 · 退出
        </button>
      </div>

      <div class="topbar-right">
        <theme-toggle />
        <a class="icon-link" href="https://github.com/Steven-Qiang/kugou-exporter" target="_blank" title="GitHub">
          <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
        </a>
        <el-dropdown v-if="activeAccount" trigger="click" @command="handleAccountCommand">
          <div class="user-chip">
            <el-avatar :size="32" class="acct-avatar-grad">{{ activeAccount.nickname?.charAt(0) || '♪' }}</el-avatar>
            <span class="user-name">{{ activeAccount.nickname || '当前账号' }}</span>
            <el-icon class="dropdown-arrow">
              <arrow-down />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="appUser" divided :command="{ type: 'accounts' }">
                <span>管理酷狗账号</span>
              </el-dropdown-item>
              <el-dropdown-item v-for="acct in accountList" :key="acct.id" :command="{ type: 'switch', id: acct.id }"
                :disabled="String(acct.id) === String(activeAccount?.id)"
              >
                <span class="account-item">
                  <span>{{ acct.nickname || `账号 ${acct.id}` }}</span>
                  <el-tag v-if="String(acct.id) === String(activeAccount?.id)" size="small" type="success">当前</el-tag>
                </span>
              </el-dropdown-item>
              <el-dropdown-item divided :command="{ type: 'logout' }">
                <span class="danger-text">退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="app-body">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-search">
          <el-input v-model="searchText" placeholder="搜索歌单" clearable :prefix-icon="Search" />
        </div>
        <div v-loading="loading" class="playlist-list">
          <div
            v-for="item in filteredPlaylists"
            :key="item.listid"
            class="playlist-card"
            :class="{ active: selectedPlaylist?.listid === item.listid }"
            @click="selectPlaylist(item)"
          >
            <div class="playlist-cover">
              <img v-if="item.pic || item.create_user_pic" :src="coverSrc(item)" alt="">
              <span v-else class="cover-fallback">{{ item.name?.charAt(0) }}</span>
            </div>
            <div class="playlist-meta">
              <div class="playlist-name">
                {{ item.name }}
              </div>
              <div class="playlist-count">
                {{ item.count }} 首
              </div>
            </div>
          </div>
          <el-empty
            v-if="!loading && filteredPlaylists.length === 0"
            :description="hasAccount ? '没有匹配的歌单' : '尚未绑定酷狗账号，请先到账号管理页添加'"
            :image-size="72"
          />
        </div>
      </aside>

      <!-- Main -->
      <main class="main">
        <template v-if="selectedPlaylist">
          <div class="banner" :style="bannerStyle">
            <div class="banner-overlay" />
            <div class="banner-cover">
              <img
                v-if="selectedPlaylist.pic || selectedPlaylist.create_user_pic"
                :src="coverSrc(selectedPlaylist)"
                alt=""
              >
              <span v-else class="cover-fallback lg">{{ selectedPlaylist.name?.charAt(0) }}</span>
            </div>
            <div class="banner-info">
              <div class="banner-type">
                歌单
              </div>
              <h1>{{ selectedPlaylist.name }}</h1>
              <p v-if="selectedPlaylist.intro" class="banner-intro">
                {{ selectedPlaylist.intro }}
              </p>
              <div class="banner-stats">
                <span>{{ selectedPlaylist.count }} 首歌曲</span>
                <span class="dot">·</span>
                <span>{{ stats.duration }}</span>
                <span class="dot">·</span>
                <span>{{ stats.artists }} 位歌手</span>
              </div>
              <div class="banner-actions">
                <el-button class="grad-btn" type="primary" size="large" :icon="Download" @click="openExport">
                  导出歌单
                </el-button>
                <el-button size="large" plain :icon="Refresh" @click="refreshSongs">
                  刷新
                </el-button>
              </div>
            </div>
          </div>

          <div class="song-section">
            <div class="song-toolbar">
              <el-input
                v-model="songSearch"
                placeholder="搜索歌名 / 歌手 / 专辑"
                clearable
                :prefix-icon="Search"
                class="song-search"
              />
              <span class="song-total">{{ filteredSongs.length }} / {{ songs.length }} 首</span>
            </div>

            <div v-loading="loadingSongs" class="song-table-wrap">
              <el-table
                :data="filteredSongs"
                class="song-table"
                :header-cell-style="{ background: 'var(--surface-muted)' }"
              >
                <el-table-column type="index" label="#" :width="isMobile ? 44 : 52" align="center" />
                <el-table-column label="歌曲" :min-width="isMobile ? 150 : 220" show-overflow-tooltip>
                  <template #default="{ row }">
                    <div class="song-cell">
                      <img v-if="row.cover" :src="replaceImageSize(row.cover, 64)" class="song-cover" alt="">
                      <span v-else class="cover-fallback sm">{{ row.name?.charAt(0) }}</span>
                      <div class="song-title">
                        {{ row.name }}
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="歌手" :min-width="isMobile ? 96 : 120" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span class="cell-ellipsis">{{ artistNames(row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  v-if="!isMobile"
                  prop="albuminfo.name"
                  label="专辑"
                  min-width="140"
                  show-overflow-tooltip
                />
                <el-table-column v-if="!isMobile" label="时长" width="90" align="center">
                  <template #default="{ row }">
                    {{ formatDuration(row.timelen) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" :width="isMobile ? 96 : 110" align="center">
                  <template #default="{ row }">
                    <el-button size="small" type="primary" link @click="openSong(row)">
                      获取链接
                    </el-button>
                  </template>
                </el-table-column>
                <template #empty>
                  <el-empty :description="loadingSongs ? '加载中...' : '该歌单暂无歌曲'" :image-size="90" />
                </template>
              </el-table>
            </div>
          </div>
        </template>
        <el-empty v-else class="main-empty" :description="hasAccount ? '左侧选择歌单开始浏览' : '尚未绑定酷狗账号'" :image-size="120">
          <template #description>
            <p class="muted">
              {{ hasAccount ? '选择左侧歌单，查看歌曲并一键导出' : '请先到账号管理页添加并激活你的酷狗账号' }}
            </p>
          </template>
        </el-empty>
      </main>
    </div>

    <export-dialog ref="exportDialogRef" />
    <song-url-dialog ref="songUrlDialogRef" />
  </div>
</template>

<script setup lang="ts">
import type { Playlist, Song } from '@/types';
import { ArrowDown, Download, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import ExportDialog from '@/components/ExportDialog.vue';
import SongUrlDialog from '@/components/SongUrlDialog.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { kugouApi, type KugouAccount } from '@/api';
import { useAuth } from '@/stores/auth';
import { formatDuration, totalDurationSeconds, uniqueArtists } from '@/utils/format';
import { replaceImageSize } from '@/utils/image';
import { disableDemo, isDemo } from '@/utils/mock';
import request from '@/utils/request';

const router = useRouter();
const { user: appUser, logout } = useAuth();
const inDemo = isDemo();

// Responsive: compact the song table on phones.
const isMobile = ref(false);
function updateIsMobile() {
  isMobile.value = window.innerWidth <= 760;
}

const activeAccount = ref<KugouAccount | null>(null);
const accountList = ref<KugouAccount[]>([]);
const hasAccount = ref(false);
const loading = ref(false);
const loadingSongs = ref(false);
const searchText = ref('');
const songSearch = ref('');
const playlists = ref<Playlist[]>([]);
const selectedPlaylist = ref<Playlist | null>(null);
const songs = ref<Song[]>([]);
const exportDialogRef = useTemplateRef('exportDialogRef');
const songUrlDialogRef = useTemplateRef('songUrlDialogRef');

const filteredPlaylists = computed(() => {
  if (!searchText.value) return playlists.value;
  return playlists.value.filter((p) => p.name.includes(searchText.value));
});

const filteredSongs = computed(() => {
  if (!songSearch.value) return songs.value;
  const q = songSearch.value.toLowerCase();
  return songs.value.filter((s) => {
    const artists = artistNames(s).toLowerCase();
    const album = s.albuminfo?.name?.toLowerCase() || '';
    return s.name.toLowerCase().includes(q) || artists.includes(q) || album.includes(q);
  });
});

const stats = computed(() => ({
  duration: durationLabel(),
  artists: uniqueArtists(songs.value),
}));

function durationLabel(): string {
  const total = totalDurationSeconds(songs.value);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h} 时 ${m} 分`;
  return `${m} 分钟`;
}

const bannerStyle = computed(() => {
  const pic = selectedPlaylist.value?.pic || selectedPlaylist.value?.create_user_pic || '';
  if (!pic) return {};
  const url = replaceImageSize(pic, 600);
  return { backgroundImage: `url(${url})` };
});

function coverSrc(p: Playlist): string {
  const pic = p.pic || p.create_user_pic || '';
  return pic ? replaceImageSize(pic, 200) : '';
}

function artistNames(s: Song): string {
  return s.singerinfo?.map((x) => x.name).join(' / ') || '未知';
}

async function loadAccounts() {
  try {
    const list = await kugouApi.list();
    accountList.value = list;
    activeAccount.value = list.find((a) => a.active) || list[0] || null;
    hasAccount.value = list.length > 0;
  } catch {
    accountList.value = [];
    activeAccount.value = null;
    hasAccount.value = false;
  }
}

async function fetchPlaylists() {
  loading.value = true;
  try {
    await loadAccounts();
    const res = await request.get<Playlist & { info: Playlist[] }>('/kugou/playlist');
    playlists.value = res.data.info || [];
    const favorite = playlists.value.find((p) => p.name === '我喜欢');
    if (favorite) selectPlaylist(favorite);
    else if (playlists.value.length) selectPlaylist(playlists.value[0]);
  } catch (e: any) {
    // 尚未绑定/激活酷狗账号时：显示友好空态，不弹红色错误
    playlists.value = [];
    if (e?.response?.status !== 401 && e?.response?.data?.code !== 401) {
      ElMessage.error('加载歌单失败');
    }
  } finally {
    loading.value = false;
  }
}

async function selectPlaylist(playlist: Playlist) {
  selectedPlaylist.value = playlist;
  songs.value = [];
  songSearch.value = '';
  loadingSongs.value = true;

  try {
    const allSongs: Song[] = [];
    let currentPage = 1;
    let totalCount = 0;

    while (true) {
      const res = await request.get<{ info: Song[]; count: number }>('/kugou/playlist/tracks', {
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

async function refreshSongs() {
  if (selectedPlaylist.value) await selectPlaylist(selectedPlaylist.value);
}

function openExport() {
  exportDialogRef.value?.open(songs.value, selectedPlaylist.value?.name || '');
}

function openSong(song: Song) {
  songUrlDialogRef.value?.open(song, selectedPlaylist.value?.name || '');
}

async function handleAccountCommand(command: { type: string; id?: number }) {
  if (command.type === 'switch' && command.id) {
    try {
      await kugouApi.activate(command.id);
      ElMessage.success('已切换账号');
      location.reload();
    } catch (error) {
      console.error(error);
      ElMessage.error('切换账号失败');
    }
  } else if (command.type === 'accounts') {
    router.push('/accounts');
  } else if (command.type === 'logout') {
    await logout();
    router.push('/login');
  }
}

function exitDemo() {
  disableDemo();
  ElMessage.success('已退出演示模式');
  router.push('/login');
}

onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);
  fetchPlaylists();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
});
</script>

<style scoped>
  .playlist-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  background: var(--surface);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--border);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-brand {
  width: 38px;
  height: 38px;
  border-radius: 12px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-text strong {
  font-size: 15px;
  font-weight: 700;
}

.brand-text span {
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--text-3);
}

.demo-badge {
  margin-left: 8px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-radius: 20px;
  font-family: inherit;
  line-height: 1.4;
  cursor: pointer;
  transition: all 0.15s ease;
}

.demo-badge:hover {
  background: var(--accent);
  color: #fff;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
  transition: all 0.18s ease;
}

.icon-link:hover {
  color: var(--accent);
  background: var(--surface-hover);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.user-chip:hover {
  border-color: var(--accent);
  background: var(--surface-hover);
}

.acct-avatar-grad {
  background: var(--accent-grad);
  color: #fff;
  font-weight: 700;
}

.dropdown-arrow {
  color: var(--text-3);
  font-size: 13px;
}

.account-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.danger-text {
  color: #f56c6c;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 14px;
  border-right: 1px solid var(--border);
  background: var(--surface-muted);
  overflow: hidden;
}

.sidebar-search {
  flex-shrink: 0;
}

.playlist-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}

.playlist-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.18s ease;
}

.playlist-card:hover {
  background: var(--surface-hover);
}

.playlist-card.active {
  background: var(--accent-soft);
  border-color: var(--accent);
}

.playlist-cover {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--border);
}

.playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
  color: #fff;
  background: var(--accent-grad);
}

.cover-fallback.sm {
  font-size: 14px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.cover-fallback.lg {
  font-size: 40px;
  border-radius: 18px;
}

.playlist-meta {
  flex: 1;
  min-width: 0;
}

.playlist-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-count {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 22px;
}

.banner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 28px;
  border-radius: 20px;
  overflow: hidden;
  color: #fff;
  background-size: cover;
  background-position: center;
  box-shadow: var(--shadow-1);
  min-height: 236px;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, rgba(24, 22, 20, 0.85) 0%, rgba(46, 36, 26, 0.72) 100%);
}

.banner:empty::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent-grad);
}

.banner-cover {
  width: 150px;
  height: 150px;
  border-radius: 18px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.banner-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.banner-info {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.banner-type {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  opacity: 0.85;
  margin-bottom: 6px;
}

.banner-info h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-intro {
  margin: 0 0 10px;
  font-size: 13px;
  opacity: 0.9;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.95;
  margin-bottom: 16px;
}

.dot {
  opacity: 0.7;
}

.banner-actions {
  display: flex;
  gap: 10px;
}

.song-section {
  margin-top: 20px;
}

.song-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.song-search {
  max-width: 360px;
}

.song-total {
  font-size: 13px;
  color: var(--text-3);
  white-space: nowrap;
  flex-shrink: 0;
}

.song-table-wrap {
  border-radius: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--border);
  background: var(--surface);
}

.song-table {
  width: 100%;
}

.song-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.song-cover {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.song-title {
  font-weight: 600;
  color: var(--text-1);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-ellipsis {
  display: block;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (max-width: 900px) {
  .sidebar {
    width: 220px;
  }

  .banner-cover {
    width: 110px;
    height: 110px;
  }

  .banner-info h1 {
    font-size: 22px;
  }
}

@media (max-width: 760px) {
  .topbar {
    padding: 0 12px;
  }

  .brand-text span,
  .demo-badge,
  .icon-link,
  .user-name {
    display: none;
  }

  .app-body {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    flex: none;
    border-right: none;
    border-bottom: 1px solid var(--border);
    padding: 12px;
  }

  .sidebar-search {
    margin-bottom: 10px;
  }

  .playlist-list {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .playlist-card {
    min-width: 150px;
    flex-shrink: 0;
  }

  .main {
    padding: 14px;
  }

  .banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .banner-actions {
    flex-wrap: wrap;
  }

  .song-table-wrap {
    overflow-x: auto;
  }
}
</style>
