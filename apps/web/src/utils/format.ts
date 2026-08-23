import type { Song } from '@/types';

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function uniqueArtists(songs: Song[]): number {
  const set = new Set<string>();
  for (const s of songs)
    set.add(s.singerinfo?.map((x) => x.name).join('/') || '');
  return set.size;
}

export function totalDurationSeconds(songs: Song[]): number {
  return songs.reduce((sum, s) => sum + (s.timelen || 0), 0) / 1000;
}
