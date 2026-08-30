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

/** 2–20 位中文/英文/数字及常见分隔符（兼容微信英文/中英昵称） */
export function judgeName(value: string): string | true {
  const trimmed = value.trim();
  const re = /^[\u4e00-\u9fa5a-zA-Z0-9_\- ·・]{2,20}$/;
  if (re.test(trimmed)) return true;
  return '请输入 2–20 位昵称（中英文、数字均可）';
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
