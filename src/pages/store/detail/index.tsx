import { View, Swiper, SwiperItem, Image, Text, RichText } from '@tarojs/components';
import { useRouter, useShareAppMessage } from '@tarojs/taro';
import { useEffect, useRef, useState } from 'react';
import { fetchStoreDetail } from '@/services/api/store';
import { API } from '@/services/types';
import { toAssetUrl } from '@/utils/assetUrl';
import { getBrandMapSync, getCategoryMapSync, getStoreByShop } from '@/services/platformConfig';
import { StoreAddressCard } from '@/components/StoreAddressCard';
import { SharePosterModal } from '@/components/SharePoster';
import { ShareActionButton } from '@/components/ShareActionButton';
import { previewImages } from '@/utils/helpers';
import { buildProductH5Url, buildProductMiniPath } from '@/utils/shareUrl';
import { ensureShareCardImage, getShareCardImage } from '@/utils/shareCardImage';


export default function StoreDetailPage() {
  const router = useRouter();
  const id = router.params.id || '';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<API.StoreDetailDataResponse | null>(null);
  const [showSharePoster, setShowSharePoster] = useState(false);
  const shareCardPathRef = useRef('');

  useEffect(() => {
    if (!id) return;
    fetchStoreDetail(id)
      .then((res) => res.ok && setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const shareImage = data?.imgUrl?.[0] ? toAssetUrl(data.imgUrl[0]) : undefined;

  useEffect(() => {
    shareCardPathRef.current = '';
    if (!shareImage) return;
    let cancelled = false;
    ensureShareCardImage(shareImage).then((path) => {
      if (!cancelled && path) shareCardPathRef.current = path;
    });
    return () => {
      cancelled = true;
    };
  }, [shareImage]);

  useShareAppMessage(() => {
    const title = data?.name || '商品详情';
    const path = buildProductMiniPath(id);
    const ready = shareCardPathRef.current || getShareCardImage(shareImage);
    if (ready) {
      return { title, path, imageUrl: ready };
    }
    if (!shareImage) {
      return { title, path };
    }
    return {
      title,
      path,
      promise: ensureShareCardImage(shareImage).then((thumb) => {
        if (thumb) shareCardPathRef.current = thumb;
        // Menu-share last resort only
        return { title, path, imageUrl: thumb || shareImage };
      }),
    };
  });

  if (loading) return <View className="store-detail-index-loading">加载中...</View>;
  if (!data) return <View className="store-detail-index-loading">商品不存在</View>;

  const images = (data.imgUrl || []).map((item) => toAssetUrl(item));
  const storeInfo = getStoreByShop(data.shop);
  const brandLabel = getBrandMapSync()[data.brand] || data.brand;
  const typeLabel = getCategoryMapSync()[data.type] || data.type;
  const detailContent = data.detailMD || data.detail || '';

  return (
    <View className="store-detail-index-page store-detail-index-pageWithFooter">
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
        <View className="store-detail-index-nameRow">
          <Text className="store-detail-index-name">{data.name}</Text>
        </View>
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

      <View className="store-detail-index-detailFooter">
        <ShareActionButton
          fullWidth
          label="分享好物"
          onClick={() => setShowSharePoster(true)}
        />
      </View>

      <SharePosterModal
        visible={showSharePoster}
        payload={{
          kind: 'product',
          data: {
            title: data.name,
            imageUrl: shareImage || '',
            h5Url: buildProductH5Url(data.brand, data._id),
          },
        }}
        onClose={() => setShowSharePoster(false)}
        onShareImageReady={(tempPath) => {
          shareCardPathRef.current = tempPath;
        }}
      />
    </View>
  );
}
