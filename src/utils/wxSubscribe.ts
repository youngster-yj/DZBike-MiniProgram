import Taro from '@tarojs/taro';
import { recordSubscribeTemplates } from '@/services/api/wx';

const AUDIT_TEMPLATE_ID =
  process.env.TARO_APP_WX_SUBSCRIBE_ACTIVITY_AUDIT || '';

export async function requestActivityAuditSubscribe(): Promise<void> {
  if (!AUDIT_TEMPLATE_ID) {
    return;
  }

  try {
    const res = await Taro.requestSubscribeMessage({
      tmplIds: [AUDIT_TEMPLATE_ID],
    });
    const accepted = [AUDIT_TEMPLATE_ID].filter(
      (id) => res[id] === 'accept',
    );
    if (accepted.length > 0) {
      await recordSubscribeTemplates(accepted);
    }
  } catch {
    // 用户拒绝或环境不支持时不阻塞提交流程
  }
}
