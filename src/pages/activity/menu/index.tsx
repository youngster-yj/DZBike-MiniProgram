import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getMobileActivityMenuData, getActivityPagePath } from '@/data/navConfig';
import { MobileMenuList } from '@/components/MobileMenuList';


export default function ActivityMenuPage() {
  const menuData = getMobileActivityMenuData();

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
