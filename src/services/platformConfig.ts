import { NetWorkApi } from '@/services/request';
import { API } from '@/services/types';
import { usePlatformConfigStore } from '@/store/platformConfigStore';
import { toDisplayUrl } from '@/utils/assetUrl';
import {
  DEFAULT_STORE_ADDRESS_DETAIL,
  DEFAULT_BRAND_DETAIL,
  DEFAULT_CAROUSEL_DETAIL,
  DEFAULT_CATEGORY_DETAIL,
  PlatformStoreItem,
  PlatformBrandItem,
  PlatformCarouselItem,
  PlatformCategoryItem,
  StoreAddressItemInfoProps,
  BrandItemInfo,
} from '@/data/platformDefaults';

export interface PlatformConfigData {
  stores: PlatformStoreItem[];
  brands: PlatformBrandItem[];
  carousel: PlatformCarouselItem[];
  categories: PlatformCategoryItem[];
  updatedAt?: number;
}

let cache: PlatformConfigData | null = null;
let fetchPromise: Promise<void> | null = null;

function notifyPlatformConfigChanged(ready = true) {
  const store = usePlatformConfigStore.getState();
  store.bump();
  store.setReady(ready);
}

/** 兼容旧接口单独返回的 babyBike 字段，合并进品牌列表 */
function mergeBabyBikeIntoBrands(
  brands: PlatformBrandItem[],
  legacy?: Partial<PlatformBrandItem> | null,
): PlatformBrandItem[] {
  if (!legacy) return brands;
  const item = {
    ...legacy,
    jump: 'babyBike',
    brand: 'BabyBike',
    navStandalone: true,
  };
  const idx = brands.findIndex((b) => b.jump === 'babyBike');
  if (idx >= 0) {
    const next = [...brands];
    next[idx] = { ...next[idx], ...item };
    return next;
  }
  return [...brands, item as PlatformBrandItem];
}

function defaultStoreMap() {
  return new Map(
    DEFAULT_STORE_ADDRESS_DETAIL.map((s) => [s.shop.toUpperCase(), s]),
  );
}

function defaultBrandMap() {
  return new Map(DEFAULT_BRAND_DETAIL.map((b) => [b.jump, b]));
}

function defaultCarouselMap() {
  return new Map(DEFAULT_CAROUSEL_DETAIL.map((c) => [c.jump, c]));
}

function defaultCategoryMap() {
  return new Map(DEFAULT_CATEGORY_DETAIL.map((c) => [c.code, c]));
}

function appendMissingDefaults<T>(
  remote: T[],
  defaults: T[],
  getKey: (item: T) => string,
): T[] {
  const keys = new Set(remote.map(getKey));
  const missing = defaults.filter((item) => !keys.has(getKey(item)));
  return missing.length ? [...remote, ...missing] : remote;
}

/** 缓存为空时直接用本地默认配置，保证首页不必等网络也能渲染 */
function buildFromCache(): PlatformConfigData {
  if (cache) {
    const cfg = cache;
    return {
      stores: cfg.stores?.length ? cfg.stores : DEFAULT_STORE_ADDRESS_DETAIL,
      brands: cfg.brands?.length
        ? appendMissingDefaults(cfg.brands, DEFAULT_BRAND_DETAIL, (b) => b.jump)
        : DEFAULT_BRAND_DETAIL,
      carousel: cfg.carousel?.length ? cfg.carousel : DEFAULT_CAROUSEL_DETAIL,
      categories: cfg.categories?.length
        ? appendMissingDefaults(cfg.categories, DEFAULT_CATEGORY_DETAIL, (c) => c.code)
        : DEFAULT_CATEGORY_DETAIL,
      updatedAt: cfg.updatedAt,
    };
  }
  return {
    stores: DEFAULT_STORE_ADDRESS_DETAIL,
    brands: DEFAULT_BRAND_DETAIL,
    carousel: DEFAULT_CAROUSEL_DETAIL,
    categories: DEFAULT_CATEGORY_DETAIL,
  };
}

function mergeStoreItem(
  remote: PlatformStoreItem,
  fallback?: PlatformStoreItem,
): StoreAddressItemInfoProps {
  const merged = {
    ...(fallback || {}),
    ...remote,
    shop: String(remote.shop).toUpperCase(),
  };
  return {
    ...merged,
    bg: toDisplayUrl(merged.bg),
    wechat: toDisplayUrl(merged.wechat),
    imgStyleMode: merged.imgStyle === 'contain' ? 'contain' : 'cover',
  };
}

function mergeBrandItem(
  remote: PlatformBrandItem,
  fallback?: PlatformBrandItem,
): BrandItemInfo {
  const merged = {
    ...(fallback || {}),
    ...remote,
    jump: remote.jump,
    brand: remote.brand ?? fallback?.brand ?? remote.jump,
  };
  return {
    ...merged,
    bg: merged.bg ? toDisplayUrl(merged.bg) : undefined,
  };
}

function mergeCategoryItem(
  remote: PlatformCategoryItem,
  fallback?: PlatformCategoryItem,
): PlatformCategoryItem & { bg?: string } {
  const merged = {
    ...(fallback || {}),
    ...remote,
    code: remote.code,
  };
  return {
    ...merged,
    bg: merged.bg ? toDisplayUrl(merged.bg) : undefined,
  };
}

function mergeCarouselItem(
  remote: PlatformCarouselItem,
  fallback?: PlatformCarouselItem,
): PlatformCarouselItem & { bg: string } {
  const merged = {
    ...(fallback || {}),
    ...remote,
    jump: remote.jump,
  };
  return {
    ...merged,
    bg: toDisplayUrl(merged.bg),
  };
}

export async function fetchPlatformConfig(force = false): Promise<void> {
  if (fetchPromise && !force) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await NetWorkApi<API.PlatformConfigResponse>({
        method: 'get',
        url: 'platform/config',
      });
      if (res.ok && res.data) {
        const payload = res.data as API.PlatformConfigData & {
          babyBike?: Partial<PlatformBrandItem>;
        };
        cache = {
          stores: payload.stores || [],
          brands: mergeBabyBikeIntoBrands(
            payload.brands || [],
            payload.babyBike,
          ),
          carousel: payload.carousel || [],
          categories: payload.categories || [],
          updatedAt: payload.updatedAt,
        };
      }
    } catch {
      // 接口失败保留本地默认配置，不抛错以免白屏
    } finally {
      notifyPlatformConfigChanged(true);
    }
  })();

  return fetchPromise;
}

export function getBrandDetailSync(): BrandItemInfo[] {
  const { brands } = buildFromCache();
  const defMap = defaultBrandMap();
  return brands.map((remote) => {
    const def = defMap.get(remote.jump);
    return mergeBrandItem(remote, def);
  });
}

export function getCarouselDetailSync(): (PlatformCarouselItem & { bg: string })[] {
  const { carousel } = buildFromCache();
  const defMap = defaultCarouselMap();
  return carousel.map((remote) => {
    const def = defMap.get(remote.jump);
    return mergeCarouselItem(remote, def);
  });
}

export function getCategoryDetailSync(): (PlatformCategoryItem & { bg?: string })[] {
  const { categories } = buildFromCache();
  const defMap = defaultCategoryMap();
  return categories
    .map((remote) => {
      const def = defMap.get(remote.code);
      return mergeCategoryItem(remote, def);
    })
    .sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999));
}

export function getStoreAddressDetailSync(): StoreAddressItemInfoProps[] {
  const { stores } = buildFromCache();
  const defMap = defaultStoreMap();
  return stores.map((remote) => {
    const def = defMap.get(String(remote.shop).toUpperCase());
    return mergeStoreItem(remote, def);
  });
}

export function getVisibleStoreAddressDetailSync(): StoreAddressItemInfoProps[] {
  return getStoreAddressDetailSync().filter((item) => !item.isHidden);
}

export function getCategoryCodesSetSync(): Set<string> {
  return new Set(getCategoryDetailSync().map((item) => item.code));
}

export function getBrandMapSync(): Record<string, string> {
  const map: Record<string, string> = {};
  getBrandDetailSync().forEach((item) => {
    map[item.jump] = item.title;
  });
  return map;
}

export function getCategoryMapSync(): Record<string, string> {
  const map: Record<string, string> = {};
  getCategoryDetailSync().forEach((item) => {
    map[item.code] = item.title;
  });
  return map;
}

export function getStoreByShop(shop: string): StoreAddressItemInfoProps | undefined {
  return getStoreAddressDetailSync().find(
    (item) => item.shop.toUpperCase() === shop.toUpperCase(),
  );
}

export function getShopDisplayNameSync(shop: string): string | null {
  if (!shop || shop === 'all') return null;
  const store = getStoreAddressDetailSync().find(
    (item) => item.shop.toUpperCase() === shop.toUpperCase(),
  );
  if (store) {
    return store.title.split(/\s+/)[0] || store.title;
  }
  const brand = getBrandDetailSync().find(
    (item) => item.brand.toUpperCase() === shop.toUpperCase(),
  );
  if (brand) return brand.title;
  return shop;
}

export { getBrandDetailSync as getBrandDetail };
export { getCarouselDetailSync as getCarouselDetail };
export { getCategoryDetailSync as getCategoryDetail };
