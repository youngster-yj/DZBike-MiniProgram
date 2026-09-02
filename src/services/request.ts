import Taro from '@tarojs/taro';
import { showError } from '@/utils/helpers';
import { getWxToken, wxLogin, clearWxSession } from '@/utils/wxAuth';

const BASE_URL = process.env.TARO_APP_API_BASE || 'https://www.dzbike.club/dz-bike/';
const DEFAULT_TIMEOUT = 30 * 1000;

export class ApiError extends Error {
  readonly displayed: boolean;

  constructor(message: string, displayed = false) {
    super(message);
    this.displayed = displayed;
  }
}

export interface RequestConfig<D = unknown> {
  method?: keyof Taro.request.Method;
  url: string;
  data?: D;
  params?: Record<string, unknown>;
  skipAuth?: boolean;
}

function buildUrl(url: string, params?: Record<string, unknown>): string {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url.replace(/^\//, '')}`;
  if (!params || Object.keys(params).length === 0) return fullUrl;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return query ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${query}` : fullUrl;
}

function buildHeaders(skipAuth?: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!skipAuth) {
    const token = getWxToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

function extractReason(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'reason' in data) {
    const reason = (data as { reason?: unknown }).reason;
    if (typeof reason === 'string' && reason.trim()) return reason;
  }
  return fallback;
}

export async function NetWorkApi<T, D = unknown>(
  config: RequestConfig<D>,
  retryOnUnauthorized = true,
): Promise<T> {
  const method = (config.method || 'GET').toUpperCase() as Taro.request.Method;
  const isGet = method === 'GET';

  try {
    const res = await Taro.request<T>({
      url: buildUrl(config.url, isGet ? (config.params as Record<string, unknown>) : undefined),
      method,
      data: isGet ? undefined : config.data,
      timeout: DEFAULT_TIMEOUT,
      header: buildHeaders(config.skipAuth),
    });

    if (res.statusCode === 401 && !config.skipAuth && retryOnUnauthorized) {
      clearWxSession();
      await wxLogin(true);
      return NetWorkApi<T, D>(config, false);
    }

    if (res.statusCode === 401) {
      showError('登录已过期，请重新登录');
      return Promise.reject(new ApiError('Unauthorized', true));
    }

    if (res.statusCode === 403) {
      const msg = extractReason(res.data, '无权限');
      showError(msg);
      return Promise.reject(new ApiError('Forbidden', true));
    }

    if (res.statusCode !== 200) {
      const msg = extractReason(res.data, `请求失败 (${res.statusCode})`);
      showError(msg);
      return Promise.reject(new ApiError(msg, true));
    }

    const body = res.data as T & { ok?: boolean; reason?: string };
    if (body && body.ok === false && body.reason) {
      return Promise.reject(new ApiError(body.reason));
    }

    return body;
  } catch (err) {
    if (err instanceof ApiError) {
      if (!err.displayed) showError(err.message);
      return Promise.reject(err);
    }
    const message = err instanceof Error ? err.message : '网络请求失败';
    showError(message);
    return Promise.reject(new ApiError(message, true));
  }
}
