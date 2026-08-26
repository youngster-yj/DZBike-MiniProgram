import { getBrandDetailSync } from '@/services/platformConfig';

export interface MenuItemProps {
  label: string;
  key: string;
  desc?: string;
  children?: MenuItemProps[];
}

/** 非一级、非独立入口的品牌，收进「其余品牌」分组 */
function getSubBrandMenuItems(): MenuItemProps[] {
  return getBrandDetailSync()
    .filter((item) => item.level !== 1 && !item.isHidden && !item.navStandalone)
    .map((item) => ({ label: item.title, key: item.jump }));
}

/** 一级品牌（level === 1），首页/商品菜单优先展示 */
function getPrimaryBrandMenuItems(): MenuItemProps[] {
  return getBrandDetailSync()
    .filter((item) => item.level === 1 && !item.isHidden)
    .map((item) => ({ label: item.title, key: item.jump }));
}

/** 独立入口品牌（如童车），不并入「其余品牌」 */
function getStandaloneBrandMenuItems(): MenuItemProps[] {
  return getBrandDetailSync()
    .filter((item) => item.navStandalone && !item.isHidden)
    .map((item) => ({ label: item.title, key: item.jump }));
}

export function getMobileGoodsMenuData(): MenuItemProps[] {
  const primary = getPrimaryBrandMenuItems();
  const subBrands = getSubBrandMenuItems();
  const standalone = getStandaloneBrandMenuItems();
  const items: MenuItemProps[] = [...primary];
  if (subBrands.length > 0) {
    items.push({
      label: '其余品牌',
      key: 'sub-brands',
      desc: '速比特等更多品牌',
      children: subBrands,
    });
  }
  items.push(...standalone, { label: '骑行装备', key: 'equip' });
  return items;
}

export function getMobileActivityMenuData(): MenuItemProps[] {
  return [
    { label: '骑行活动', key: 'bike', desc: '俱乐部骑游报名' },
    { label: '店铺活动', key: 'shop', desc: '门店促销与优惠' },
    { label: '精彩日常', key: 'collect', desc: '骑行见闻与分享' },
  ];
}

export function getActivityPagePath(key: string): string {
  switch (key) {
    case 'bike':
      return '/pages/activity/bike/index';
    case 'shop':
      return '/pages/activity/shop/index';
    case 'collect':
      return '/pages/activity/collect/index';
    default:
      return '/pages/activity/menu/index';
  }
}

export function getStoreListPath(brandOrCategory: string, mode: 'brand' | 'category' = 'brand'): string {
  if (mode === 'category') {
    return `/pages/store/list/index?category=${brandOrCategory}`;
  }
  return `/pages/store/list/index?brand=${brandOrCategory}`;
}
