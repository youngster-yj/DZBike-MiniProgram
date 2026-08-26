import Taro from '@tarojs/taro';

// 与 request.ts 同源，走构建时注入的 TARO_APP_API_BASE
const BASE_URL = process.env.TARO_APP_API_BASE || 'https://dzbike.club/dz-bike/';
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
    throw new Error(`请求失败 (${res.statusCode})`);
  }
  return res.data;
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
    const { code } = await Taro.login();
    if (!code) {
      throw new Error('微信登录失败');
    }
    const res = await loginWithCode(code);
    if (!res.ok || !res.data?.openid || !res.data?.token) {
      throw new Error(res.reason || '微信登录失败');
    }
    saveWxSession(res.data.token, res.data.openid);
    return res.data.openid;
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
