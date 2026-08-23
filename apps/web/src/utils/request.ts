import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';
import { isDemo, mockResolve } from '@/utils/mock';

const request = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : '/',
  timeout: 15000,
  withCredentials: true,
});

const ignoreErrorDialogUrl = ['/login/cellphone', '/login', '/auth/login'];

/**
 * Demo-mode adapter: returns locally mocked data so the UI can be previewed
 * without a real login. It produces an axios-shaped envelope that the response
 * interceptor below unwraps like a real API response.
 */
const demoAdapter: AxiosAdapter = async (config) => {
  const url = config.url || '';
  const params = config.params;
  const payload = mockResolve(url, params);
  await new Promise((r) => setTimeout(r, 220)); // simulate latency

  const envelope
    = payload === null ? { code: 404, msg: 'Not Found', data: null } : { code: 200, msg: 'ok', data: payload };

  const response: AxiosResponse = {
    data: envelope,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: config as InternalAxiosRequestConfig,
  };
  return response;
};

/**
 * Endpoints that always hit the real backend — never mocked — even in demo mode.
 * 演示模式是「纯预览」，绝不能触碰真实酷狗接口（含登录/验证码/数据），避免用户对项目盗号有疑虑。
 * 仅保留应用自身的引导接口（创建管理员 / 应用登录）为真实；其余（/kugou/*、/login/*、/captcha/*、
 * /auth/me、/auth/logout、/config、/history）全部由 mock 拦截。
 */
// 仅「创建管理员 / 应用登录」这两个引导接口在演示模式下仍需真实（否则登录页/守卫会被演示数据劫持）。
// 精确匹配，避免把 /auth/setup/status 等也误判为真实。
const REAL_EXACT = new Set(['/auth/setup', '/auth/login']);

request.defaults.adapter = async (config) => {
  const pathname = (config.url || '').split('?')[0];
  if (isDemo() && !REAL_EXACT.has(pathname)) return demoAdapter(config);
  // Pass through to the real browser adapter (XHR / fetch).
  return axios.getAdapter(axios.defaults.adapter)(config);
};

request.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) console.log('API Response:', response.config.url, JSON.stringify(response.data));
    // 约定：`.data` 始终是“有效载荷”。
    //   - body 形如 `{ code, data, msg }`（酷狗透传）→ 返回 body，调用方 `.data` 指向内层；
    //   - body 不带顶层 `data`（自定义成功体，如 `{ success, user }`）→ 返回完整 axios response，
    //     调用方 `.data` 即 body。
    // 两种情况 `.data` 都是有效载荷，仅对“body 是对象且含 data 键”做解包；其余保持原样，逻辑确定。
    const body = response.data;
    if (body && typeof body === 'object' && 'data' in body) return body;
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, JSON.stringify(error.response?.data));
    if (error.response?.status === 301) {
      router.push('/login');
      ElMessage.error('请先登录');
    } else {
      // 401 是预期内的鉴权状态（守卫检查 /auth/me、登录失败等），由调用方处理，不弹通用错误
      const isAuth = error.config?.url?.startsWith('/auth/');
      // /kugou 数据接口失败由组件处理（显示友好空态/提示），不弹通用错误
      const isKugou = error.config?.url?.startsWith('/kugou/');
      if (!isAuth && !isKugou && !ignoreErrorDialogUrl.includes(error.config?.url || ''))
        ElMessage.error(error.response?.data?.msg || '请求失败');
    }
    return Promise.reject(error);
  }
);

export default request;
