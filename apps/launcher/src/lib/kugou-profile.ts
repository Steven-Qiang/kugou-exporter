export interface KugouProfile {
  userid?: number;
  nickname: string;
  pic: string;
  vipType: number;
  gender?: number;
}

/**
 * 在酷狗响应体中递归定位“用户对象”，兼容 { userinfo } / { data:{ userinfo } } /
 * { data:{ data:{ userinfo } } } / data 直接为用户对象 等不同包装。
 * 以“正数 userid 或非空 nickname”作为用户对象的锚点，避免误匹配容器对象。
 */
function findUserInfo(obj: any, depth = 0, seen = new Set<any>()): any {
  if (!obj || typeof obj !== 'object' || depth > 10) return null;
  if (seen.has(obj)) return null;
  seen.add(obj);
  const uid = Number(obj.userid);
  const nickname = typeof obj.nickname === 'string' && obj.nickname.length > 0 ? obj.nickname : '';
  if (uid > 0 || nickname) return obj;
  for (const key of ['userinfo', 'info', 'data', 'profile', 'user']) {
    if (obj[key]) {
      const found = findUserInfo(obj[key], depth + 1, seen);
      if (found) return found;
    }
  }
  return null;
}

/** 从 user_detail 响应里抽取标准资料（昵称 / 头像 / 会员等级 / 性别）。找不到时返回安全的空资料。 */
export function normalizeKugouUser(body: any): KugouProfile {
  const u = findUserInfo(body);
  const nickname = u ? (u.nickname || u.nickname2 || u.fx_nickname || u.k_nickname || '') : '';
  const pic = u ? (u.pic || u.avatar || u.user_pic || '') : '';
  return {
    userid: u ? Number(u.userid) || undefined : undefined,
    nickname: typeof nickname === 'string' ? nickname : '',
    pic: typeof pic === 'string' ? pic : '',
    vipType: u ? Number(u.vip_type) || 0 : 0,
    gender: u && u.gender != null ? Number(u.gender) : undefined,
  };
}
