import { NetWorkApi } from '@/services/request';
import { API, ComplaintFormParamsProps } from '@/services/types';

export function submitComplaint(data: ComplaintFormParamsProps) {
  return NetWorkApi<API.ActiveFormResponse>({
    method: 'post',
    url: 'complaint/info',
    data,
  });
}
