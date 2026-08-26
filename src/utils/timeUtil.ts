import dayjs from 'dayjs';

export function formatDateTime(timestamp?: number): string {
  if (!timestamp) return '';
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm');
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) return '';
  return dayjs.unix(timestamp).format('YYYY-MM-DD');
}

/** 截止时间是否已过（用于店铺活动列表） */
export function isAfter(endTime?: number): boolean {
  if (!endTime) return false;
  return dayjs.unix(endTime).isBefore(dayjs());
}

/** 时间戳是否在当前时刻之后（活动未开始/未截止） */
export function isTimestampFuture(timestamp?: number): boolean {
  if (!timestamp) return true;
  return dayjs.unix(timestamp).isAfter(dayjs());
}

export function maskName(name: string): string {
  if (!name) return '';
  if (name.length <= 1) return `${name}*`;
  return `${name[0]}${'*'.repeat(Math.min(name.length - 1, 2))}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
