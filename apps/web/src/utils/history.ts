import type { ExportFormat } from '@/utils/export';

export interface ExportRecord {
  id: string;
  time: number;
  playlistName: string;
  format: ExportFormat;
  count: number;
  content: string;
}

const KEY = 'kugou-export-history';
const MAX = 12;

export function getExportHistory(): ExportRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ExportRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addExportHistory(record: Omit<ExportRecord, 'id' | 'time'>): ExportRecord {
  const entry: ExportRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: Date.now(),
    ...record,
  };
  const list = [entry, ...getExportHistory()].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return entry;
}

export function removeExportHistory(id: string): ExportRecord[] {
  const list = getExportHistory().filter((item) => item.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}

export function clearExportHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
