import { NetWorkApi } from '@/services/request';
import { WxProfileData } from '@/services/types';

export function recordSubscribeTemplates(tmplIds: string[]) {
  return NetWorkApi<{ ok: boolean; reason?: string }>({
    method: 'post',
    url: 'wx/subscribe/record',
    data: { tmplIds },
  });
}

export function fetchWxProfile() {
  return NetWorkApi<{ ok: boolean; reason?: string; data: WxProfileData }>({
    method: 'get',
    url: 'wx/profile',
  });
}

export function updateWxProfile(data: {
  nickName?: string;
  avatarUrl?: string;
  phone?: string;
}) {
  return NetWorkApi<{ ok: boolean; reason?: string; data: WxProfileData }>({
    method: 'post',
    url: 'wx/profile',
    data,
  });
}
