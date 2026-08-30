import Taro from '@tarojs/taro';
import { recordSubscribeTemplates } from '@/services/api/wx';

const AUDIT_TEMPLATE_ID =
  process.env.TARO_APP_WX_SUBSCRIBE_ACTIVITY_AUDIT || '';
const BIKE_REMIND_TEMPLATE_ID =
  process.env.TARO_APP_WX_SUBSCRIBE_BIKE_REMIND || '';
const SHOP_REMIND_TEMPLATE_ID =
  process.env.TARO_APP_WX_SUBSCRIBE_SHOP_REMIND || '';

async function requestTemplates(tmplIds: string[]): Promise<string[]> {
  const ids = tmplIds.filter(Boolean).slice(0, 3);
  if (!ids.length) return [];

  try {
    const res = await Taro.requestSubscribeMessage({
      tmplIds: ids,
    } as Taro.requestSubscribeMessage.Option);
    return ids.filter((id) => res[id] === 'accept');
  } catch {
    return [];
  }
}

/** 发起活动：审核结果通知 */
export async function requestActivityAuditSubscribe(): Promise<void> {
  const accepted = await requestTemplates([AUDIT_TEMPLATE_ID]);
  if (accepted.length > 0) {
    try {
      await recordSubscribeTemplates(accepted);
    } catch {
      /* ignore */
    }
  }
}

/**
 * 报名提醒订阅（一次性）。须在用户点击手势内尽早调用。
 * 返回已 accept 的模板 id，报名成功后再带 activityId 写入 record。
 */
export async function requestJoinRemindSubscribe(
  kind: 'bike' | 'shop',
): Promise<string[]> {
  const tmplId =
    kind === 'bike' ? BIKE_REMIND_TEMPLATE_ID : SHOP_REMIND_TEMPLATE_ID;
  return requestTemplates([tmplId]);
}

/** 报名成功后：把提醒授权记到对应 join */
export async function recordJoinRemindSubscribe(params: {
  kind: 'bike' | 'shop';
  activityId: string;
  tmplIds: string[];
}): Promise<void> {
  if (!params.tmplIds.length || !params.activityId) return;
  try {
    await recordSubscribeTemplates(params.tmplIds, {
      activityId: params.activityId,
      kind: params.kind,
    });
  } catch {
    /* ignore */
  }
}
