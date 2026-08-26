import { NetWorkApi } from '@/services/request';

export function recordSubscribeTemplates(tmplIds: string[]) {
  return NetWorkApi<{ ok: boolean; reason?: string }>({
    method: 'post',
    url: 'wx/subscribe/record',
    data: { tmplIds },
  });
}
