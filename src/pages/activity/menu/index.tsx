import { View } from '@tarojs/components';
import Taro, { useShareAppMessage } from '@tarojs/taro';
import { getMobileActivityMenuData, getActivityPagePath } from '@/data/navConfig';
import { MobileMenuList } from '@/components/MobileMenuList';

export default function ActivityMenuPage() {
  const menuData = getMobileActivityMenuData();

  useShareAppMessage(() => ({
    title: '达州自行车俱乐部 - 活动',
    path: '/pages/activity/menu/index',
  }));

  return (
    <View className="activity-menu-index-page">
      <MobileMenuList
        items={menuData}
        onSelect={(key) => Taro.navigateTo({ url: getActivityPagePath(key) })}
        variant="activity"
      />
    </View>
  );
}
