import Taro from '@tarojs/taro';
import { fetchWxProfile, updateWxProfile } from '@/services/api/wx';
import { WxProfileData } from '@/services/types';
import { getWxToken, wxLogin } from '@/utils/wxAuth';

const PROFILE_KEY = 'WX_PROFILE';
const BASE_URL = process.env.TARO_APP_API_BASE || 'https://dzbike.club/dz-bike/';

export function getCachedProfile(): WxProfileData | null {
  try {
    return (Taro.getStorageSync(PROFILE_KEY) as WxProfileData) || null;
  } catch {
    return null;
  }
}

export function setCachedProfile(profile: WxProfileData | null) {
  if (!profile) {
    Taro.removeStorageSync(PROFILE_KEY);
    return;
  }
  Taro.setStorageSync(PROFILE_KEY, profile);
}

export function hasCompleteProfile(profile?: WxProfileData | null): boolean {
  const p = profile || getCachedProfile();
  return Boolean(p?.nickName && p?.phone);
}

/** 头像+昵称+手机号均已完善 */
export function hasWxIdentity(profile?: WxProfileData | null): boolean {
  const p = profile || getCachedProfile();
  return Boolean(p?.nickName && p?.avatarUrl && p?.phone);
}

export async function ensureWxSession(): Promise<void> {
  if (!getWxToken()) {
    await wxLogin(true);
  }
}

export async function refreshWxProfile(): Promise<WxProfileData | null> {
  await ensureWxSession();
  const res = await fetchWxProfile();
  if (res.ok && res.data) {
    setCachedProfile(res.data);
    return res.data;
  }
  return getCachedProfile();
}

export async function saveWxProfile(partial: {
  nickName?: string;
  avatarUrl?: string;
  phone?: string;
}): Promise<WxProfileData> {
  await ensureWxSession();
  const res = await updateWxProfile(partial);
  if (!res.ok || !res.data) {
    throw new Error(res.reason || '保存资料失败');
  }
  setCachedProfile(res.data);
  return res.data;
}

/** 上传 chooseAvatar 临时文件，返回可持久化的相对路径 */
export async function uploadWxAvatarFile(tempFilePath: string): Promise<string> {
  await ensureWxSession();
  const token = getWxToken();
  if (!token) {
    throw new Error('请先登录');
  }
  const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  const res = await Taro.uploadFile({
    url: `${base}wx/avatar`,
    filePath: tempFilePath,
    name: 'file',
    header: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.statusCode === 401) {
    clearAndReloginHint();
    throw new Error('登录已过期，请重试');
  }
  let body: { ok?: boolean; reason?: string; data?: { path?: string } };
  try {
    body = typeof res.data === 'string' ? JSON.parse(res.data) : (res.data as typeof body);
  } catch {
    throw new Error('上传响应无效');
  }
  if (res.statusCode !== 200 || !body?.ok || !body.data?.path) {
    throw new Error(body?.reason || '头像上传失败');
  }
  return body.data.path;
}

function clearAndReloginHint() {
  try {
    Taro.removeStorageSync('WX_TOKEN');
    Taro.removeStorageSync('WX_OPENID');
  } catch {
    // ignore
  }
}
