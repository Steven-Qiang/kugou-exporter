declare module 'kugoumusicapi' {
  interface KugouResponse<T = any> {
    status: number;
    body: T;
    cookie?: string[];
    headers?: Record<string, string>;
  }

  function login_token(cookie: Record<string, string>): Promise<KugouResponse>;
  function register_dev(params: { cookie: Record<string, string> }): Promise<KugouResponse<{ status: number; data?: { dfid?: string } }>>;
  function song_url(params: { hash: string; quality: string; cookie: Record<string, string> }): Promise<KugouResponse<{ url?: string[] }>>;
  function user_detail(params: { cookie: Record<string, string> }): Promise<KugouResponse>;
  function user_playlist(params: { cookie: Record<string, string> }): Promise<KugouResponse>;
  function playlist_track_all_new(params: { cookie: Record<string, string>; listid: number; page: number; pagesize: number }): Promise<KugouResponse>;
  const consturctServer: (moduleDefs?: any[]) => Promise<import('express').Express>;
  const setupStatic: (app: import('express').Express, dir: string) => void;
}

declare module 'kugoumusicapi/util' {
  function cookieToJson(s: string): Record<string, string>;
}
