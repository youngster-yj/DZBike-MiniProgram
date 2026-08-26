import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { API } from '@/services/types';
import { toAssetUrl } from '@/utils/assetUrl';
import { formatDateTime, isAfter } from '@/utils/timeUtil';
import { getShopDisplayNameSync } from '@/services/platformConfig';
import { ImagesGridBox } from '@/components/ImagesGridBox';

interface ShopItemProps {
  data: API.ShopListItemResponse;
}

export function ShopItem({ data }: ShopItemProps) {
  const images = (data.imgUrl || []).map((item) => toAssetUrl(item));
  const shopName = getShopDisplayNameSync(data.shop);
  const ended = isAfter(data.time);
  const limit = Number(data.limit);
  const joinCount = Number(data.joinCount);
  const quota = Number.isFinite(limit) && Number.isFinite(joinCount) ? limit - joinCount : null;

  const onDetail = () => {
    Taro.navigateTo({ url: `/pages/activity/shop/index?shop_id=${data._id}` });
  };

  return (
    <View className="ShopItem-ShopItem-item" onClick={onDetail}>
      <View className="ShopItem-ShopItem-cover">
        <ImagesGridBox size={112} images={images} />
      </View>
      <View className="ShopItem-ShopItem-content">
        {shopName && <Text className="ShopItem-ShopItem-shopTag">{shopName}</Text>}
        <Text className="ShopItem-ShopItem-title">{data.title}</Text>
        {data.detail && (
          <View className="ShopItem-ShopItem-detailWrap">
            <Text className="ShopItem-ShopItem-detail">{data.detail}</Text>
          </View>
        )}
        <View className="ShopItem-ShopItem-metaRow">
          <View className="ShopItem-ShopItem-time">
            {ended ? (
              <>
                <Text>{formatDateTime(data.time)}</Text>
                <Text className="ShopItem-ShopItem-endedTag">已结束</Text>
              </>
            ) : (
              <Text>截止：{formatDateTime(data.time)}</Text>
            )}
          </View>
          <View className="ShopItem-ShopItem-quota">
            {!ended && quota !== null && (
              quota > 0 ? <Text>剩余 {quota} 名</Text> : <Text className="ShopItem-ShopItem-fullTag">名额已满</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
