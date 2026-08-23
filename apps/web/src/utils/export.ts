export type ExportFormat = 'xiaomusic' | 'json' | 'csv';

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
