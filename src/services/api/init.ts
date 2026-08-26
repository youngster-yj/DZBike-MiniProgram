import { NetWorkApi } from '@/services/request';
import { API } from '@/services/types';

export function initApp(payload: { openid: string; platform?: string }) {
  return NetWorkApi<API.ActionSucceeded>({
    method: 'post',
    url: 'init/info',
    data: {
      openid: payload.openid,
      platform: payload.platform || 'miniprogram',
      browser: 'WeChatMiniProgram',
      device: 'miniprogram',
    },
  });
}

export async function bootstrapApp() {
  const { wxLogin } = await import('@/utils/wxAuth');
  try {
    const openid = await wxLogin();
    await initApp({ openid, platform: 'miniprogram' });
  } catch {
    // 启动统计失败不影响主流程
  }
}
