import type { Express } from 'express';
import type { ExportFormat, Song } from '../lib/export-content';
import kugoumusicapi from 'kugoumusicapi';
import { buildCsvContent, buildProxyUrl, pickList } from '../lib/export-content';
import { requireAuth } from '../middleware/session';
import { addHistory } from '../store/history';
import { getActiveKugouAccount, getActiveKugouCookies } from '../store/kugou';
import { getSettings } from '../store/settings';

async function fetchAllTracks(cookie: Record<string, string>, listid: number): Promise<Song[]> {
  const all: Song[] = [];
  let page = 1;
  let totalCount = 0;
  let emptyStreak = 0;
  const MAX_PAGES = 500;
  while (page <= MAX_PAGES) {
    const resp = await kugoumusicapi.playlist_track_all_new({ cookie, listid, page, pagesize: 100 });
    const info = pickList(resp?.body) as Song[];
    all.push(...info);
    totalCount = Number(resp?.body?.count ?? resp?.body?.data?.count) || 0;
    if (info.length === 0) emptyStreak += 1;
    else emptyStreak = 0;
    // 连续 2 页为空：说明已取尽（或 count 虚高），安全退出避免死循环
    if (emptyStreak >= 2) break;
    if (all.length >= totalCount) break;
    page += 1;
  }
  all.sort((a, b) => (Number(a.fsort) || 0) - (Number(b.fsort) || 0));
  return all;
}

async function findPlaylistName(cookie: Record<string, string>, listid: number): Promise<string> {
  try {
    const resp = await kugoumusicapi.user_playlist({ cookie });
    const lists = pickList(resp?.body) as Array<{ listid?: number; name?: string }>;
    const hit = lists.find((l) => Number(l.listid) === Number(listid));
    return hit?.name || '';
  } catch {
    return '';
  }
}

export function attachExportRoutes(app: Express): void {
  app.post('/export', requireAuth, async (req, res) => {
    const userId = req.userId ?? 0;
    const listid = Number(req.body?.listid);
    const format = String(req.body?.format || 'json') as ExportFormat;
    if (!listid || !['xiaomusic', 'json', 'csv'].includes(format)) {
      res.status(400).json({ success: false, error: '参数错误' });
      return;
    }

    const acct = getActiveKugouAccount(userId);
    if (!acct) {
      res.status(400).json({ success: false, error: '尚未添加或激活酷狗账号' });
      return;
    }
    const cookie = getActiveKugouCookies(userId);
    const settings = getSettings(userId);
    const quality = String(req.body?.quality || settings.quality || 'high');
    const serverUrl = String(req.body?.serverUrl || settings.serverUrl || '').trim();

    try {
      const [songs, playlistName] = await Promise.all([
        fetchAllTracks(cookie, listid),
        findPlaylistName(cookie, listid),
      ]);

      let content = '';
      if (format === 'xiaomusic') {
        const musics = songs.map((song) => ({
          name: song.name || '',
          url: buildProxyUrl(serverUrl, song, quality, acct.kg_userid),
        }));
        content = JSON.stringify([{ name: playlistName || '未命名歌单', musics }], null, 2);
      } else if (format === 'csv') {
        content = buildCsvContent(songs);
      } else {
        content = JSON.stringify(songs, null, 2);
      }

      addHistory(userId, acct.id, playlistName, format, songs.length, content, quality);
      res.json({ success: true, content, count: songs.length, playlistName, format });
    } catch (e: any) {
      console.error('[export] error', e?.message || e);
      res.status(502).json({ success: false, error: '导出失败' });
    }
  });
}
