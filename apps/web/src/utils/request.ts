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

const ignoreErrorDialogUrl = ['/login/cellphone', '/user/detail'];

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
 * Login/auth endpoints always hit the real backend, even in demo mode, so the
 * login page is never hijacked by the demo adapter.
 */
const REAL_PATHS = ['/login', '/captcha', '/auth', '/kugou', '/config', '/history'];

request.defaults.adapter = async (config) => {
  const pathname = (config.url || '').split('?')[0];
  if (isDemo() && !REAL_PATHS.some((p) => pathname.startsWith(p)))
    return demoAdapter(config);
  // Pass through to the real browser adapter (XHR / fetch).
  return axios.getAdapter(axios.defaults.adapter)(config);
};

request.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) console.log('API Response:', response.config.url, JSON.stringify(response.data));
    if (response.data.data) return response.data;
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
