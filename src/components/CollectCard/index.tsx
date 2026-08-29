import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { API } from '@/services/types';
import { toAssetUrl } from '@/utils/assetUrl';
import { formatDate } from '@/utils/timeUtil';

interface CollectCardProps {
  data: API.CollectListItemResponse;
  index?: number;
}

export function CollectCard({ data, index = 0 }: CollectCardProps) {
  const cover = data.imgUrl?.[0] ? toAssetUrl(data.imgUrl[0]) : toAssetUrl('assets/nopic.jpg');
  const [imgReady, setImgReady] = useState(false);
  const delay = Math.min(index, 7) * 40;

  const onDetail = () => {
    Taro.navigateTo({ url: `/pages/activity/collect/index?collect_id=${data._id}` });
  };

  return (
    <View
      className="CollectCard-CollectCard-item dz-list-enter"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onDetail}
    >
      <Image
        className={`CollectCard-CollectCard-cover dz-img-fade${imgReady ? ' dz-img-fade--in' : ''}`}
        src={cover}
        mode="aspectFill"
        lazyLoad
        onLoad={() => setImgReady(true)}
      />
      <View className="CollectCard-CollectCard-overlay">
        <Text className="CollectCard-CollectCard-title">{data.title}</Text>
        <Text className="CollectCard-CollectCard-time">{formatDate(data.time)}</Text>
      </View>
    </View>
  );
}
