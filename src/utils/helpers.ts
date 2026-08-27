import Taro from '@tarojs/taro';

export function showToast(title: string, icon: 'success' | 'error' | 'none' = 'none') {
  Taro.showToast({ title, icon, duration: 2500 });
}

export function showSuccess(title: string) {
  showToast(title, 'success');
}

export function showError(title: string) {
  // icon: 'error' 在微信小程序最多显示 7 个汉字，长文案会被截断
  showToast(title, 'none');
}

/** 仅允许 2–10 位中文姓名/昵称 */
export function judgeName(value: string): string | true {
  const re = /^[\u4e00-\u9fa5]{2,10}$/;
  if (re.test(value)) return true;
  return '请输入正确姓名或昵称';
}

export function judgePhone(value: string): string | true {
  const re = /^1[3-9]\d{9}$/;
  if (re.test(value)) return true;
  return '请输入正确的手机号便于组织者联系';
}

export function previewImages(urls: string[], current?: string) {
  Taro.previewImage({
    urls,
    current: current || urls[0],
  });
}

export function openLocation(params: {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
}) {
  Taro.openLocation({
    latitude: params.latitude,
    longitude: params.longitude,
    name: params.name,
    address: params.address || '',
    scale: 16,
  });
}

export function makePhoneCall(phone: string | number) {
  Taro.makePhoneCall({ phoneNumber: String(phone) });
}
