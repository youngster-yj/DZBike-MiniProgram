// 与 API 基址同源：dev 为 localhost:3001，prod 为 www.dzbike.club
const ASSET_BASE = process.env.TARO_APP_ASSET_BASE || 'https://www.dzbike.club/';

export function getAssetBase(): string {
  return ASSET_BASE.endsWith('/') ? ASSET_BASE : `${ASSET_BASE}/`;
}

export function toAssetUrl(path?: string | null): string {
  if (!path) return `${getAssetBase()}assets/nopic.jpg`;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/^\//, '');
  return `${getAssetBase()}${normalized}`;
}

export function toDisplayUrl(path?: string | null): string {
  if (!path) return toAssetUrl('/assets/nopic.jpg');
  if (/^https?:\/\//i.test(path)) return path;
  // 平台配置图与品牌图路径规则不同，platform 前缀直接拼资源根路径
  if (path.startsWith('assets/platform/')) {
    return `${getAssetBase()}${path.replace(/^\//, '')}`;
  }
  return toAssetUrl(path);
}
