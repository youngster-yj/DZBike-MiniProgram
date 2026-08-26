import { View, Text } from '@tarojs/components';
import Taro, {
  useRouter,
  usePullDownRefresh,
  useReachBottom,
  useShareAppMessage,
} from '@tarojs/taro';
import { useCallback, useEffect, useState } from 'react';
import { fetchCollectList, fetchCollectDetail } from '@/services/api/collect';
import { API } from '@/services/types';
import { CollectCard } from '@/components/CollectCard';
import { EmptyState } from '@/components/EmptyState';
import { StoreAddressCard } from '@/components/StoreAddressCard';
import { ImagesGridBox } from '@/components/ImagesGridBox';
import { toAssetUrl } from '@/utils/assetUrl';
import { getStoreByShop } from '@/services/platformConfig';
import { formatDate } from '@/utils/timeUtil';


export default function CollectPage() {
  const router = useRouter();
  const collectId = router.params.collect_id || '';

  const [list, setList] = useState<API.CollectListItemResponse[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<API.CollectListItemResponse | null>(null);
  const [gridSize, setGridSize] = useState(686);

  useEffect(() => {
    Taro.getSystemInfo({
      success: (res) => setGridSize(res.windowWidth - 32),
    });
  }, []);

  const loadList = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const nextPage = reset ? 1 : page;
    try {
      const res = await fetchCollectList({ page: nextPage, limit: 10 });
      if (res.ok) {
        const data = reset ? res.data : [...list, ...res.data];
        setList(data);
        setHasMore(data.length < res.total);
        setPage(nextPage + 1);
      }
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [loading, page, list]);

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetchCollectDetail(id);
      if (res.ok) setDetail(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (collectId) loadDetail(collectId);
    else { setPage(1); setList([]); loadList(true); }
  }, [collectId]);

  usePullDownRefresh(() => {
    if (collectId) loadDetail(collectId);
    else { setPage(1); setList([]); loadList(true); }
  });

  useReachBottom(() => {
    if (!collectId && hasMore && !loading) loadList(false);
  });

  useShareAppMessage(() => ({
    title: detail?.title || '精彩日常',
    path: collectId
      ? `/pages/activity/collect/index?collect_id=${collectId}`
      : '/pages/activity/collect/index',
  }));

  if (collectId && detail) {
    const images = (detail.imgUrl || []).map((item) => toAssetUrl(item));
    const storeInfo = getStoreByShop(detail.shop);

    return (
      <View className="activity-collect-index-page activity-collect-index-pageDetail">
        <View className="activity-collect-index-gridWrap">
          <ImagesGridBox size={gridSize} images={images} />
        </View>
        <View className="activity-collect-index-detailCard">
          <Text className="activity-collect-index-title">{detail.title}</Text>
          <Text className="activity-collect-index-time">{formatDate(detail.time)}</Text>
          {detail.detail && <Text className="activity-collect-index-content">{detail.detail}</Text>}
          {detail.detailMD && <Text className="activity-collect-index-content">{detail.detailMD}</Text>}
        </View>
        {storeInfo && (
          <View className="activity-collect-index-storeWrap">
            <StoreAddressCard info={storeInfo} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="activity-collect-index-page">
      <View className="activity-collect-index-waterfall">
        <View className="activity-collect-index-column">
          {list.filter((_, i) => i % 2 === 0).map((item) => (
            <CollectCard key={item._id} data={item} />
          ))}
        </View>
        <View className="activity-collect-index-column">
          {list.filter((_, i) => i % 2 === 1).map((item) => (
            <CollectCard key={item._id} data={item} />
          ))}
        </View>
      </View>
      {!loading && list.length === 0 && (
        <EmptyState title="暂无精彩日常" description="骑行见闻即将更新" />
      )}
      {loading && <View className="list-end">加载中...</View>}
      {!loading && !hasMore && list.length > 0 && (
        <View className="list-end">已加载全部内容</View>
      )}
    </View>
  );
}
