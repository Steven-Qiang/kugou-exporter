import type { Song } from '../src/lib/export-content';
import { describe, expect, it } from 'vitest';
import { buildCsvContent, buildProxyUrl, formatDuration, pickList } from '../src/lib/export-content';

const song: Song = {
  hash: 'abc123',
  name: '晴天',
  timelen: 245000,
  fsort: 1,
  singerinfo: [{ name: '周杰伦' }, { name: '方文山' }],
  albuminfo: { name: '叶惠美' },
};

describe('lib/export-content', () => {
  it('buildProxyUrl 生成代理链接（带 uid）', () => {
    const url = buildProxyUrl('http://192.168.1.5:3000/', song, 'high', '99999');
    expect(url).toBe('http://192.168.1.5:3000/proxy/song/url?hash=abc123&quality=high&uid=99999');
  });

  it('buildProxyUrl 无 uid 时不带 uid 参数', () => {
    const url = buildProxyUrl('http://127.0.0.1:3000', song, 'flac', '');
    expect(url).toBe('http://127.0.0.1:3000/proxy/song/url?hash=abc123&quality=flac');
  });

  it('formatDuration 毫秒转 m:ss', () => {
    expect(formatDuration(245000)).toBe('4:05');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(-1)).toBe('0:00');
  });

  it('pickList 兼容 { info } / { data:{ info } } / { data:[] } 包装', () => {
    const arr = [{ id: 1 }];
    expect(pickList({ info: arr })).toBe(arr);
    expect(pickList({ data: { info: arr } })).toBe(arr);
    expect(pickList({ data: arr })).toBe(arr);
    expect(pickList({ list: arr })).toBe(arr);
    expect(pickList(null)).toEqual([]);
  });

  it('buildCsvContent 含 BOM + 表头 + 引号转义', () => {
    const csv = buildCsvContent([song]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"歌名"');
    expect(csv).toContain('"晴天"');
    expect(csv).toContain('"周杰伦, 方文山"');
    expect(csv).toContain('"4:05"');
  });
});
