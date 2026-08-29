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

export function addStoreFavorite(storeId: string) {
  return NetWorkApi<API.ActionSucceeded>({
    method: 'post',
    url: 'store/favorite',
    data: { storeId },
  });
}

export function removeStoreFavorite(storeId: string) {
  return NetWorkApi<API.ActionSucceeded>({
    method: 'DELETE',
    url: 'store/favorite',
    data: { storeId },
  });
}

export function fetchStoreFavorites() {
  return NetWorkApi<API.StoreListResponse>({
    method: 'get',
    url: 'store/favorite/list',
  });
}

export function checkStoreFavorite(storeId: string) {
  return NetWorkApi<{ ok: boolean; data: { favorited: boolean } }>({
    method: 'get',
    url: 'store/favorite/check',
    params: { storeId },
  });
}
