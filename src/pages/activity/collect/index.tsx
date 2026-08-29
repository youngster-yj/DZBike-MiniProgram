import { View, Text } from '@tarojs/components';
import Taro, {
  useRouter,
  usePullDownRefresh,
  useReachBottom,
  useShareAppMessage,
} from '@tarojs/taro';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCollectList, fetchCollectDetail } from '@/services/api/collect';
import { API } from '@/services/types';
import { CollectCard } from '@/components/CollectCard';
import { EmptyState } from '@/components/EmptyState';
import { StoreAddressCard } from '@/components/StoreAddressCard';
import { ImagesGridBox } from '@/components/ImagesGridBox';
import { toAssetUrl } from '@/utils/assetUrl';
import { getStoreByShop } from '@/services/platformConfig';
import { formatDate } from '@/utils/timeUtil';
import { SharePosterModal } from '@/components/SharePoster';
import { ShareActionButton } from '@/components/ShareActionButton';
import { buildCollectH5Url, buildCollectMiniPath } from '@/utils/shareUrl';
import { ensureShareCardImage, getShareCardImage } from '@/utils/shareCardImage';


export default function CollectPage() {
  const router = useRouter();
  const collectId = router.params.collect_id || '';

  const [list, setList] = useState<API.CollectListItemResponse[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<API.CollectListItemResponse | null>(null);
  const [showSharePoster, setShowSharePoster] = useState(false);
  const [gridSize, setGridSize] = useState(686);
  const shareCardPathRef = useRef('');

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

  useEffect(() => {
    shareCardPathRef.current = '';
    const cover = detail?.imgUrl?.[0] ? toAssetUrl(detail.imgUrl[0]) : '';
    if (!cover) return;
    let cancelled = false;
    ensureShareCardImage(cover).then((path) => {
      if (!cancelled && path) shareCardPathRef.current = path;
    });
    return () => {
      cancelled = true;
    };
  }, [detail]);

  usePullDownRefresh(() => {
    if (collectId) loadDetail(collectId);
    else { setPage(1); setList([]); loadList(true); }
  });

  useReachBottom(() => {
    if (!collectId && hasMore && !loading) loadList(false);
  });

  useShareAppMessage(() => {
    const title = detail?.title || '精彩日常';
    const path = buildCollectMiniPath(collectId);
    const coverSrc = detail?.imgUrl?.[0] ? toAssetUrl(detail.imgUrl[0]) : undefined;
    const ready = shareCardPathRef.current || getShareCardImage(coverSrc);
    if (ready) {
      return { title, path, imageUrl: ready };
    }
    if (!coverSrc) {
      return { title, path };
    }
    return {
      title,
      path,
      promise: ensureShareCardImage(coverSrc).then((thumb) => {
        if (thumb) shareCardPathRef.current = thumb;
        // Menu-share last resort only
        return { title, path, imageUrl: thumb || coverSrc };
      }),
    };
  });

  if (collectId && detail) {
    const images = (detail.imgUrl || []).map((item) => toAssetUrl(item));
    const storeInfo = getStoreByShop(detail.shop);

    return (
      <View className="activity-collect-index-page activity-collect-index-pageDetail">
        <View className="activity-collect-index-gridWrap">
          <ImagesGridBox size={gridSize} images={images} />
        </View>
        <View className="activity-collect-index-detailCard">
          <View className="activity-collect-index-titleRow">
            <Text className="activity-collect-index-title">{detail.title}</Text>
          </View>
          <Text className="activity-collect-index-time">{formatDate(detail.time)}</Text>
          {detail.detail && <Text className="activity-collect-index-content">{detail.detail}</Text>}
          {detail.detailMD && <Text className="activity-collect-index-content">{detail.detailMD}</Text>}
        </View>
        {storeInfo && (
          <View className="activity-collect-index-storeWrap">
            <StoreAddressCard info={storeInfo} />
          </View>
        )}

        <View className="activity-collect-index-detailFooter">
          <ShareActionButton fullWidth onClick={() => setShowSharePoster(true)} />
        </View>

        <SharePosterModal
          visible={showSharePoster}
          payload={{
            kind: 'collect',
            data: {
              title: detail.title,
              detail: detail.detail || detail.detailMD,
              shootTimeText: formatDate(detail.time),
              imageUrl: images[0] || '',
              h5Url: buildCollectH5Url(detail._id),
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

  return (
    <View className="activity-collect-index-page">
      <View className="activity-collect-index-waterfall">
        <View className="activity-collect-index-column">
          {list.filter((_, i) => i % 2 === 0).map((item, index) => (
            <CollectCard key={item._id} data={item} index={index} />
          ))}
        </View>
        <View className="activity-collect-index-column">
          {list.filter((_, i) => i % 2 === 1).map((item, index) => (
            <CollectCard key={item._id} data={item} index={index} />
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
