import { getAssetBase } from '@/utils/assetUrl';

function getH5Origin(): string {
  const base = getAssetBase();
  try {
    return new URL(base).origin;
  } catch {
    return 'https://dzbike.club';
  }
}

function encodeQueryValue(value: string): string {
  return encodeURIComponent(value);
}

export function buildBikeH5Url(activityId: string, activityKey?: string): string {
  const url = `${getH5Origin()}/bike?activity_id=${encodeQueryValue(activityId)}`;
  if (!activityKey) return url;
  return `${url}&activity_key=${encodeQueryValue(activityKey)}`;
}

export function buildBikeMiniPath(activityId: string, activityKey?: string): string {
  const base = `/pages/activity/bike/index?activity_id=${encodeQueryValue(activityId)}`;
  if (!activityKey) return base;
  return `${base}&activity_key=${encodeQueryValue(activityKey)}`;
}

export function buildProductH5Url(brand: string, productId: string): string {
  return `${getH5Origin()}/store/${encodeURIComponent(brand)}?product_id=${encodeQueryValue(productId)}`;
}

export function buildProductMiniPath(productId: string): string {
  return `/pages/store/detail/index?id=${encodeQueryValue(productId)}`;
}

export function buildShopH5Url(shopId: string): string {
  return `${getH5Origin()}/shop?shop_id=${encodeQueryValue(shopId)}`;
}

export function buildShopMiniPath(shopId: string): string {
  return `/pages/activity/shop/index?shop_id=${encodeQueryValue(shopId)}`;
}

export function buildCollectH5Url(collectId: string): string {
  return `${getH5Origin()}/collect?_id=${encodeQueryValue(collectId)}`;
}

export function buildCollectMiniPath(collectId: string): string {
  return `/pages/activity/collect/index?collect_id=${encodeQueryValue(collectId)}`;
}
