import { View, Image, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Location, Message, Phone } from '@nutui/icons-react-taro';
import { StoreAddressItemInfoProps } from '@/data/platformDefaults';
import { resolveGcj02FromLocation } from '@/utils/coordConvert';
import { makePhoneCall, previewImages } from '@/utils/helpers';

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
          <View className="StoreAddressCard-StoreAddressCard-actionBtn StoreAddressCard-StoreAddressCard-actionBtnPhone" onClick={onCall}>
            <Phone className="StoreAddressCard-StoreAddressCard-actionIcon" style={{ color: '#3182ce' }} size={15} />
          </View>
          <View className="StoreAddressCard-StoreAddressCard-actionBtn StoreAddressCard-StoreAddressCard-actionBtnWechat" onClick={onWechat}>
            <Message className="StoreAddressCard-StoreAddressCard-actionIcon" style={{ color: '#07C160' }} size={15} />
          </View>
          {info.location && (
            <View className="StoreAddressCard-StoreAddressCard-actionBtn StoreAddressCard-StoreAddressCard-actionBtnNav" onClick={onNavigate}>
              <Location className="StoreAddressCard-StoreAddressCard-actionIcon" style={{ color: '#0EA5E9' }} size={15} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
