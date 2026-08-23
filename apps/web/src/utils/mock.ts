import type { Playlist, Song, SongListData, SongUrl, UserInfo } from '@/types';

/* Demo/Demo-mode mock data. Used when the app runs without a real login so the
   UI can be previewed and tested end-to-end. */

const DEMO_KEY = 'kugou-demo';

/**
     Generate an instant, offline placeholder cover (SVG data URI) so demo mode
    never depends on an external image CDN (which can be slow/blocked in China).
 */
function coverPlaceholder(seed: number, label = '♪'): string {
  const h = Math.abs(seed * 61) % 360;
  const h2 = (h + 45) % 360;
  const txt = label.slice(0, 1);
  const svg
    = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>`
      + `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>`
      + `<stop offset='0' stop-color='hsl(${h},72%,58%)'/>`
      + `<stop offset='1' stop-color='hsl(${h2},72%,46%)'/></linearGradient></defs>`
      + `<rect width='300' height='300' fill='url(#g)'/>`
      + `<text x='150' y='192' font-family='Arial, sans-serif' font-size='130' fill='rgba(255,255,255,0.92)' text-anchor='middle'>${txt}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function setPage(seed: number): string {
  return coverPlaceholder(seed, '♪');
}

const demoUser: UserInfo = {
  userid: 10001,
  nickname: '演示用户',
  pic: coverPlaceholder(7, 'U'),
  gender: 1,
  vip_type: 1,
};

const demoPlaylists = [
  {
    listid: 1,
    name: '我喜欢',
    count: 28,
    pic: setPage(11),
    intro: '我的每日精选收藏',
    create_user_pic: setPage(11),
    per_count: 28,
    is_mine: 1,
    is_del: 0,
    create_time: 1719800000,
    update_time: 1720000000,
    global_collection_id: 'g1',
  },
  {
    listid: 2,
    name: '深夜慢歌',
    count: 18,
    pic: setPage(12),
    intro: '夜里循环的旋律',
    create_user_pic: setPage(12),
    per_count: 18,
    is_mine: 1,
    is_del: 0,
    create_time: 1719000000,
    update_time: 1720100000,
    global_collection_id: 'g2',
  },
  {
    listid: 3,
    name: '华语经典',
    count: 42,
    pic: setPage(13),
    intro: '那些年我们听过的歌',
    create_user_pic: setPage(13),
    is_mine: 1,
    create_time: 1718000000,
    update_time: 1719900000,
    global_collection_id: 'g3',
  },
  {
    listid: 4,
    name: '健身节奏',
    count: 12,
    pic: setPage(14),
    intro: '高能运动歌单',
    create_user_pic: setPage(14),
    is_mine: 1,
    create_time: 1717000000,
    update_time: 1718800000,
    global_collection_id: 'g4',
  },
] as unknown as Playlist[];

function demoSong(listid: number, i: number): Song {
  const artists = ['周杰伦', '林俊杰', '邓紫棋', '陈奕迅', '五月天', '孙燕姿', '梁静茹', '李荣浩', '薛之谦', '张惠妹'];
  const titles = ['晴天', '告白气球', '光年之外', '十年', '突然好想你', '遇见', '勇气', '年少有为', '演员', '听海'];
  const albums = [
    '叶惠美',
    '周杰伦的床边故事',
    '光年之外',
    '黑择明',
    '后青春期的诗',
    'Stefanie',
    '勇气',
    '年少有为',
    '初学者',
    'Bad Boy',
  ];
  const a = artists[(listid * 3 + i) % artists.length];
  const t = titles[(listid * 5 + i) % titles.length];
  const al = albums[(listid * 7 + i) % albums.length];
  const hash = `${listid}${i}abc${(i * 7919) % 100000}`;
  return {
    hash,
    name: `${t}`,
    singerinfo: [{ type: 1, name: a, id: 100 + i, publish: 1 }],
    albuminfo: { publish: 1, name: al, category: 1, id: 200 + i },
    cover: setPage(listid * 100 + i),
    timelen: 200000 + ((i * 37) % 90) * 1000,
    fsort: i,
    bitrate: 320,
    fileid: i,
    mixsongid: 300 + i,
    audio_id: 400 + i,
    album_id: String(200 + i),
    language: '国语',
    publish_date: '2020-01-01',
    media_type: 'mp3',
    collecttime: 1719800000 + i * 3600,
    sort: i,
  } as Song;
}

function demoSongList(listid: number, total: number, page: number): SongListData {
  const start = (page - 1) * 100;
  const end = Math.min(start + 100, total);
  const info: Song[] = [];
  for (let i = start; i < end; i++) info.push(demoSong(listid, i));
  return { info, count: total };
}

function demoSongUrl(hash: string): SongUrl {
  return {
    hash,
    status: 1,
    url: [`https://example.com/audio/${hash}.mp3`],
    backupUrl: [`https://example.com/audio/${hash}_backup.mp3`],
    bitRate: 320,
    fileName: `song_${hash}.mp3`,
    extName: 'mp3',
    fileSize: 10485760,
    timeLength: 240,
    q: 320,
    volume: 1,
    is_hash_backup: 0,
    fileHead: 0,
    tracker_through: {},
    trans_param: {},
    auth_through: [],
    volume_peak: 1,
    priv_status: 0,
    volume_gain: 1,
  } as unknown as SongUrl;
}

function entries(): Record<string, (params?: Record<string, any>, config?: any) => any> {
  return {
    // App 会话（多租户）：演示模式下模拟已登录管理员
    '/auth/me': () => ({ user: { id: 1, username: '演示用户', is_admin: true, created_at: Date.now() } }),
    '/auth/setup/status': () => ({ needsSetup: false }),
    '/auth/users': () => ({
      users: [
        { id: 1, username: '演示用户', is_admin: true, created_at: Date.now() },
        { id: 2, username: '演示子用户', is_admin: false, created_at: Date.now() },
      ],
    }),
    '/auth/change-password': () => ({ success: true }),
    // 酷狗账号列表（激活一个演示账号）
    '/kugou': () => ({
      accounts: [{ id: 1, nickname: '演示账号', active: true, created_at: Date.now(), updated_at: Date.now() }],
    }),
    //
    '/kugou/playlist': () => ({ info: demoPlaylists }),
    '/kugou/playlist/tracks': (params) => {
      const total = demoPlaylists.find((p) => p.listid === Number(params?.listid))?.count ?? 0;
      return demoSongList(Number(params?.listid) || 1, total, Number(params?.page) || 1);
    },
    '/kugou/song/url': (params) => demoSongUrl(String(params?.hash || 'demo') + (params?.quality || '')),
    '/kugou/me': () => demoUser,
    '/config/get': () => ({
      serverUrl: 'http://127.0.0.1:3000',
      settings: { quality: 'high', serverUrl: 'http://127.0.0.1:3000' },
    }),
    '/config/save': () => ({ success: true }),
    '/history': () => ({ history: [] }),
    // ---- 酷狗登录相关（演示模式下必须本地 mock，绝不请求真实接口）----
    '/login/cellphone': () => ({ status: 1, data: { nickname: '演示账号', nickname2: '演示账号', userid: 1 } }),
    '/captcha/sent': () => ({ success: true }),
    '/login/qr/key': () => ({ qrcode: 'demoqrcode', qrcode_img: '' }),
    '/login/qr/create': () => ({ url: '', base64: '' }),
    '/login/qr/check': () => ({ status: 4, nickname: '演示账号', userid: 1 }),
    // 演示模式下退出应用账号也走 mock
    '/auth/logout': () => ({ success: true }),
  };
}

/** Determine whether the app is in demo mode (UI preview without a real login). */
export function isDemo(): boolean {
  try {
    return localStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

export function enableDemo() {
  try {
    localStorage.setItem(DEMO_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function disableDemo() {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignore */
  }
}

/** Resolve a mocked payload for the given request url + params. */
export function mockResolve(url: string, params?: Record<string, any>): any {
  const clean = url.split('?')[0];
  // 账号详情：演示模式下返回带头像/会员的资料，便于预览
  if ((/^\/kugou\/account\/\d+$/).test(clean)) {
    return {
      success: true,
      profile: {
        userid: 1,
        nickname: '演示账号',
        pic: coverPlaceholder(7, 'U'),
        vipType: 1,
        gender: 2,
      },
    };
  }
  const handlers = entries();
  const handler = handlers[clean];
  if (!handler) return null;
  return handler(params);
}
