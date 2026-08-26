import { NetWorkApi } from '@/services/request';
import { API, StoreListParamsProps } from '@/services/types';

export function fetchStoreList(params: StoreListParamsProps) {
  return NetWorkApi<API.StoreListResponse>({
    method: 'get',
    url: 'store/list',
    params: params as Record<string, unknown>,
  });
}

export function fetchStoreDetail(id: string) {
  return NetWorkApi<API.StoreDetailResponse>({
    method: 'get',
    url: 'store/detail',
    params: { _id: id },
  });
}
