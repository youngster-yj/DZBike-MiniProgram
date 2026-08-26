import { BrandItemInfo, DEFAULT_BRAND_DETAIL, DEFAULT_CAROUSEL_DETAIL } from '@/data/platformDefaults';
import {
  getBrandDetailSync,
  getCarouselDetailSync,
} from '@/services/platformConfig';

export type { BrandItemInfo };
export { DEFAULT_BRAND_DETAIL, DEFAULT_CAROUSEL_DETAIL };

export const getBrandDetail = getBrandDetailSync;
export const getCarouselDetail = getCarouselDetailSync;
