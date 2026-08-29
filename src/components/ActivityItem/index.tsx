import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { API } from '@/services/types';
import { formatDateTime } from '@/utils/timeUtil';
import officialBg from '@/assets/activity/official.png';
import personalBg from '@/assets/activity/personal.png';

interface ActivityItemProps {
  data: API.ActivityListItemResponse;
  index?: number;
}

export function ActivityItem({ data, index = 0 }: ActivityItemProps) {
  const isPersonal = data.source === 'personal';
  const bg = isPersonal ? personalBg : officialBg;
  const [imgReady, setImgReady] = useState(false);
  const delay = Math.min(index, 7) * 40;

  const onDetail = () => {
    Taro.navigateTo({ url: `/pages/activity/bike/index?activity_id=${data._id}` });
  };

  return (
    <View
      className="ActivityItem-ActivityItem-card dz-list-enter"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onDetail}
    >
      <Image
        className={`ActivityItem-ActivityItem-bg dz-img-fade${imgReady ? ' dz-img-fade--in' : ''}`}
        src={bg}
        mode="aspectFill"
        onLoad={() => setImgReady(true)}
      />
      <View className="ActivityItem-ActivityItem-overlay" />
      <View className="ActivityItem-ActivityItem-main">
        <View className="ActivityItem-ActivityItem-header">
          <Text className="ActivityItem-ActivityItem-creator">发起人：{data.name}</Text>
          {data.joinCount > 0 && (
            <Text className="ActivityItem-ActivityItem-joinCount">
              已参加 <Text className="ActivityItem-ActivityItem-joinNum">{data.joinCount}</Text> 人
            </Text>
          )}
        </View>
        <View className="ActivityItem-ActivityItem-content">
          <Text className="ActivityItem-ActivityItem-title">{data.title}</Text>
        </View>
        <View className="ActivityItem-ActivityItem-footer">
          <Text>{formatDateTime(data.time)}</Text>
          <Text className={`ActivityItem-ActivityItem-tag${isPersonal ? ' ActivityItem-ActivityItem-tagPersonal' : ''}`}>
            {isPersonal ? '个人活动' : '官方活动'}
          </Text>
          {data.difficulty ? (
            <Text className="ActivityItem-ActivityItem-tag" style={{ marginLeft: '8px' }}>
              {{ leisure: '休闲', advanced: '进阶', challenge: '挑战' }[data.difficulty]}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
