import { View, Map, Button, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { openLocation } from '@/utils/helpers';


export default function MapPage() {
  const router = useRouter();
  const lat = Number(router.params.lat);
  const lng = Number(router.params.lng);
  const name = decodeURIComponent(router.params.name || '门店位置');
  const address = decodeURIComponent(router.params.address || '');

  const markers = Number.isFinite(lat) && Number.isFinite(lng)
    ? [{
        id: 1,
        latitude: lat,
        longitude: lng,
        title: name,
        width: 24,
        height: 34,
      }]
    : [];

  const onOpenNav = () => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      Taro.showToast({ title: '坐标无效', icon: 'none' });
      return;
    }
    openLocation({ latitude: lat, longitude: lng, name, address });
  };

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return <View className={"map-index-empty"}>暂无有效坐标</View>;
  }

  return (
    <View className={"map-index-page"}>
      <Map
        className={"map-index-map"}
        latitude={lat}
        longitude={lng}
        scale={16}
        markers={markers}
        showLocation
      />
      <View className={"map-index-panel"}>
        <Text className={"map-index-name"}>{name}</Text>
        {address && <Text className={"map-index-address"}>{address}</Text>}
        <Button className={"map-index-navBtn"} type="primary" onClick={onOpenNav}>
          打开导航
        </Button>
      </View>
    </View>
  );
}
