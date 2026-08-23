export function replaceImageSize(url?: string, size: number = 400): string {
  if (!url) return '';
  // 酷狗封面常用 `{size}` 占位符（如 .../{size}/...）；替换全部出现处。
  // 若 URL 不含占位符（已是成品链接），则原样返回，避免“裁剪”参数形同虚设。
  if (url.includes('{size}')) return url.replace(/\{size\}/g, String(size));
  return url;
}
