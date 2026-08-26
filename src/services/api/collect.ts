import { NetWorkApi } from '@/services/request';
import { API } from '@/services/types';

export function fetchCollectList(params: { page?: number; limit?: number }) {
  return NetWorkApi<API.CollectListResponse>({
    method: 'get',
    url: 'collect/list',
    params,
  });
}

export function fetchCollectDetail(id: string) {
  return NetWorkApi<API.CollectDetailResponse>({
    method: 'get',
    url: 'collect/detail',
    params: { _id: id },
  });
}
