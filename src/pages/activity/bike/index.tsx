import { View, Text, Input, Button, Image, Picker } from '@tarojs/components';
import Taro, {
  useRouter,
  usePullDownRefresh,
  useReachBottom,
  useShareAppMessage,
} from '@tarojs/taro';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchActivityList,
  fetchActivityDetail,
  applyActivity,
  joinActivity,
  fetchOrganizerPhone,
  fetchShareKey,
  fetchJoinList,
} from '@/services/api/activity';
import { API } from '@/services/types';
import { ActivityItem } from '@/components/ActivityItem';
import { EmptyState } from '@/components/EmptyState';
import { TimelinessToolbar } from '@/components/TimelinessToolbar';
import { ActivityDisclaimer } from '@/components/ActivityDisclaimer';
import { FormDateTimePicker, buildTimestamp } from '@/components/FormDateTimePicker';
import { formatDateTime, isTimestampFuture } from '@/utils/timeUtil';
import { judgeName, judgePhone, showSuccess, showError, makePhoneCall } from '@/utils/helpers';
import { ApiError } from '@/services/request';
import { requestActivityAuditSubscribe } from '@/utils/wxSubscribe';
import officialBg from '@/assets/activity/official.png';
import personalBg from '@/assets/activity/personal.png';
import { Phone } from '@nutui/icons-react-taro';
import { ShareKeyGate } from '@/components/ShareKeyGate';
import { SharePosterModal } from '@/components/SharePoster';
import { ShareActionButton } from '@/components/ShareActionButton';
import { AnimatedModal } from '@/components/AnimatedModal';
import { buildBikeH5Url, buildBikeMiniPath } from '@/utils/shareUrl';
import { ensureShareCardImage, getShareCardImage } from '@/utils/shareCardImage';
import { hasCompleteProfile, hasWxIdentity, refreshWxProfile } from '@/utils/wxProfile';
import { getVisibleStoreAddressDetailSync, getShopDisplayNameSync } from '@/services/platformConfig';

/** 分享/Canvas 用包内固定路径（与 copy 到 dist/assets 一致） */
const SHARE_BANNER_OFFICIAL = '/assets/activity/official.png';
const SHARE_BANNER_PERSONAL = '/assets/activity/personal.png';

function getBikeShareBannerPath(source?: string) {
  return source === 'personal' ? SHARE_BANNER_PERSONAL : SHARE_BANNER_OFFICIAL;
}

const TIMELINESS_VALUES: Array<'underway' | 'finished'> = ['underway', 'finished'];



function showApiError(e: unknown, fallback: string) {

  if (e instanceof ApiError && e.displayed) return;

  showError(e instanceof Error ? e.message : fallback);

}



export default function BikeActivityPage() {

  const router = useRouter();

  const activityId = router.params.activity_id || '';



  const [timelinessIndex, setTimelinessIndex] = useState(0);

  const [list, setList] = useState<API.ActivityListItemResponse[]>([]);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState<API.ActivityDetailItemResponse | null>(null);

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const [showApply, setShowApply] = useState(false);

  const [showJoin, setShowJoin] = useState(false);

  const [showJoinList, setShowJoinList] = useState(false);

  const [showJoinListVerify, setShowJoinListVerify] = useState(false);

  const [showPhoneKey, setShowPhoneKey] = useState(false);

  const [joinList, setJoinList] = useState<API.JoinDataProps[]>([]);



  const [applyForm, setApplyForm] = useState({
    name: '', phone: '', title: '', content: '', key: '', prize: '',
    meetupShop: '', limit: '50', difficulty: '' as '' | 'leisure' | 'advanced' | 'challenge',
  });
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [joinForm, setJoinForm] = useState({ name: '', phone: '', key: '' });
  const [wxJoinMode, setWxJoinMode] = useState(false);

  const [joinListForm, setJoinListForm] = useState({ name: '', phone: '' });

  const [phoneKeyForm, setPhoneKeyForm] = useState({ key: '' });

  const [organizerPhone, setOrganizerPhone] = useState('');

  const [showShareKey, setShowShareKey] = useState(false);
  const [showSharePoster, setShowSharePoster] = useState(false);
  const [shareKey, setShareKey] = useState('');
  const shareKeyRef = useRef('');
  const shareCardPathRef = useRef('');

  const activityKeyFromQuery = router.params.activity_key
    ? decodeURIComponent(router.params.activity_key)
    : '';



  const loadList = useCallback(async (reset = false) => {

    if (loading) return;

    setLoading(true);

    const nextPage = reset ? 1 : page;

    try {

      const res = await fetchActivityList({

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

      const res = await fetchActivityDetail(id);

      if (res.ok) setDetail(res.data);

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    if (activityId) {

      loadDetail(activityId);

    } else {

      setPage(1);

      setList([]);

      loadList(true);

    }

  }, [activityId, timelinessIndex]);

  useEffect(() => {
    if (activityKeyFromQuery) {
      setJoinForm((prev) => ({ ...prev, key: activityKeyFromQuery }));
      setShareKey(activityKeyFromQuery);
      shareKeyRef.current = activityKeyFromQuery;
    }
  }, [activityKeyFromQuery]);



  usePullDownRefresh(() => {

    if (activityId) loadDetail(activityId);

    else { setPage(1); setList([]); loadList(true); }

  });



  useReachBottom(() => {

    if (!activityId && hasMore && !loading) loadList(false);

  });



  useEffect(() => {
    shareCardPathRef.current = '';
    if (!detail) return;
    const cover = getBikeShareBannerPath(detail.source);
    let cancelled = false;
    ensureShareCardImage(cover).then((path) => {
      if (!cancelled && path) shareCardPathRef.current = path;
    });
    return () => {
      cancelled = true;
    };
  }, [detail]);

  useShareAppMessage(() => {
    const title = detail?.title || '骑行活动';
    const path = activityId
      ? buildBikeMiniPath(activityId, shareKeyRef.current || activityKeyFromQuery)
      : '/pages/activity/bike/index';
    const coverSrc = getBikeShareBannerPath(detail?.source);
    const ready = shareCardPathRef.current || getShareCardImage(coverSrc);
    if (ready) {
      return { title, path, imageUrl: ready };
    }
    return {
      title,
      path,
      promise: ensureShareCardImage(coverSrc).then((thumb) => {
        if (thumb) shareCardPathRef.current = thumb;
        // Menu-share last resort only: packaged asset if thumb failed
        return { title, path, imageUrl: thumb || coverSrc };
      }),
    };
  });



  const allowJoin = useMemo(() => {

    if (!detail) return false;

    return isTimestampFuture(detail.time)

      && isTimestampFuture(detail.endTime)

      && !detail.isEnd;

  }, [detail]);



  const onApply = async () => {
    const nameErr = judgeName(applyForm.name);
    const phoneErr = judgePhone(applyForm.phone);
    if (nameErr !== true) return showError(String(nameErr));
    if (phoneErr !== true) return showError(String(phoneErr));
    if (!applyForm.title || !applyForm.content || !applyForm.key || !startDate || !startTime) {
      return showError('请填写完整活动信息');
    }
    const limitNum = Number(applyForm.limit);
    if (!Number.isFinite(limitNum) || limitNum < 1) return showError('请填写有效报名人数');
    try {
      await requestActivityAuditSubscribe();
      const res = await applyActivity({
        name: applyForm.name,
        phone: applyForm.phone,
        title: applyForm.title,
        content: applyForm.content,
        key: applyForm.key,
        prize: applyForm.prize || undefined,
        meetupShop: applyForm.meetupShop || undefined,
        limit: limitNum,
        difficulty: applyForm.difficulty || undefined,
        time: buildTimestamp(startDate, startTime),
        endTime: endDate && endTime ? buildTimestamp(endDate, endTime) : undefined,
      });
      if (res.ok) {
        showSuccess('提交成功，等待审核');
        setShowApply(false);
      }
    } catch (e) {
      showApiError(e, '提交失败');
    }
  };

  const openJoinModal = async () => {
    try {
      const profile = await refreshWxProfile();
      if (hasCompleteProfile(profile)) {
        setWxJoinMode(true);
        setJoinForm({
          name: profile!.nickName,
          phone: profile!.phone,
          key: '',
        });
        setShowJoin(true);
        return;
      }
      showError('请先在「我的」完善微信昵称与手机号后再报名');
    } catch {
      setWxJoinMode(false);
      setJoinForm({ name: '', phone: '', key: '' });
      setShowJoin(true);
    }
  };

  const onJoin = async () => {
    if (wxJoinMode) {
      if (!joinForm.name || !joinForm.phone) {
        return showError('请先在「我的」完善微信资料与手机号');
      }
    } else {
      const nameErr = judgeName(joinForm.name);
      const phoneErr = judgePhone(joinForm.phone);
      if (nameErr !== true) return showError(String(nameErr));
      if (phoneErr !== true) return showError(String(phoneErr));
      if (!joinForm.key) return showError('请输入活动口令');
    }
    if (!detail) return;
    try {
      await requestActivityAuditSubscribe();
      const res = await joinActivity({
        activityId: detail._id,
        name: wxJoinMode ? undefined : joinForm.name,
        phone: wxJoinMode ? undefined : joinForm.phone,
        key: wxJoinMode ? undefined : joinForm.key,
      });
      if (res.ok) {
        showSuccess('报名成功');
        setShowJoin(false);
        loadDetail(detail._id);
      }
    } catch (e) {
      showApiError(e, '报名失败');
    }
  };



  const onFetchPhone = async () => {
    if (!detail) return;
    if (!phoneKeyForm.key) return showError('请输入口令');
    try {
      const res = await fetchOrganizerPhone({
        activityId: detail._id,
        key: phoneKeyForm.key,
      });
      if (res.ok) {
        setShowPhoneKey(false);
        makePhoneCall(res.data);
      }
    } catch (e) {
      showApiError(e, '验证失败');
    }
  };



  const onFetchJoinList = async () => {

    if (!detail) return;

    const nameErr = judgeName(joinListForm.name);

    const phoneErr = judgePhone(joinListForm.phone);

    if (nameErr !== true) return showError(String(nameErr));

    if (phoneErr !== true) return showError(String(phoneErr));

    try {

      const res = await fetchJoinList({

        activityId: detail._id,

        name: joinListForm.name,

        phone: joinListForm.phone,

      });

      if (res.ok) {

        showSuccess('信息获取成功');

        setJoinList(res.data);

        setShowJoinListVerify(false);

        setShowJoinList(true);

      }

    } catch (e) {

      showApiError(e, '获取失败');

    }

  };



  const openPhoneKeyModal = async () => {
    if (!detail) return;
    setOrganizerPhone('');
    setPhoneKeyForm({ key: '' });
    if (hasWxIdentity()) {
      try {
        const res = await fetchOrganizerPhone({ activityId: detail._id });
        if (res.ok) {
          makePhoneCall(res.data);
        }
      } catch (e) {
        showApiError(e, '获取失败');
      }
      return;
    }
    setShowPhoneKey(true);
  };

  const openSharePoster = (key: string) => {
    shareKeyRef.current = key;
    setShareKey(key);
    setShowShareKey(false);
    setShowSharePoster(true);
  };

  const onShareActivity = async () => {
    if (!detail) return;
    const existingKey = shareKeyRef.current || activityKeyFromQuery;
    if (existingKey) {
      openSharePoster(existingKey);
      return;
    }
    if (hasWxIdentity()) {
      try {
        const res = await fetchShareKey({ activityId: detail._id });
        if (res.ok && res.data?.key) {
          openSharePoster(res.data.key);
          return;
        }
        showError(res.reason || '获取分享口令失败');
      } catch (e) {
        showApiError(e, '获取分享口令失败');
      }
      return;
    }
    setShowShareKey(true);
  };

  const sharePosterPayload = useMemo(() => {
    if (!detail || !shareKey) return null;
    return {
      kind: 'activity' as const,
      data: {
        title: detail.title,
        activityKey: shareKey,
        publisherName: detail.name,
        startTimeText: formatDateTime(detail.time),
        bannerSrc: getBikeShareBannerPath(detail.source),
        h5Url: buildBikeH5Url(detail._id, shareKey),
      },
    };
  }, [detail, shareKey]);



  if (activityId && detail) {

    const heroBg = detail.source === 'personal' ? personalBg : officialBg;



    return (

      <View className="activity-bike-index-detailPage">

        <View className="activity-bike-index-heroWrap">

          <Image className="activity-bike-index-heroImg" src={heroBg} mode="aspectFill" />

        </View>



        <View className="activity-bike-index-infoBox">

          <View className="activity-bike-index-contentCard">

            <Text className="activity-bike-index-activityTitle">{detail.title}</Text>

            <View className="activity-bike-index-statusRow">

              <Text className={`activity-bike-index-tag${detail.source === 'personal' ? ' activity-bike-index-tagPersonal' : ' activity-bike-index-tagOfficial'}`}>

                {detail.source === 'personal' ? '个人活动' : '官方活动'}

              </Text>

              {!isTimestampFuture(detail.time) && (

                <Text className="activity-bike-index-tag activity-bike-index-tagEnded">活动已结束</Text>

              )}

              {detail.endTime && !isTimestampFuture(detail.endTime) && (

                <Text className="activity-bike-index-tag activity-bike-index-tagClosed">报名已截止</Text>

              )}

            </View>



            <View className="activity-bike-index-infoList">

              <View className="activity-bike-index-infoItem">

                <Text className="activity-bike-index-infoLabel">发布方</Text>

                <Text className="activity-bike-index-infoValue">{detail.name}</Text>

              </View>

              <View className="activity-bike-index-infoItem">

                <Text className="activity-bike-index-infoLabel">联系电话</Text>

                <View className="activity-bike-index-infoValue">

                  <View className="activity-bike-index-phoneRow">

                    <Text className="activity-bike-index-phoneNumber">{detail.phone}</Text>

                    <View className="activity-bike-index-phoneBtn" onClick={openPhoneKeyModal}>
                      <Phone className="activity-bike-index-phoneBtnIcon" style={{ color: '#16a34a' }} size={14} />
                    </View>

                  </View>

                </View>

              </View>

              <View className="activity-bike-index-infoItem">
                <Text className="activity-bike-index-infoLabel">开始时间</Text>
                <Text className="activity-bike-index-infoValue">{formatDateTime(detail.time)}</Text>
              </View>

              {detail.meetupShop ? (
                <View className="activity-bike-index-infoItem">
                  <Text className="activity-bike-index-infoLabel">集合门店</Text>
                  <Text className="activity-bike-index-infoValue">
                    {getShopDisplayNameSync(detail.meetupShop) || detail.meetupShop}
                  </Text>
                </View>
              ) : null}

              <View className="activity-bike-index-infoItem">
                <Text className="activity-bike-index-infoLabel">报名人数</Text>
                <Text className="activity-bike-index-infoValue">
                  {Math.max(detail.joinCount ?? 0, detail.joinData?.length ?? 0)}/{detail.limit}
                </Text>
              </View>

              {detail.difficulty ? (
                <View className="activity-bike-index-infoItem">
                  <Text className="activity-bike-index-infoLabel">难度</Text>
                  <Text className="activity-bike-index-infoValue">
                    {{ leisure: '休闲', advanced: '进阶', challenge: '挑战' }[detail.difficulty]}
                  </Text>
                </View>
              ) : null}

              {detail.endTime ? (

                <View className="activity-bike-index-infoItem">

                  <Text className="activity-bike-index-infoLabel">报名截止时间</Text>

                  <Text className="activity-bike-index-infoValue">{formatDateTime(detail.endTime)}</Text>

                </View>

              ) : null}

              <View className="activity-bike-index-infoItem">

                <Text className="activity-bike-index-infoLabel">活动简介</Text>

                <Text className="activity-bike-index-infoValue activity-bike-index-infoValueBlock">{detail.content}</Text>

              </View>

              {detail.prize ? (

                <View className="activity-bike-index-infoItem">

                  <Text className="activity-bike-index-infoLabel">活动奖品</Text>

                  <View className="activity-bike-index-infoValue">

                    <View className="activity-bike-index-prizeBox">

                      <Text className="activity-bike-index-prizeText">{detail.prize}</Text>

                    </View>

                  </View>

                </View>

              ) : null}

            </View>

          </View>



          <View className="activity-bike-index-joinBox">

            <Text className="activity-bike-index-joinBoxTitle">参与人员</Text>

            {(detail.joinData || []).length > 0 ? (

              <View className="activity-bike-index-participantList">

                {(detail.joinData || []).map((item) => (

                  <View key={item._id} className="activity-bike-index-participantRow">

                    <Text className="activity-bike-index-participantName">{item.name}</Text>

                    <Text className="activity-bike-index-participantPhone">{item.phone}</Text>

                    {detail.prize ? (

                      <Text className={`activity-bike-index-participantTag${item.isCheck ? ' activity-bike-index-participantTagDone' : ''}`}>

                        {item.isCheck ? '已领取' : '待领取'}

                      </Text>

                    ) : null}

                  </View>

                ))}

                <View className="activity-bike-index-publisherLink" onClick={() => setShowJoinListVerify(true)}>

                  <Text>查看参与详情</Text>

                  <Text className="activity-bike-index-publisherHint">发布者专用</Text>

                </View>

              </View>

            ) : (

              <Text className="activity-bike-index-noJoin">期待您的加入~</Text>

            )}

          </View>

        </View>



        <View className="activity-bike-index-detailFooter">
          <ShareActionButton
            label="分享活动"
            onClick={onShareActivity}
          />
          {allowJoin && (
            <Button
              className="activity-bike-index-joinBtn button-primary footer-action-btn"
              type="primary"
              hoverClass="none"
              onClick={openJoinModal}
            >
              参加活动
            </Button>
          )}
        </View>



        <AnimatedModal
          visible={showJoin}
          onClose={() => setShowJoin(false)}
          maskClassName="activity-bike-index-modal"
          bodyClassName="activity-bike-index-modalBody"
        >
          <Text className="activity-bike-index-modalTitle">参加活动</Text>
          {wxJoinMode ? (
            <>
              <Text className="form-input" style={{ opacity: 0.85 }}>{joinForm.name}</Text>
              <Text className="form-input" style={{ opacity: 0.85 }}>{joinForm.phone}</Text>
              <Text className="share-poster-remark">已使用微信资料报名，无需口令</Text>
            </>
          ) : (
            <>
              <Input className="form-input" placeholder="姓名或昵称" value={joinForm.name} onInput={(e) => setJoinForm({ ...joinForm, name: e.detail.value })} />
              <Input className="form-input" placeholder="手机号" type="number" value={joinForm.phone} onInput={(e) => setJoinForm({ ...joinForm, phone: e.detail.value })} />
              <Input className="form-input" placeholder="活动口令" value={joinForm.key} onInput={(e) => setJoinForm({ ...joinForm, key: e.detail.value })} />
            </>
          )}
          <View className="activity-bike-index-modalActions">
            <Button size="mini" onClick={() => setShowJoin(false)}>取消</Button>
            <Button size="mini" type="primary" className="button-primary" onClick={onJoin}>提交</Button>
          </View>
        </AnimatedModal>



        <AnimatedModal
          visible={showJoinListVerify}
          onClose={() => setShowJoinListVerify(false)}
          maskClassName="activity-bike-index-modal"
          bodyClassName="activity-bike-index-modalBody"
        >
          <Text className="activity-bike-index-modalTitle">仅活动创建者可查看</Text>
          <Text className="share-poster-remark">请输入创建本活动时的姓名与电话，用于核验发布者身份</Text>
          <Input className="form-input" placeholder="请输入姓名或昵称" value={joinListForm.name} onInput={(e) => setJoinListForm({ ...joinListForm, name: e.detail.value })} />
          <Input className="form-input" placeholder="请输入电话号" type="number" value={joinListForm.phone} onInput={(e) => setJoinListForm({ ...joinListForm, phone: e.detail.value })} />
          <View className="activity-bike-index-modalActions">
            <Button size="mini" onClick={() => setShowJoinListVerify(false)}>取消</Button>
            <Button size="mini" type="primary" className="button-primary" onClick={onFetchJoinList}>提交</Button>
          </View>
        </AnimatedModal>

        <AnimatedModal
          visible={showPhoneKey}
          onClose={() => setShowPhoneKey(false)}
          maskClassName="activity-bike-index-modal"
          bodyClassName="activity-bike-index-modalBody"
        >
          <Text className="activity-bike-index-modalTitle">获取发布者号码</Text>
          {!organizerPhone ? (
            <>
              <Input className="form-input" placeholder="请输入口令" value={phoneKeyForm.key} onInput={(e) => setPhoneKeyForm({ key: e.detail.value })} />
              <View className="activity-bike-index-modalActions">
                <Button size="mini" onClick={() => setShowPhoneKey(false)}>取消</Button>
                <Button size="mini" type="primary" className="button-primary" onClick={onFetchPhone}>提交</Button>
              </View>
            </>
          ) : (
            <>
              <View className="activity-bike-index-phoneResult">
                <Text className="activity-bike-index-phoneResultLabel">联系电话</Text>
                <Text className="activity-bike-index-phoneResultValue">{organizerPhone}</Text>
              </View>
              <View className="activity-bike-index-modalActions activity-bike-index-modalActionsDivider">
                <Button size="mini" onClick={() => setShowPhoneKey(false)}>关闭</Button>
              </View>
            </>
          )}
        </AnimatedModal>

        <ShareKeyGate
          visible={showShareKey}
          activityId={detail._id}
          onPass={openSharePoster}
          onClose={() => setShowShareKey(false)}
        />

        <SharePosterModal
          visible={showSharePoster && Boolean(shareKey)}
          payload={sharePosterPayload}
          onClose={() => setShowSharePoster(false)}
          onShareImageReady={(tempPath) => {
            shareCardPathRef.current = tempPath;
          }}
        />

        <AnimatedModal
          visible={showJoinList}
          onClose={() => setShowJoinList(false)}
          maskClassName="activity-bike-index-modal"
          bodyClassName="activity-bike-index-modalBody"
        >
          <Text className="activity-bike-index-modalTitle">完整报名列表</Text>
          {joinList.map((item) => (
            <Text key={item._id} className="activity-bike-index-joinItem">{item.name} {item.phone}</Text>
          ))}
          <View className="activity-bike-index-modalActions activity-bike-index-modalActionsDivider">
            <Button size="mini" onClick={() => setShowJoinList(false)}>关闭</Button>
          </View>
        </AnimatedModal>

      </View>

    );

  }



  return (

    <View className="activity-bike-index-page">

      <TimelinessToolbar

        value={timelinessIndex}

        onChange={setTimelinessIndex}

        action={

          <Button size="mini" type="primary" className="button-primary" onClick={() => setShowDisclaimer(true)}>

            发起活动

          </Button>

        }

      />



      <View className="activity-bike-index-list">

        {list.map((item, index) => (

          <ActivityItem key={item._id} data={item} index={index} />

        ))}

      </View>



      {!loading && list.length === 0 && <EmptyState title="暂无活动" />}

      {loading && <View className="list-end">加载中...</View>}



      <ActivityDisclaimer
        visible={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onAgree={async () => {
          setShowDisclaimer(false);
          try {
            const profile = await refreshWxProfile();
            if (hasCompleteProfile(profile)) {
              setApplyForm((f) => ({
                ...f,
                name: profile!.nickName,
                phone: profile!.phone,
              }));
            }
          } catch {
            /* ignore */
          }
          setShowApply(true);
        }}
      />

      <AnimatedModal
        visible={showApply}
        onClose={() => setShowApply(false)}
        maskClassName="activity-bike-index-modal"
        bodyClassName="activity-bike-index-modalBodyLarge"
      >
        <Text className="activity-bike-index-modalTitle">发起骑行活动</Text>
        <Input className="form-input" placeholder="昵称" value={applyForm.name} onInput={(e) => setApplyForm({ ...applyForm, name: e.detail.value })} />
        <Input className="form-input" placeholder="电话号" type="number" value={applyForm.phone} onInput={(e) => setApplyForm({ ...applyForm, phone: e.detail.value })} />
        <Input className="form-input" placeholder="活动主题" value={applyForm.title} onInput={(e) => setApplyForm({ ...applyForm, title: e.detail.value })} />
        <Input className="form-input" placeholder="活动简介" value={applyForm.content} onInput={(e) => setApplyForm({ ...applyForm, content: e.detail.value })} />
        <Input className="form-input" placeholder="活动口令" value={applyForm.key} onInput={(e) => setApplyForm({ ...applyForm, key: e.detail.value })} />
        <Picker
          mode="selector"
          range={getVisibleStoreAddressDetailSync().map((s) => s.title || s.shop)}
          onChange={(e) => {
            const shops = getVisibleStoreAddressDetailSync();
            const shop = shops[Number(e.detail.value)];
            if (shop) setApplyForm({ ...applyForm, meetupShop: shop.shop });
          }}
        >
          <View className="form-input" style={{ display: 'flex', alignItems: 'center' }}>
            {applyForm.meetupShop
              ? (getShopDisplayNameSync(applyForm.meetupShop) || applyForm.meetupShop)
              : '集合门店（可选）'}
          </View>
        </Picker>
        <Input
          className="form-input"
          placeholder="报名人数上限"
          type="number"
          value={applyForm.limit}
          onInput={(e) => setApplyForm({ ...applyForm, limit: e.detail.value })}
        />
        <View className="store-list-index-toolbar" style={{ paddingLeft: 0, paddingRight: 0, borderBottom: 'none' }}>
          {([
            { v: '', l: '不限难度' },
            { v: 'leisure', l: '休闲' },
            { v: 'advanced', l: '进阶' },
            { v: 'challenge', l: '挑战' },
          ] as const).map((d) => (
            <View
              key={d.v || 'none'}
              className={`store-list-index-priceChip${applyForm.difficulty === d.v ? ' store-list-index-priceChipActive' : ''}`}
              onClick={() => setApplyForm({ ...applyForm, difficulty: d.v })}
            >
              <Text>{d.l}</Text>
            </View>
          ))}
        </View>
        <FormDateTimePicker
          label="活动时间"
          date={startDate}
          time={startTime}
          onDateChange={setStartDate}
          onTimeChange={setStartTime}
        />
        <FormDateTimePicker
          label="报名截止时间（可选）"
          date={endDate}
          time={endTime}
          onDateChange={setEndDate}
          onTimeChange={setEndTime}
        />
        <Input className="form-input" placeholder="活动奖品 (可选)" value={applyForm.prize} onInput={(e) => setApplyForm({ ...applyForm, prize: e.detail.value })} />
        <View className="activity-bike-index-modalActions">
          <Button size="mini" onClick={() => setShowApply(false)}>取消</Button>
          <Button size="mini" type="primary" className="button-primary" onClick={onApply}>提交</Button>
        </View>
      </AnimatedModal>

    </View>

  );

}


