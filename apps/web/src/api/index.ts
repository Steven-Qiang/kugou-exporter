import request from '@/utils/request';

export interface SessionUser {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: number;
}

export interface KugouAccount {
  id: number;
  kgUserid: string;
  nickname: string;
  active: boolean;
  created_at: number;
  updated_at: number;
}

export interface ExportHistoryItem {
  id: number;
  kugouAccountId: number | null;
  playlistName: string;
  format: string;
  count: number;
  content: string;
  quality: string;
  createdAt: number;
}

export const authApi = {
  setupStatus: () => request.get<{ needsSetup: boolean }>('/auth/setup/status').then((r) => r.data),
  setup: (username: string, password: string) =>
    request.post<{ success: boolean; user: SessionUser }>('/auth/setup', { username, password }).then((r) => r.data),
  login: (username: string, password: string) =>
    request.post<{ success: boolean; user: SessionUser }>('/auth/login', { username, password }).then((r) => r.data),
  logout: () => request.post<{ success: boolean }>('/auth/logout').then((r) => r.data),
  me: () => request.get<{ user: SessionUser }>('/auth/me').then((r) => r.data.user),
};

export const kugouApi = {
  list: () => request.get<{ accounts: KugouAccount[] }>('/kugou').then((r) => r.data.accounts),
  add: (nickname: string) =>
    request.post<{ success: boolean; account: KugouAccount }>('/kugou', { nickname }).then((r) => r.data.account),
  activate: (id: number) => request.post(`/kugou/${id}/activate`).then((r) => r.data),
  rename: (id: number, nickname: string) => request.post(`/kugou/${id}/rename`, { nickname }).then((r) => r.data),
  remove: (id: number) => request.delete(`/kugou/${id}`).then((r) => r.data),
  // 数据接口（服务端直连，前端无需持有酷狗 cookie）
  me: () => request.get('/kugou/me').then((r) => r.data),
  playlist: () => request.get('/kugou/playlist').then((r) => r.data),
  tracks: (listid: number, page = 1, pagesize = 100) =>
    request.get('/kugou/playlist/tracks', { params: { listid, page, pagesize } }).then((r) => r.data),
  songUrl: (hash: string, quality: string) =>
    request.get('/kugou/song/url', { params: { hash, quality } }).then((r) => r.data),
};

export const configApi = {
  get: () =>
    request
      .get<{ serverUrl: string; settings: { quality: string; serverUrl: string } }>('/config/get')
      .then((r) => r.data),
  save: (payload: { serverUrl?: string; quality?: string }) =>
    request.post('/config/save', payload).then((r) => r.data),
};

export const exportApi = {
  /** 后端导出：拉取歌单 → 生成内容 → 自动写入导出历史 */
  run: (payload: { listid: number; format: 'xiaomusic' | 'json' | 'csv'; quality?: string; serverUrl?: string }) =>
    request.post<{ success: boolean; content: string; count: number; playlistName: string }>('/export', payload).then((r) => r.data),
};

export const historyApi = {
  list: () => request.get<{ history: ExportHistoryItem[] }>('/history').then((r) => r.data.history),
  remove: (id: number) => request.delete(`/history/${id}`).then((r) => r.data),
};

export const userApi = {
  changePassword: (oldPassword: string, newPassword: string) =>
    request.post<{ success: boolean }>('/auth/change-password', { oldPassword, newPassword }).then((r) => r.data),
  users: () => request.get<{ users: SessionUser[] }>('/auth/users').then((r) => r.data.users),
  create: (username: string, password: string) =>
    request.post<{ success: boolean; user: SessionUser }>('/auth/users', { username, password }).then((r) => r.data),
  resetPassword: (id: number, password: string) =>
    request.post<{ success: boolean }>(`/auth/users/${id}/reset-password`, { password }).then((r) => r.data),
  remove: (id: number) => request.delete<{ success: boolean }>(`/auth/users/${id}`).then((r) => r.data),
};
