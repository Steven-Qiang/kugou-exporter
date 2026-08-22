import type { ExportFormat } from '@/utils/export';

export interface ExportRecord {
  id: string;
  time: number;
  playlistName: string;
  format: ExportFormat;
  count: number;
  content: string;
}

const KEY_PREFIX = 'kugou-export-history';
const KEY = KEY_PREFIX;
const MAX = 12;

function storeKey(userid?: string | number): string {
  return userid ? `${KEY_PREFIX}-${userid}` : KEY;
}

export function getExportHistory(userid?: string | number): ExportRecord[] {
  try {
    const raw = localStorage.getItem(storeKey(userid));
    if (!raw) return [];
    const list = JSON.parse(raw) as ExportRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addExportHistory(record: Omit<ExportRecord, 'id' | 'time'>, userid?: string | number): ExportRecord {
  const entry: ExportRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: Date.now(),
    ...record,
  };
  const list = [entry, ...getExportHistory(userid)].slice(0, MAX);
  try {
    localStorage.setItem(storeKey(userid), JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return entry;
}

export function removeExportHistory(id: string, userid?: string | number): ExportRecord[] {
  const list = getExportHistory(userid).filter((item) => item.id !== id);
  try {
    localStorage.setItem(storeKey(userid), JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}

export function clearExportHistory(userid?: string | number): void {
  try {
    localStorage.removeItem(storeKey(userid));
  } catch {
    /* ignore */
  }
}
