import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { API } from '@/services/types';
import { toAssetUrl } from '@/utils/assetUrl';
import { formatDate } from '@/utils/timeUtil';

interface CollectCardProps {
  data: API.CollectListItemResponse;
}

export function CollectCard({ data }: CollectCardProps) {
  const cover = data.imgUrl?.[0] ? toAssetUrl(data.imgUrl[0]) : toAssetUrl('assets/nopic.jpg');

  const onDetail = () => {
    Taro.navigateTo({ url: `/pages/activity/collect/index?collect_id=${data._id}` });
  };

  return (
    <View className="CollectCard-CollectCard-item" onClick={onDetail}>
      <Image className="CollectCard-CollectCard-cover" src={cover} mode="aspectFill" lazyLoad />
      <View className="CollectCard-CollectCard-overlay">
        <Text className="CollectCard-CollectCard-title">{data.title}</Text>
        <Text className="CollectCard-CollectCard-time">{formatDate(data.time)}</Text>
      </View>
    </View>
  );
}
