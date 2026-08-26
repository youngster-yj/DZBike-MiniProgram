import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { StoreAddressItemInfoProps } from '@/data/platformDefaults';
import { resolveGcj02FromLocation } from '@/utils/coordConvert';
import { makePhoneCall, previewImages } from '@/utils/helpers';
import phoneIcon from '@/assets/icons/phone.png';
import messageIcon from '@/assets/icons/message.png';
import locationIcon from '@/assets/icons/location.png';

interface StoreAddressCardProps {
  info: StoreAddressItemInfoProps;
}

export function StoreAddressCard({ info }: StoreAddressCardProps) {
  const onCall = () => makePhoneCall(info.phone);
  const onWechat = () => previewImages([info.wechat]);
  const onPreviewStore = () => previewImages([info.bg], info.bg);

  const onNavigate = () => {
    const coord = info.location ? resolveGcj02FromLocation(info.location) : null;
    if (!coord) {
      Taro.showToast({ title: '暂无导航信息', icon: 'none' });
      return;
    }
    Taro.navigateTo({
      url: `/pages/map/index?lat=${coord.lat}&lng=${coord.lng}&name=${encodeURIComponent(info.location?.name || info.title)}&address=${encodeURIComponent(info.address)}`,
    });
  };

  return (
    <View className="StoreAddressCard-StoreAddressCard-card">
      <View className="StoreAddressCard-StoreAddressCard-leftImg" onClick={onPreviewStore}>
        <Image
          className="StoreAddressCard-StoreAddressCard-bg"
          src={info.bg}
          mode={info.imgStyleMode === 'contain' ? 'aspectFit' : 'aspectFill'}
        />
      </View>
      <View className="StoreAddressCard-StoreAddressCard-content">
        <View>
          <Text className="StoreAddressCard-StoreAddressCard-title">{info.title}</Text>
          <Text className="StoreAddressCard-StoreAddressCard-sub">{info.subTitle}</Text>
          <Text className="StoreAddressCard-StoreAddressCard-address">{info.address}</Text>
        </View>
        <View className="StoreAddressCard-StoreAddressCard-actions">
          <View className="StoreAddressCard-StoreAddressCard-actionBtn" onClick={onCall}>
            <Image className="StoreAddressCard-StoreAddressCard-actionIcon" src={phoneIcon} mode="aspectFit" />
          </View>
          <View className="StoreAddressCard-StoreAddressCard-actionBtn" onClick={onWechat}>
            <Image className="StoreAddressCard-StoreAddressCard-actionIcon" src={messageIcon} mode="aspectFit" />
          </View>
          {info.location && (
            <View className="StoreAddressCard-StoreAddressCard-actionBtn" onClick={onNavigate}>
              <Image className="StoreAddressCard-StoreAddressCard-actionIcon" src={locationIcon} mode="aspectFit" />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
