import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { API } from '@/services/types';
import { toAssetUrl } from '@/utils/assetUrl';
import { makePhoneCall } from '@/utils/helpers';
import phoneIcon from '@/assets/icons/phone.png';

interface StoreItemProps {
  data: API.StoreListItemResponse;
}

function getShopPhone(shop?: string): string {
  if (shop === 'PARDUS') return '13548298989';
  return '15508186565';
}

export function StoreItem({ data }: StoreItemProps) {
  const cover = data.imgUrl?.[0] ? toAssetUrl(data.imgUrl[0]) : toAssetUrl('assets/nopic.jpg');

  const onDetail = () => {
    Taro.navigateTo({ url: `/pages/store/detail/index?id=${data._id}` });
  };

  const onPhone = (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    makePhoneCall(getShopPhone(data.shop));
  };

  return (
    <View className="StoreItem-StoreItem-item" onClick={onDetail}>
      <View className="StoreItem-StoreItem-imgBox">
        <Image className="StoreItem-StoreItem-cover" src={cover} mode="aspectFit" lazyLoad />
      </View>
      <View className="StoreItem-StoreItem-footer">
        <Text className="StoreItem-StoreItem-name">{data.name}</Text>
        <View className="StoreItem-StoreItem-detail">
          <Text className="StoreItem-StoreItem-price">
            <Text className="StoreItem-StoreItem-priceIcon">¥</Text>
            {data.price}
          </Text>
          <View className="StoreItem-StoreItem-phoneBtn" onClick={onPhone}>
            <Image className="StoreItem-StoreItem-phoneIcon" src={phoneIcon} mode="aspectFit" />
          </View>
        </View>
      </View>
    </View>
  );
}
