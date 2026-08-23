// cspell-checker: disable

interface AccountInfo {
  userid: number;
  nickname: string;
  pic: string;
  username: string;
}

export interface UserInfo {
  userid: number;
  nickname: string;
  pic?: string;
  k_nickname?: string;
  fx_nickname?: string;
  gender?: number;
  vip_type?: number;
  p_grade?: number;
}

export interface AccountListData {
  info_list: AccountInfo[];
}

/** 酷狗账号详情（头像 / 会员等），由后端 /kugou/account/:id 归一化返回。 */
export interface AccountProfile {
  userid?: number;
  nickname?: string;
  pic?: string;
  vipType: number;
  gender?: number;
}

export interface PlaylistData {
  info: Playlist[];
}

export interface Playlist {
  tags: string;
  status: number;
  from_listid: number;
  create_user_pic: string;
  per_num: number;
  pub_new: number;
  is_drop: number;
  list_create_userid: number;
  is_publish: number;
  musiclib_tags: any[];
  pub_time: number;
  name: string;
  is_featured: number;
  list_ver: number;
  intro: string;
  type: number;
  list_create_listid: number;
  radio_id: number;
  source: number;
  is_del: number;
  is_mine: number;
  per_count: number;
  m_count: number;
  create_time: number;
  kq_talent: number;
  is_edit: number;
  update_time: number;
  musiclib_id: number;
  sound_quality: string;
  sort: number;
  trans_param: PlaylistTransParam;
  list_create_gid: string;
  global_collection_id: string;
  pub_type: number;
  is_per: number;
  pic: string;
  list_create_username: string;
  is_pri: number;
  is_custom_pic: number;
  listid: number;
  cutd: number;
  count: number;
}

export interface PlaylistTransParam {
  iden: number;
}

export interface SongListData {
  info: Song[];
  count: number;
}

export interface Song {
  bpm: number;
  hash: string;
  singerinfo: Singerinfo[];
  media_pay_type: number;
  audio_id: number;
  mvtype: number;
  fsort: number;
  fileid: number;
  name: string;
  hash_exist: number;
  publish_date: string;
  rcflag: number;
  mvhash: string;
  media_fail_process: number;
  csong: number;
  tagmap: Tagmap;
  media_old_cpy: number;
  mvdata: Mvdaum[];
  is_publish: number;
  timelen: number;
  size: number;
  bpm_type: string;
  trans_param: SongTransParam;
  mvtrack: number;
  sort: number;
  albuminfo: Albuminfo;
  album_id: string;
  collecttime: number;
  media_type: string;
  cover: string;
  mixsongid: number;
  media_privilege: number;
  language: string;
  bitrate: number;
}

export interface Singerinfo {
  type: number;
  name: string;
  id: number;
  publish: number;
}

export interface Tagmap {
  genre0: number;
}

export interface Mvdaum {
  typ: number;
}

export interface SongTransParam {
  ogg_128_hash: string;
  classmap: Classmap;
  language: string;
  cpy_attr0: number;
  musicpack_advance: number;
  ogg_128_filesize: number;
  display_rate: number;
  union_cover: string;
  qualitymap: Qualitymap;
  pay_block_tpl: number;
  display: number;
  cid: number;
  ipmap: Ipmap;
  hash_multitrack: string;
  ogg_320_hash: string;
  hash_offset: HashOffset;
  cpy_level: number;
  cpy_grade: number;
  ogg_320_filesize: number;
}

export interface Qualitymap {
  bits: string;
  attr0: number;
  attr1: number;
}

export interface Ipmap {
  attr0: number;
}

export interface HashOffset {
  clip_hash: string;
  start_byte: number;
  file_type: number;
  end_byte: number;
  end_ms: number;
  start_ms: number;
  offset_hash: string;
}

export interface Albuminfo {
  publish: number;
  name: string;
  category: number;
  id: number;
}

export interface SongUrl {
  hash: string;
  status: number;
  volume: number;
  is_hash_backup: number;
  backupUrl: string[];
  url: string[];
  tracker_through: TrackerThrough;
  trans_param: SongUrlTransParam;
  fileHead: number;
  auth_through: any[];
  volume_peak: number;
  bitRate: number;
  priv_status: number;
  timeLength: number;
  volume_gain: number;
  q: number;
  fileName: string;
  extName: string;
  fileSize: number;
}

export interface TrackerThrough {
  identity_block: number;
  cpy_grade: number;
  musicpack_advance: number;
  all_quality_free: number;
  cpy_level: number;
}

export interface SongUrlTransParam {
  display_rate: number;
  display: number;
  ogg_128_hash: string;
  qualitymap: Qualitymap;
  pay_block_tpl: number;
  union_cover: string;
  language: string;
  hash_multitrack: string;
  cpy_attr0: number;
  ipmap: Ipmap;
  ogg_320_hash: string;
  classmap: Classmap;
  ogg_128_filesize: number;
  ogg_320_filesize: number;
}

export interface Classmap {
  attr0: number;
}

export interface XiaomusicSong {
  name: string;
  url: string;
}

export interface XiaomusicPlaylist {
  name: string;
  musics: XiaomusicSong[];
}

export interface QRKeyData {
  qrcode: string;
  qrcode_img: string;
}

export interface QRCreateData {
  url: string;
  base64: string;
}

export interface QRCheckData {
  status: 0 | 1 | 2 | 4;
  userid?: number;
  nickname?: string;
  pic?: string;
  token?: string;
}
