import Taro from '@tarojs/taro';

// 与 request.ts 同源，走构建时注入的 TARO_APP_API_BASE
const BASE_URL = process.env.TARO_APP_API_BASE || 'https://www.dzbike.club/dz-bike/';
const WX_TOKEN_KEY = 'WX_TOKEN';
const WX_OPENID_KEY = 'WX_OPENID';

interface WxLoginResponse {
  ok: boolean;
  reason?: string;
  data?: {
    token: string;
    openid: string;
  };
}

export function getWxToken(): string {
  return Taro.getStorageSync(WX_TOKEN_KEY) || '';
}

export function getWxOpenid(): string {
  return Taro.getStorageSync(WX_OPENID_KEY) || '';
}

function saveWxSession(token: string, openid: string) {
  Taro.setStorageSync(WX_TOKEN_KEY, token);
  Taro.setStorageSync(WX_OPENID_KEY, openid);
}

function extractLoginReason(data: unknown, statusCode: number): string {
  if (data && typeof data === 'object' && 'reason' in data) {
    const reason = (data as { reason?: unknown }).reason;
    if (typeof reason === 'string' && reason.trim()) return reason;
  }
  return `请求失败 (${statusCode})`;
}

function isCodeInvalidReason(message: string): boolean {
  return /无效|过期|code/i.test(message);
}

/** 并发登录共用同一 Promise，避免多次 Taro.login 导致 code 失效 */
let loginPromise: Promise<string> | null = null;

async function loginWithCode(code: string): Promise<WxLoginResponse> {
  const url = `${BASE_URL.replace(/\/$/, '')}/wx/login`;
  const res = await Taro.request<WxLoginResponse>({
    url,
    method: 'POST',
    data: { code },
    header: { 'Content-Type': 'application/json' },
    timeout: 30 * 1000,
  });
  if (res.statusCode !== 200) {
    throw new Error(extractLoginReason(res.data, res.statusCode));
  }
  return res.data;
}

async function exchangeCodeOnce(): Promise<string> {
  const { code } = await Taro.login();
  if (!code) {
    throw new Error('微信登录失败');
  }
  const res = await loginWithCode(code);
  const flat = res as WxLoginResponse & { token?: string; openid?: string };
  const token = res.data?.token || flat.token;
  const openid = res.data?.openid || flat.openid;
  if (!res.ok || !token || !openid) {
    throw new Error(res.reason || '微信登录失败');
  }
  saveWxSession(token, openid);
  return openid;
}

export async function wxLogin(force = false): Promise<string> {
  if (!force) {
    const cached = getWxOpenid();
    if (cached && getWxToken()) {
      return cached;
    }
  }

  if (loginPromise) {
    return loginPromise;
  }

  loginPromise = (async () => {
    try {
      return await exchangeCodeOnce();
    } catch (err) {
      const message = err instanceof Error ? err.message : '微信登录失败';
      // code 偶发失效时再换一次票
      if (isCodeInvalidReason(message)) {
        return exchangeCodeOnce();
      }
      throw err instanceof Error ? err : new Error(message);
    }
  })();

  try {
    return await loginPromise;
  } finally {
    loginPromise = null;
  }
}

export function clearWxSession() {
  Taro.removeStorageSync(WX_TOKEN_KEY);
  Taro.removeStorageSync(WX_OPENID_KEY);
}
