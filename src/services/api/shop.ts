import { NetWorkApi } from '@/services/request';
import { API, ShopActiveFormParamsProps } from '@/services/types';

export function fetchShopList(params: {
  page?: number;
  limit?: number;
  timeliness?: 'underway' | 'finished';
}) {
  return NetWorkApi<API.ShopListResponse>({
    method: 'get',
    url: 'shop/list',
    params,
  });
}

export function fetchShopDetail(id: string) {
  return NetWorkApi<API.ShopDetailResponse>({
    method: 'get',
    url: 'shop/detail',
    params: { activityId: id },
  });
}

export function joinShopActivity(data: ShopActiveFormParamsProps) {
  return NetWorkApi<API.ActionSucceeded>({
    method: 'post',
    url: 'shop/join',
    data,
  });
}

export function fetchMyShopJoins() {
  return NetWorkApi<{
    ok: boolean;
    reason?: string;
    data: Array<{
      joinId: string;
      name: string;
      phone: string;
      isCheck: boolean;
      activity: API.ShopListItemResponse | null;
    }>;
  }>({
    method: 'get',
    url: 'shop/my/joins',
  });
}
