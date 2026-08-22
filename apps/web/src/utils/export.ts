import type { Song } from '@/types';
import { formatDuration } from '@/utils/format';

export type ExportFormat = 'xiaomusic' | 'json' | 'csv';

export function buildProxyUrl(serverUrl: string, song: Song, quality: string): string {
  const base = serverUrl.replace(/\/+$/, '');
  return `${base}/proxy/song/url?hash=${song.hash}&quality=${quality}`;
}

export function buildCsvContent(songs: Song[]): string {
  const headers = ['歌名', '歌手', '专辑', '时长'];
  const rows = songs.map((song) => [
    song.name,
    song.singerinfo?.map((x) => x.name)?.join(', ') || '',
    song.albuminfo?.name || '',
    formatDuration(song.timelen),
  ]);
  const content = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  return `\uFEFF${content}`; // BOM for Excel UTF-8
}

export function downloadText(content: string, filename: string, mime = 'application/json'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function csvFilename(playlistName: string): string {
  return `${sanitize(playlistName)}.csv`;
}

export function jsonFilename(playlistName: string, format: ExportFormat): string {
  return `${sanitize(playlistName)}.${format === 'csv' ? 'csv' : 'json'}`;
}

function sanitize(name: string): string {
  return (name || 'playlist').replace(/[\\/:*?"<>|]/g, '_');
}
