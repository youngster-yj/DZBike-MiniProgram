import { View, Text, Input, Button, Image } from '@tarojs/components';
import Taro, {
  useRouter,
  usePullDownRefresh,
  useReachBottom,
  useShareAppMessage,
} from '@tarojs/taro';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchActivityList,
  fetchActivityDetail,
  applyActivity,
  joinActivity,
  fetchOrganizerPhone,
  fetchJoinList,
} from '@/services/api/activity';
import { API } from '@/services/types';
import { ActivityItem } from '@/components/ActivityItem';
import { EmptyState } from '@/components/EmptyState';
import { TimelinessToolbar } from '@/components/TimelinessToolbar';
import { ActivityDisclaimer } from '@/components/ActivityDisclaimer';
import { FormDateTimePicker, buildTimestamp } from '@/components/FormDateTimePicker';
import { formatDateTime, maskPhone, isTimestampFuture } from '@/utils/timeUtil';
import { judgeName, judgePhone, showSuccess, showError } from '@/utils/helpers';
import { ApiError } from '@/services/request';
import { requestActivityAuditSubscribe } from '@/utils/wxSubscribe';
import officialBg from '@/assets/activity/official.png';
import personalBg from '@/assets/activity/personal.png';
import phoneIcon from '@/assets/icons/phone.png';

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

  const [showPublisher, setShowPublisher] = useState(false);

  const [joinList, setJoinList] = useState<API.JoinDataProps[]>([]);



  const [applyForm, setApplyForm] = useState({
    name: '', phone: '', title: '', content: '', key: '', prize: '',
  });
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [joinForm, setJoinForm] = useState({ name: '', phone: '', key: '' });

  const [creatorForm, setCreatorForm] = useState({ name: '', phone: '', key: '' });

  const [organizerPhone, setOrganizerPhone] = useState('');



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



  usePullDownRefresh(() => {

    if (activityId) loadDetail(activityId);

    else { setPage(1); setList([]); loadList(true); }

  });



  useReachBottom(() => {

    if (!activityId && hasMore && !loading) loadList(false);

  });



  useShareAppMessage(() => ({

    title: detail?.title || '骑行活动',

    path: activityId

      ? `/pages/activity/bike/index?activity_id=${activityId}`

      : '/pages/activity/bike/index',

  }));



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
    try {
      await requestActivityAuditSubscribe();
      const res = await applyActivity({
        ...applyForm,
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



  const onJoin = async () => {

    const nameErr = judgeName(joinForm.name);

    const phoneErr = judgePhone(joinForm.phone);

    if (nameErr !== true) return showError(String(nameErr));

    if (phoneErr !== true) return showError(String(phoneErr));

    if (!joinForm.key) return showError('请输入活动口令');

    if (!detail) return;

    try {

      const res = await joinActivity({

        activityId: detail._id,

        ...joinForm,

      });

      if (res.ok) {

        showSuccess(res.reason || '报名成功');

        setShowJoin(false);

        loadDetail(detail._id);

      }

    } catch (e) {

      showApiError(e, '报名失败');

    }

  };



  const onFetchPhone = async () => {

    if (!detail) return;

    const nameErr = judgeName(creatorForm.name);

    const phoneErr = judgePhone(creatorForm.phone);

    if (nameErr !== true) return showError(String(nameErr));

    if (phoneErr !== true) return showError(String(phoneErr));

    try {

      const res = await fetchOrganizerPhone({

        activityId: detail._id,

        ...creatorForm,

      });

      if (res.ok) setOrganizerPhone(res.data);

    } catch (e) {

      showApiError(e, '验证失败');

    }

  };



  const onFetchJoinList = async () => {

    if (!detail) return;

    try {

      const res = await fetchJoinList({

        activityId: detail._id,

        ...creatorForm,

      });

      if (res.ok) {

        setJoinList(res.data);

        setShowJoinList(true);

      }

    } catch (e) {

      showApiError(e, '获取失败');

    }

  };



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

                <View className="activity-bike-index-phoneRow">

                  <Text className="activity-bike-index-infoValue">{maskPhone(detail.phone)}</Text>

                  <View className="activity-bike-index-phoneBtn" onClick={() => setShowPublisher(true)}>
                    <Image className="activity-bike-index-phoneBtnIcon" src={phoneIcon} mode="aspectFit" />
                  </View>

                </View>

              </View>

              <View className="activity-bike-index-infoItem">

                <Text className="activity-bike-index-infoLabel">开始时间</Text>

                <Text className="activity-bike-index-infoValue">{formatDateTime(detail.time)}</Text>

              </View>

              {detail.endTime ? (

                <View className="activity-bike-index-infoItem">

                  <Text className="activity-bike-index-infoLabel">报名截止时间</Text>

                  <Text className="activity-bike-index-infoValue">{formatDateTime(detail.endTime)}</Text>

                </View>

              ) : null}

              <View className="activity-bike-index-infoItem activity-bike-index-infoItemBlock">

                <Text className="activity-bike-index-infoLabel">活动简介</Text>

                <Text className="activity-bike-index-infoBlock">{detail.content}</Text>

              </View>

              {detail.prize ? (

                <View className="activity-bike-index-infoItem activity-bike-index-infoItemBlock">

                  <Text className="activity-bike-index-infoLabel">活动奖品</Text>

                  <View className="activity-bike-index-prizeBox">

                    <Text className="activity-bike-index-prizeText">{detail.prize}</Text>

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

                        {item.isCheck ? '已领取' : '等待到店'}

                      </Text>

                    ) : null}

                  </View>

                ))}

                <View className="activity-bike-index-publisherLink" onClick={() => setShowPublisher(true)}>

                  <Text>查看参与详情</Text>

                  <Text className="activity-bike-index-publisherHint">发布者专用</Text>

                </View>

              </View>

            ) : (

              <Text className="activity-bike-index-noJoin">期待您的加入~</Text>

            )}

          </View>

        </View>



        {allowJoin && (

          <View className="activity-bike-index-detailFooter">

            <Button className="activity-bike-index-joinBtn button-primary" type="primary" onClick={() => setShowJoin(true)}>

              参加活动

            </Button>

          </View>

        )}



        {showJoin && (

          <View className="activity-bike-index-modal">

            <View className="activity-bike-index-modalBody">

              <Text className="activity-bike-index-modalTitle">参加活动</Text>

              <Input className="form-input" placeholder="姓名或昵称" value={joinForm.name} onInput={(e) => setJoinForm({ ...joinForm, name: e.detail.value })} />

              <Input className="form-input" placeholder="手机号" type="number" value={joinForm.phone} onInput={(e) => setJoinForm({ ...joinForm, phone: e.detail.value })} />

              <Input className="form-input" placeholder="活动口令" value={joinForm.key} onInput={(e) => setJoinForm({ ...joinForm, key: e.detail.value })} />

              <View className="activity-bike-index-modalActions">

                <Button size="mini" onClick={() => setShowJoin(false)}>取消</Button>

                <Button size="mini" type="primary" className="button-primary" onClick={onJoin}>提交</Button>

              </View>

            </View>

          </View>

        )}



        {showPublisher && (

          <View className="activity-bike-index-modal">

            <View className="activity-bike-index-modalBody">

              <Text className="activity-bike-index-modalTitle">发布者验证</Text>

              <Input className="form-input" placeholder="创建时姓名" value={creatorForm.name} onInput={(e) => setCreatorForm({ ...creatorForm, name: e.detail.value })} />

              <Input className="form-input" placeholder="创建时手机号" type="number" value={creatorForm.phone} onInput={(e) => setCreatorForm({ ...creatorForm, phone: e.detail.value })} />

              <Input className="form-input" placeholder="活动口令" value={creatorForm.key} onInput={(e) => setCreatorForm({ ...creatorForm, key: e.detail.value })} />

              <View className="activity-bike-index-rowBtns">

                <Button size="mini" onClick={onFetchPhone}>查看组织者电话</Button>

                <Button size="mini" onClick={onFetchJoinList}>查看完整报名</Button>

              </View>

              {organizerPhone ? <Text className="activity-bike-index-phone">组织者电话：{organizerPhone}</Text> : null}

              <Button size="mini" onClick={() => setShowPublisher(false)}>关闭</Button>

            </View>

          </View>

        )}



        {showJoinList && (

          <View className="activity-bike-index-modal">

            <View className="activity-bike-index-modalBody">

              <Text className="activity-bike-index-modalTitle">完整报名列表</Text>

              {joinList.map((item) => (

                <Text key={item._id} className="activity-bike-index-joinItem">{item.name} {item.phone}</Text>

              ))}

              <Button size="mini" onClick={() => setShowJoinList(false)}>关闭</Button>

            </View>

          </View>

        )}

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

        {list.map((item) => (

          <ActivityItem key={item._id} data={item} />

        ))}

      </View>



      {!loading && list.length === 0 && <EmptyState title="暂无活动" />}

      {loading && <View className="list-end">加载中...</View>}



      {showDisclaimer && (

        <ActivityDisclaimer

          onClose={() => setShowDisclaimer(false)}

          onAgree={() => {

            setShowDisclaimer(false);

            setShowApply(true);

          }}

        />

      )}



      {showApply && (

        <View className="activity-bike-index-modal">

          <View className="activity-bike-index-modalBodyLarge">

            <Text className="activity-bike-index-modalTitle">发起骑行活动</Text>

            <Input className="form-input" placeholder="昵称" value={applyForm.name} onInput={(e) => setApplyForm({ ...applyForm, name: e.detail.value })} />

            <Input className="form-input" placeholder="电话号" type="number" value={applyForm.phone} onInput={(e) => setApplyForm({ ...applyForm, phone: e.detail.value })} />

            <Input className="form-input" placeholder="活动主题" value={applyForm.title} onInput={(e) => setApplyForm({ ...applyForm, title: e.detail.value })} />

            <Input className="form-input" placeholder="活动简介" value={applyForm.content} onInput={(e) => setApplyForm({ ...applyForm, content: e.detail.value })} />

            <Input className="form-input" placeholder="活动口令" value={applyForm.key} onInput={(e) => setApplyForm({ ...applyForm, key: e.detail.value })} />

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

          </View>

        </View>

      )}

    </View>

  );

}


