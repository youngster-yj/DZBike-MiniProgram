import { NetWorkApi } from '@/services/request';
import { API, ActiveFormParamsProps } from '@/services/types';

export function fetchActivityList(params: {
  page?: number;
  limit?: number;
  timeliness?: 'underway' | 'finished';
}) {
  return NetWorkApi<API.ActivityListResponse>({
    method: 'get',
    url: 'activity/list',
    params,
  });
}

export function fetchActivityDetail(id: string) {
  return NetWorkApi<API.ActivityDetailResponse>({
    method: 'get',
    url: 'activity/detail',
    params: { activityId: id },
  });
}

export function applyActivity(data: ActiveFormParamsProps) {
  return NetWorkApi<API.ActiveFormResponse>({
    method: 'post',
    url: 'activity/apply',
    data,
  });
}

export function joinActivity(data: {
  activityId: string;
  name?: string;
  phone?: string;
  key?: string;
}) {
  return NetWorkApi<API.ActionSucceeded>({
    method: 'post',
    url: 'activity/join',
    data,
  });
}

export function fetchMyActivityJoins() {
  return NetWorkApi<{
    ok: boolean;
    reason?: string;
    data: Array<{
      joinId: string;
      name: string;
      phone: string;
      isCheck: boolean;
      activity: API.ActivityListItemResponse | null;
    }>;
  }>({
    method: 'get',
    url: 'activity/my/joins',
  });
}

export function judgeActivityKey(data: { activityId: string; key: string }) {
  return NetWorkApi<API.ActionSucceeded>({
    method: 'post',
    url: 'activity/judge/key',
    data,
  });
}

export function fetchOrganizerPhone(data: { activityId: string; key?: string }) {
  return NetWorkApi<API.UserPhoneResponse>({
    method: 'post',
    url: 'activity/user/phone',
    data,
  });
}

export function fetchShareKey(data: { activityId: string }) {
  return NetWorkApi<{ ok: boolean; reason?: string; data: { key: string } }>({
    method: 'post',
    url: 'activity/share/key',
    data,
  });
}

export function fetchJoinList(data: { activityId: string; name: string; phone: string }) {
  return NetWorkApi<API.JoinDataResponse>({
    method: 'post',
    url: 'activity/join/list',
    data,
  });
}
