import Taro from '@tarojs/taro';

const DEVICE_ID_KEY = 'Device_ID';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  try {
    return Taro.getStorageSync(DEVICE_ID_KEY) || '';
  } catch {
    return '';
  }
}

export function getOrCreateDeviceId(): string {
  let deviceId = getDeviceId();
  if (!deviceId) {
    deviceId = generateUuid();
    try {
      Taro.setStorageSync(DEVICE_ID_KEY, deviceId);
    } catch {
      // ignore storage errors
    }
  }
  return deviceId;
}
