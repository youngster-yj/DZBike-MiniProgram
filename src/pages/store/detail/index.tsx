import { View, Swiper, SwiperItem, Image, Text, RichText } from '@tarojs/components';
import { useRouter, useShareAppMessage } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { fetchStoreDetail } from '@/services/api/store';
import { API } from '@/services/types';
import { toAssetUrl } from '@/utils/assetUrl';
import { getBrandMapSync, getCategoryMapSync, getStoreByShop } from '@/services/platformConfig';
import { StoreAddressCard } from '@/components/StoreAddressCard';
import { previewImages } from '@/utils/helpers';


export default function StoreDetailPage() {
  const router = useRouter();
  const id = router.params.id || '';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<API.StoreDetailDataResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchStoreDetail(id)
      .then((res) => res.ok && setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  useShareAppMessage(() => ({
    title: data?.name || '商品详情',
    path: `/pages/store/detail/index?id=${id}`,
  }));

  if (loading) return <View className="store-detail-index-loading">加载中...</View>;
  if (!data) return <View className="store-detail-index-loading">商品不存在</View>;

  const images = (data.imgUrl || []).map((item) => toAssetUrl(item));
  const storeInfo = getStoreByShop(data.shop);
  const brandLabel = getBrandMapSync()[data.brand] || data.brand;
  const typeLabel = getCategoryMapSync()[data.type] || data.type;
  const detailContent = data.detailMD || data.detail || '';

  return (
    <View className="store-detail-index-page">
      <View className="store-detail-index-carouselWrap">
        <Swiper className="store-detail-index-swiper" indicatorDots circular>
          {images.map((src) => (
            <SwiperItem key={src}>
              <Image
                className="store-detail-index-image"
                src={src}
                mode="aspectFill"
                onClick={() => previewImages(images, src)}
              />
            </SwiperItem>
          ))}
        </Swiper>
      </View>

      <View className="store-detail-index-contentCard">
        <View className="store-detail-index-priceRow">
          <Text className="store-detail-index-priceIcon">¥</Text>
          <Text className="store-detail-index-price">{data.price}</Text>
        </View>
        <Text className="store-detail-index-name">{data.name}</Text>
        <View className="store-detail-index-meta">
          <Text>{brandLabel}</Text>
          <Text>{typeLabel}</Text>
        </View>
        {storeInfo && (
          <View className="store-detail-index-storeInline">
            <StoreAddressCard info={storeInfo} />
          </View>
        )}
      </View>

      {detailContent && (
        <View className="store-detail-index-introduce">
          <Text className="store-detail-index-detailTitle">商品信息</Text>
          <RichText className="store-detail-index-detailContent" nodes={detailContent.replace(/\n/g, '<br/>')} />
        </View>
      )}
    </View>
  );
}
