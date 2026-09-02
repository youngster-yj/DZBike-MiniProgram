import { View } from '@tarojs/components';
import Taro, { useShareAppMessage } from '@tarojs/taro';
import { useMemo } from 'react';
import { getMobileGoodsMenuData, getStoreListPath } from '@/data/navConfig';
import { usePlatformConfigVersion } from '@/store/platformConfigStore';
import { MobileMenuList } from '@/components/MobileMenuList';

export default function StoreMenuPage() {
  const configVersion = usePlatformConfigVersion();
  const menuData = useMemo(() => getMobileGoodsMenuData(), [configVersion]);

  useShareAppMessage(() => ({
    title: '达州自行车俱乐部 - 商品',
    path: '/pages/store/menu/index',
  }));

  const onNavigate = (key: string) => {
    if (key === 'sub-brands') return;
    Taro.navigateTo({ url: getStoreListPath(key, key === 'equip' ? 'category' : 'brand') });
  };

  return (
    <View className="store-menu-index-page">
      <MobileMenuList items={menuData} onSelect={onNavigate} variant="goods" />
    </View>
  );
}
