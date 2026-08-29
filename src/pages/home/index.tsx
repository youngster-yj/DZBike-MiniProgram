import { View, Swiper, SwiperItem, Image, Text } from '@tarojs/components';
import Taro, { useShareAppMessage, usePullDownRefresh } from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import {
  getBrandDetailSync,
  getCarouselDetailSync,
  getCategoryDetailSync,
  getVisibleStoreAddressDetailSync,
  fetchPlatformConfig,
} from '@/services/platformConfig';
import { usePlatformConfigReady, usePlatformConfigVersion } from '@/store/platformConfigStore';
import { StoreAddressCard } from '@/components/StoreAddressCard';
import { ActivityItem } from '@/components/ActivityItem';
import { ShopItem } from '@/components/ShopItem';
import { fetchActivityList } from '@/services/api/activity';
import { fetchShopList } from '@/services/api/shop';
import { getStoreListPath } from '@/data/navConfig';
import { API } from '@/services/types';

/** 首页活动/店铺预览：失败静默，不阻断门店与品牌等默认内容 */
function loadHomePreviewData(
  setActivities: (items: API.ActivityListItemResponse[]) => void,
  setShops: (items: API.ShopListItemResponse[]) => void,
) {
  fetchActivityList({ page: 1, limit: 5, timeliness: 'underway' })
    .then((res) => res.ok && setActivities(res.data))
    .catch(() => undefined);
  fetchShopList({ page: 1, limit: 5, timeliness: 'underway' })
    .then((res) => res.ok && setShops(res.data))
    .catch(() => undefined);
}

export default function HomePage() {
  const configReady = usePlatformConfigReady();
  const configVersion = usePlatformConfigVersion();
  const [activities, setActivities] = useState<API.ActivityListItemResponse[]>([]);
  const [shops, setShops] = useState<API.ShopListItemResponse[]>([]);

  useEffect(() => {
    if (!configReady) fetchPlatformConfig();
  }, [configReady]);

  useEffect(() => {
    loadHomePreviewData(setActivities, setShops);
  }, []);

  usePullDownRefresh(() => {
    fetchPlatformConfig(true)
      .then(() => loadHomePreviewData(setActivities, setShops))
      .finally(() => Taro.stopPullDownRefresh());
  });

  const carouselDetail = useMemo(
    () => getCarouselDetailSync().filter((item) => !item.isHidden),
    [configVersion],
  );
  const storeList = useMemo(
    () => getVisibleStoreAddressDetailSync(),
    [configVersion],
  );
  const brandList = useMemo(
    () => getBrandDetailSync().filter((item) => !item.isHidden),
    [configVersion],
  );
  const categoryList = useMemo(
    () => getCategoryDetailSync().filter((item) => !item.isHidden),
    [configVersion],
  );

  useShareAppMessage(() => ({
    title: '达州自行车俱乐部',
    path: '/pages/home/index',
  }));

  const goBrand = (jump: string) => {
    Taro.navigateTo({ url: getStoreListPath(jump, 'brand') });
  };

  const goCategory = (code: string) => {
    Taro.navigateTo({ url: getStoreListPath(code, 'category') });
  };

  return (
    <View className="home-index-page">
      {!configReady && (
        <View className="home-index-syncHint">正在同步最新配置...</View>
      )}

      <View className="home-index-carouselWrap">
        {carouselDetail.length > 0 ? (
          <Swiper
            className="home-index-carousel"
            autoplay
            circular
            indicatorDots
            indicatorColor="rgba(255,255,255,0.4)"
            indicatorActiveColor="#ffffff"
          >
            {carouselDetail.map((item) => (
              <SwiperItem key={item.jump}>
                <View
                  className="home-index-carouselItem"
                  style={{ backgroundColor: item.bgColor }}
                  onClick={() => goBrand(item.jump)}
                >
                  <Image className="home-index-carouselImg" src={item.bg} mode="aspectFill" />
                  <View className="home-index-carouselGradientTop" />
                  <View className="home-index-carouselGradientBottom" />
                  <View className="home-index-carouselText">
                    <View className="home-index-carouselCaption">
                      <Text className="home-index-carouselTitle">{item.title}</Text>
                      <Text className="home-index-carouselSub">{item.subTitle}</Text>
                    </View>
                  </View>
                </View>
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <View className="home-index-carousel home-index-carouselItem home-index-carouselEmpty">
            <Text className="home-index-carouselSub">暂无轮播内容</Text>
          </View>
        )}
      </View>

      <View className="section-title">门店地址</View>
      <View className="home-index-storeList">
        {storeList.map((item) => (
          <StoreAddressCard key={item.shop} info={item} />
        ))}
        <Text className="home-index-extend">门店持续扩展中...</Text>
      </View>

      {activities.length > 0 && (
        <>
          <View className="section-title">骑行活动</View>
          <View className="home-index-sectionBody">
            {activities.map((item, index) => (
              <ActivityItem key={item._id} data={item} index={index} />
            ))}
          </View>
        </>
      )}

      {shops.length > 0 && (
        <>
          <View className="section-title">店铺活动</View>
          <View className="home-index-sectionBody">
            {shops.map((item, index) => (
              <ShopItem key={item._id} data={item} index={index} />
            ))}
          </View>
        </>
      )}

      <View className="section-title">入驻品牌</View>
      <View className="home-index-brandGrid">
        {brandList.map((item) => (
          <View key={item.jump} className="home-index-brandItem" onClick={() => goBrand(item.jump)}>
            <View className="home-index-brandAvatar">
              {item.bg ? (
                <Image className="home-index-brandImg" src={item.bg} mode="aspectFill" />
              ) : (
                <View className="home-index-brandAvatarPlaceholder" />
              )}
            </View>
            <View className="home-index-brandLabel">
              <Text className="home-index-brandTitle">{item.title}</Text>
              <Text className="home-index-brandSub">{item.brand}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text className="home-index-extend">品牌持续洽谈中...</Text>

      <View className="section-title">商品分类</View>
      <View className="home-index-brandGrid">
        {categoryList.map((item) => (
          <View key={item.code} className="home-index-brandItem" onClick={() => goCategory(item.code)}>
            <View className="home-index-brandAvatar">
              {item.bg ? (
                <Image className="home-index-brandImg" src={item.bg} mode="aspectFill" />
              ) : (
                <View className="home-index-brandAvatarPlaceholder" />
              )}
            </View>
            <View className="home-index-brandLabel">
              <Text className="home-index-brandTitle">{item.title}</Text>
              <Text className="home-index-brandSub">{item.code}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
