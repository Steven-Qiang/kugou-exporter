export interface Song {
  hash?: string;
  name?: string;
  timelen?: number;
  fsort?: number;
  singerinfo?: Array<{ name?: string }>;
  albuminfo?: { name?: string };
  [key: string]: any;
}

export type ExportFormat = 'xiaomusic' | 'json' | 'csv';

/** 从酷狗响应体里取列表（兼容 { info } / { data: { info } } 等不同包装） */
export function pickList(body: any): any[] {
  if (!body || typeof body !== 'object') return [];
  for (const k of ['info', 'list']) {
    if (Array.isArray(body[k])) return body[k];
    const inner = body[k];
    if (inner && typeof inner === 'object' && Array.isArray(inner.info)) return inner.info;
  }
  if (Array.isArray(body.data)) return body.data;
  return Array.isArray(body.data?.info) ? body.data.info : [];
}

/** 根据服务器地址 + 歌曲 + 音质 + 酷狗 userid 生成对外代理链接 */
export function buildProxyUrl(serverUrl: string, song: Song, quality: string, kgUserid: string): string {
  const base = (serverUrl || '').replace(/\/+$/, '');
  const uid = kgUserid ? `&uid=${encodeURIComponent(kgUserid)}` : '';
  return `${base}/proxy/song/url?hash=${song.hash}&quality=${quality}${uid}`;
}

/** 与前端一致的时长格式：timelen 为毫秒 */
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 生成 CSV 内容（含 BOM + 表头） */
export function buildCsvContent(songs: Song[]): string {
  const headers = ['歌名', '歌手', '专辑', '时长'];
  const rows = songs.map((song) => [
    song.name || '',
    song.singerinfo?.map((x) => x.name).filter(Boolean).join(', ') || '',
    song.albuminfo?.name || '',
    formatDuration(song.timelen ?? 0),
  ]);
  const content = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell)}"`).join(',')).join('\n');
  return `\uFEFF${content}`; // BOM for Excel UTF-8
}
