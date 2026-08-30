import { View, Text, Input, Button } from '@tarojs/components';import Taro, {
  useRouter,
  usePullDownRefresh,
  useReachBottom,
  useShareAppMessage,
} from '@tarojs/taro';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchShopList, fetchShopDetail, joinShopActivity } from '@/services/api/shop';
import { API } from '@/services/types';
import { ShopItem } from '@/components/ShopItem';
import { EmptyState } from '@/components/EmptyState';
import { TimelinessToolbar } from '@/components/TimelinessToolbar';
import { StoreAddressCard } from '@/components/StoreAddressCard';
import { ImagesGridBox } from '@/components/ImagesGridBox';
import { toAssetUrl } from '@/utils/assetUrl';
import { getShowStoreAddressDetailSync } from '@/services/platformConfig';
import { formatDateTime, isTimestampFuture, maskName, maskPhone } from '@/utils/timeUtil';
import { judgeName, judgePhone, showSuccess, showError } from '@/utils/helpers';
import { getOrCreateDeviceId } from '@/utils/deviceId';
import { ApiError } from '@/services/request';
import { SharePosterModal } from '@/components/SharePoster';
import { ShareActionButton } from '@/components/ShareActionButton';
import { buildShopH5Url, buildShopMiniPath } from '@/utils/shareUrl';
import { ensureShareCardImage, getShareCardImage } from '@/utils/shareCardImage';
import { AnimatedModal } from '@/components/AnimatedModal';
import { hasWxIdentity, refreshWxProfile } from '@/utils/wxProfile';
import { WxAuthModal } from '@/components/WxAuthModal';
import { requestJoinRemindSubscribe, recordJoinRemindSubscribe } from '@/utils/wxSubscribe';
const TIMELINESS_VALUES: Array<'underway' | 'finished'> = ['underway', 'finished'];

function showApiError(e: unknown, fallback: string) {
  if (e instanceof ApiError && e.displayed) return;
  showError(e instanceof Error ? e.message : fallback);
}

export default function ShopActivityPage() {
  const router = useRouter();
  const shopId = router.params.shop_id || '';

  const [timelinessIndex, setTimelinessIndex] = useState(0);
  const [list, setList] = useState<API.ShopListItemResponse[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<API.ShopDetailItemResponse | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSharePoster, setShowSharePoster] = useState(false);
  const [joinForm, setJoinForm] = useState({ name: '', phone: '' });
  const [wxJoinMode, setWxJoinMode] = useState(false);
  const [gridSize, setGridSize] = useState(686);
  const shareCardPathRef = useRef('');

  useEffect(() => {
    Taro.getSystemInfo({
      success: (res) => setGridSize(res.windowWidth),
    });
  }, []);

  const loadList = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const nextPage = reset ? 1 : page;
    try {
      const res = await fetchShopList({
        page: nextPage,
        limit: 10,
        timeliness: TIMELINESS_VALUES[timelinessIndex],
      });
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
  }, [loading, page, list, timelinessIndex]);

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetchShopDetail(id);
      if (res.ok) setDetail(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shopId) loadDetail(shopId);
    else { setPage(1); setList([]); loadList(true); }
  }, [shopId, timelinessIndex]);

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
    if (shopId) loadDetail(shopId);
    else { setPage(1); setList([]); loadList(true); }
  });

  useReachBottom(() => {
    if (!shopId && hasMore && !loading) loadList(false);
  });

  useShareAppMessage(() => {
    const title = detail?.title || '店铺活动';
    const path = buildShopMiniPath(shopId);
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
  const quota = useMemo(() => {
    if (!detail) return null;
    const limit = Number(detail.limit);
    const joined = detail.joinData?.length ?? 0;
    if (!Number.isFinite(limit) || limit <= 0) return null;
    return Math.max(0, limit - joined);
  }, [detail]);

  const openJoinWithProfile = (profile: { nickName: string; phone: string }) => {
    setWxJoinMode(true);
    setJoinForm({ name: profile.nickName, phone: profile.phone });
    setShowJoin(true);
  };

  const openJoinModal = async () => {
    try {
      const profile = await refreshWxProfile();
      if (hasWxIdentity(profile)) {
        openJoinWithProfile(profile!);
        return;
      }
      setShowAuthModal(true);
    } catch {
      setWxJoinMode(false);
      setJoinForm({ name: '', phone: '' });
      setShowJoin(true);
    }
  };

  const onJoin = async () => {
    if (wxJoinMode) {
      if (!joinForm.name || !joinForm.phone) {
        setShowAuthModal(true);
        return;
      }
    } else {
      const nameErr = judgeName(joinForm.name);
      const phoneErr = judgePhone(joinForm.phone);
      if (nameErr !== true) return showError(String(nameErr));
      if (phoneErr !== true) return showError(String(phoneErr));
    }
    if (!detail) return;
    try {
      const acceptedRemind = await requestJoinRemindSubscribe('shop');
      const res = await joinShopActivity({
        activityId: detail._id,
        name: wxJoinMode ? undefined : joinForm.name,
        phone: wxJoinMode ? undefined : joinForm.phone,
        deviceId: getOrCreateDeviceId(),
      });
      if (res.ok) {
        if (acceptedRemind.length) {
          await recordJoinRemindSubscribe({
            kind: 'shop',
            activityId: detail._id,
            tmplIds: acceptedRemind,
          });
        }
        showSuccess(res.reason || '报名成功');
        setShowJoin(false);
        loadDetail(detail._id);
      }
    } catch (e) {
      showApiError(e, '报名失败');
    }
  };

  if (shopId && detail) {
    const images = (detail.imgUrl || []).map((item) => toAssetUrl(item));
    const storeList = getShowStoreAddressDetailSync(detail.shop);
    const active = isTimestampFuture(detail.time);

    return (
      <View className="activity-shop-index-detailPage">
        <View className="activity-shop-index-gridWrap">
          <ImagesGridBox size={gridSize} images={images} />
        </View>

        <View className="activity-shop-index-main">
          <View className="activity-shop-index-headerCard">
            <View className="activity-shop-index-titleRow">
              <Text className="activity-shop-index-detailTitle">{detail.title}</Text>
            </View>
            {detail.detail ? (
              <Text className="activity-shop-index-detailText">{detail.detail}</Text>
            ) : null}
            <View className="activity-shop-index-metaRow">
              <View className="activity-shop-index-deadline">
                <Text>截止时间：</Text>
                {active ? (
                  <Text>{formatDateTime(detail.time)}</Text>
                ) : (
                  <Text className="activity-shop-index-endedTag">活动已结束</Text>
                )}
              </View>
              <View className="activity-shop-index-quota">
                {active && quota !== null && (
                  quota > 0 ? <Text>剩余名额：{quota}</Text> : (
                    <Text className="activity-shop-index-fullTag">名额已满</Text>
                  )
                )}
              </View>
            </View>
            {detail.detailMD ? (
              <Text className="activity-shop-index-detailText">{detail.detailMD}</Text>
            ) : null}
          </View>

          <View className="activity-shop-index-joinBox">
            <Text className="activity-shop-index-joinBoxTitle">参与人员</Text>
            {(detail.joinData || []).length > 0 ? (
              <View className="activity-shop-index-participantList">
                {(detail.joinData || []).map((item) => (
                  <View key={item._id} className="activity-shop-index-participantRow">
                    <Text className="activity-shop-index-participantName">{maskName(item.name)}</Text>
                    <Text className="activity-shop-index-participantPhone">{maskPhone(item.phone)}</Text>
                    <Text className={`activity-shop-index-participantTag${item.isCheck ? ' activity-shop-index-participantTagDone' : ''}`}>
                      {item.isCheck ? '已到店' : '等待到店'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="activity-shop-index-noJoin">期待您的加入~</Text>
            )}
          </View>

          {storeList.length > 0 && (
            <View className="activity-shop-index-storeSection">
              {storeList.map((info) => (
                <StoreAddressCard key={info.shop} info={info} />
              ))}
            </View>
          )}
        </View>

        <View className="activity-shop-index-detailFooter">
          <ShareActionButton onClick={() => setShowSharePoster(true)} />
          {active && (
            <Button className="activity-shop-index-joinBtn button-primary footer-action-btn" type="primary" hoverClass="none" onClick={openJoinModal}>
              参与活动
            </Button>
          )}
        </View>

        <SharePosterModal
          visible={showSharePoster}
          payload={{
            kind: 'shop',
            data: {
              title: detail.title,
              detail: detail.detail || detail.detailMD,
              endTimeText: formatDateTime(detail.time),
              imageUrl: images[0] || '',
              h5Url: buildShopH5Url(detail._id),
            },
          }}
          onClose={() => setShowSharePoster(false)}
          onShareImageReady={(tempPath) => {
            shareCardPathRef.current = tempPath;
          }}
        />

        <AnimatedModal
          visible={showJoin}
          onClose={() => setShowJoin(false)}
          maskClassName="activity-shop-index-modal"
          bodyClassName="activity-shop-index-modalBody"
        >
          <Text className="activity-shop-index-modalTitle">参与活动</Text>
          {wxJoinMode ? (
            <>
              <Text className="form-input" style={{ opacity: 0.85 }}>{joinForm.name}</Text>
              <Text className="form-input" style={{ opacity: 0.85 }}>{joinForm.phone}</Text>
              <Text className="share-poster-remark">已使用微信资料报名</Text>
            </>
          ) : (
            <>
              <Input className="form-input" placeholder="姓名或昵称" value={joinForm.name} onInput={(e) => setJoinForm({ ...joinForm, name: e.detail.value })} />
              <Input className="form-input" placeholder="手机号" type="number" value={joinForm.phone} onInput={(e) => setJoinForm({ ...joinForm, phone: e.detail.value })} />
            </>
          )}
          <View className="activity-shop-index-modalActions">
            <Button size="mini" onClick={() => setShowJoin(false)}>取消</Button>
            <Button size="mini" type="primary" className="button-primary" onClick={onJoin}>提交</Button>
          </View>
        </AnimatedModal>

        <WxAuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(profile) => openJoinWithProfile(profile)}
        />
      </View>
    );
  }

  return (
    <View className="activity-shop-index-page">
      <TimelinessToolbar value={timelinessIndex} onChange={setTimelinessIndex} />

      <View className="activity-shop-index-list">
        {list.map((item, index) => (
          <ShopItem key={item._id} data={item} index={index} />
        ))}
      </View>

      {!loading && list.length === 0 && <EmptyState title="暂无店铺活动" />}
      {loading && <View className="list-end">加载中...</View>}
    </View>
  );
}
