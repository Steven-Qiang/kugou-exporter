<template>
  <div class="playlist-page">
    <div class="app-body">
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
            :description="hasAccount ? '没有匹配的歌单' : '尚未绑定酷狗账号'"
            :image-size="72"
          />
        </div>
      </aside>

      <main class="main">
        <div class="page-toolbar">
          <span class="toolbar-label">当前账号</span>
          <el-dropdown v-if="activeAccount" trigger="click" @command="handleAccountCommand">
            <div class="toolbar-chip">
              <el-avatar :size="26" class="chip-avatar" :src="avatarSrc(activeAccount)">
                {{ firstNick(profile(activeAccount).nickname || activeAccount.nickname) }}
              </el-avatar>
              <span class="chip-name">{{ profile(activeAccount).nickname || activeAccount.nickname || '当前账号' }}</span>
              <el-icon class="chip-arrow">
                <arrow-down />
              </el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="accounts">
                  <span class="menu-item">管理酷狗账号</span>
                </el-dropdown-item>
                <el-dropdown-item
                  v-for="acct in accountList"
                  :key="acct.id"
                  :command="{ type: 'switch', id: acct.id }"
                  :disabled="String(acct.id) === String(activeAccount?.id)"
                >
                  <span class="menu-item-menu">
                    <img
                      v-if="profile(acct).pic"
                      :src="avatarSrc(acct)"
                      class="menu-avatar menu-avatar-img"
                      alt=""
                    >
                    <span v-else class="menu-avatar">{{ firstNick(profile(acct).nickname || acct.nickname) }}</span>
                    <span class="menu-name">{{ profile(acct).nickname || acct.nickname || `账号 ${acct.id}` }}</span>
                    <span
                      v-if="profile(acct).vipType > 0"
                      class="vip-dot"
                      :title="vipLabel(profile(acct).vipType)"
                    >
                      VIP
                    </span>
                    <el-tag v-if="String(acct.id) === String(activeAccount?.id)" size="small" type="success" round>
                      当前
                    </el-tag>
                  </span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 加载中：不显示空态引导，避免误导 -->
        <div v-if="loading" class="main-loading">
          <el-icon class="is-loading" :size="36">
            <loading-icon />
          </el-icon>
          <span class="muted">正在加载歌单...</span>
        </div>

        <template v-else-if="selectedPlaylist">
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
        <div v-else class="main-empty">
          <div class="empty-guide">
            <div class="empty-icon grad-icon">
              <svg
                viewBox="0 0 24 24"
                width="30"
                height="30"
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
            <h2>
              {{ hasAccount ? '开始浏览你的歌单' : '还没有绑定酷狗账号' }}
            </h2>
            <p class="muted">
              {{
                hasAccount
                  ? '从左侧选择歌单，查看歌曲并一键导出'
                  : '连接你的酷狗账号后，歌单会自动同步到这里，可一键导出到小爱音箱等播放器'
              }}
            </p>
            <el-button
              v-if="!hasAccount"
              class="grad-btn"
              type="primary"
              size="large"
              @click="router.push('/accounts')"
            >
              去账号管理连接
            </el-button>
          </div>
        </div>
      </main>
    </div>

    <export-dialog ref="exportDialogRef" />
    <song-url-dialog ref="songUrlDialogRef" />
  </div>
</template>

<script setup lang="ts">
import type { KugouAccount } from '@/api';
import type { AccountProfile, Playlist, Song } from '@/types';
import { ArrowDown, Download, Loading as LoadingIcon, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { kugouApi } from '@/api';
import ExportDialog from '@/components/ExportDialog.vue';
import SongUrlDialog from '@/components/SongUrlDialog.vue';
import { formatDuration, totalDurationSeconds, uniqueArtists } from '@/utils/format';
import { replaceImageSize } from '@/utils/image';
import request from '@/utils/request';

const router = useRouter();

const isMobile = ref(false);
function updateIsMobile() {
  isMobile.value = window.innerWidth <= 760;
}

const activeAccount = ref<KugouAccount | null>(null);
const accountList = ref<KugouAccount[]>([]);
const accountDetails = ref<Record<number, AccountProfile>>({});
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

const stats = computed(() => ({ duration: durationLabel(), artists: uniqueArtists(songs.value) }));

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
  return { backgroundImage: `url(${replaceImageSize(pic, 600)})` };
});

function coverSrc(p: Playlist): string {
  const pic = p.pic || p.create_user_pic || '';
  return pic ? replaceImageSize(pic, 200) : '';
}

function artistNames(s: Song): string {
  return s.singerinfo?.map((x) => x.name).join(' / ') || '未知';
}

function firstNick(name?: string): string {
  return name?.charAt(0) || '♪';
}

const EMPTY_PROFILE: AccountProfile = { vipType: 0 };

function profile(acct?: KugouAccount | null): AccountProfile {
  return (acct && accountDetails.value[acct.id]) || EMPTY_PROFILE;
}

function avatarSrc(acct?: KugouAccount | null): string {
  const pic = profile(acct).pic;
  return pic ? replaceImageSize(pic, 64) : '';
}

function vipLabel(type: number): string {
  if (!(type > 0)) return '';
  return type === 1 ? '豪华 VIP' : `酷狗会员 Lv${type}`;
}

async function loadAccountDetails() {
  const map: Record<number, AccountProfile> = {};
  await Promise.allSettled(
    accountList.value.map(async (acct) => {
      try {
        const res = await kugouApi.accountDetail(acct.id);
        if (res.success && res.profile) map[acct.id] = res.profile;
      } catch {
        /* ignore */
      }
    })
  );
  accountDetails.value = map;
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
  await loadAccountDetails();
}

async function fetchPlaylists() {
  // 切换账号/进入页面时先清空旧数据，避免加载期间短暂显示上一个账号的歌单（“错误显示别的数据”）
  playlists.value = [];
  selectedPlaylist.value = null;
  songs.value = [];
  loading.value = true;
  try {
    await loadAccounts();
    const res = await request.get<Playlist & { info: Playlist[] }>('/kugou/playlist');
    playlists.value = res.data.info || [];
    const favorite = playlists.value.find((p) => p.name === '我喜欢');
    if (favorite) selectPlaylist(favorite);
    else if (playlists.value.length) selectPlaylist(playlists.value[0]);
  } catch (e: any) {
    playlists.value = [];
    selectedPlaylist.value = null;
    songs.value = [];
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
    let emptyStreak = 0;
    // 安全上限：酷狗可能对超页请求返回空 info 但 count 不变，需防死循环。
    const MAX_PAGES = 500;
    while (currentPage <= MAX_PAGES) {
      const res = await request.get<{ info: Song[]; count: number }>('/kugou/playlist/tracks', {
        params: { listid: playlist.listid, page: currentPage, pagesize: 100 },
      });
      const pageSongs = res.data.info || [];
      allSongs.push(...pageSongs);
      totalCount = res.data.count;
      if (pageSongs.length === 0) emptyStreak += 1;
      else emptyStreak = 0;
      // 连续 2 页为空：说明已取尽（或 count 虚高），安全退出避免死循环
      if (emptyStreak >= 2) break;
      if (allSongs.length >= totalCount) break;
      currentPage += 1;
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
  exportDialogRef.value?.open(selectedPlaylist.value?.listid ?? 0, selectedPlaylist.value?.name || '');
}

function openSong(song: Song) {
  songUrlDialogRef.value?.open(song, selectedPlaylist.value?.name || '');
}

async function handleAccountCommand(command: string | { type: string; id?: number }) {
  const type = typeof command === 'string' ? command : command?.type;
  if (type === 'switch' && typeof command === 'object' && command.id) {
    try {
      await kugouApi.activate(command.id);
      ElMessage.success('已切换账号');
      await fetchPlaylists();
    } catch (error) {
      console.error(error);
      ElMessage.error('切换账号失败');
    }
  } else if (type === 'accounts') {
    router.push('/accounts');
  }
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
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 内容区顶部：当前酷狗账号切换 */
.page-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-3);
}

.toolbar-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 5px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.toolbar-chip:hover {
  border-color: var(--accent);
  background: var(--surface-hover);
}

.chip-avatar {
  background: var(--accent-grad);
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
}

.chip-name {
  font-size: 13px;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-arrow {
  color: var(--text-3);
  font-size: 13px;
}

:deep(.el-dropdown-menu__item) {
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 14px;
  margin: 0 6px;
}

:deep(.el-dropdown-menu__item:not(.is-disabled):hover) {
  background: var(--accent-soft);
  color: var(--accent);
}

.menu-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.menu-item-menu {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.menu-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9px;
  background: var(--accent-grad);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

/* 头像图片：复用 .menu-avatar 尺寸/圆角 */
.menu-avatar-img {
  display: block;
  padding: 0;
  overflow: hidden;
  background: var(--surface-muted);
  object-fit: cover;
}

/* 下拉里的 VIP 小标记 */
.vip-dot {
  flex-shrink: 0;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.6;
  color: #7c4dff;
  background: rgba(124, 77, 255, 0.14);
  border: 1px solid rgba(124, 77, 255, 0.35);
}

.menu-name {
  max-width: 140px;
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

/* 加载中：居中 spinner + 文案 */
.main-loading {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 13px;
}

/* 空态引导卡 */
.empty-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  padding: 40px 28px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-1);
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  margin-bottom: 4px;
}

.empty-guide h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-1);
}

.empty-guide p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
}

.empty-guide .el-button {
  margin-top: 12px;
  height: 42px;
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
