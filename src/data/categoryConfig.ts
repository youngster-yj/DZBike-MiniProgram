import {
  DEFAULT_CATEGORY_DETAIL,
  PlatformCategoryItem,
} from '@/data/platformDefaults';
import { getCategoryDetailSync } from '@/services/platformConfig';

export type { PlatformCategoryItem };
export { DEFAULT_CATEGORY_DETAIL };

export const getCategoryDetail = getCategoryDetailSync;
