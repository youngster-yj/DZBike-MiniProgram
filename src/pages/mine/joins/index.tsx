import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { fetchMyActivityJoins } from '@/services/api/activity';
import { fetchMyShopJoins } from '@/services/api/shop';
import { EmptyState } from '@/components/EmptyState';
import { formatDateTime } from '@/utils/timeUtil';
import { ensureWxSession } from '@/utils/wxProfile';
import { showError } from '@/utils/helpers';

type TabKey = 'bike' | 'shop';

export default function MyJoinsPage() {
  const [tab, setTab] = useState<TabKey>('bike');
  const [bikeList, setBikeList] = useState<Awaited<ReturnType<typeof fetchMyActivityJoins>>['data']>([]);
  const [shopList, setShopList] = useState<Awaited<ReturnType<typeof fetchMyShopJoins>>['data']>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      await ensureWxSession();
      const [bikeRes, shopRes] = await Promise.all([
        fetchMyActivityJoins(),
        fetchMyShopJoins(),
      ]);
      if (bikeRes.ok) setBikeList(bikeRes.data || []);
      if (shopRes.ok) setShopList(shopRes.data || []);
    } catch (e) {
      showError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    load();
  });

  return (
    <View className="mine-joins-page">
      <View className="TimelinessToolbar-TimelinessToolbar-tabs mine-joins-tabs">
        <View
          className={`TimelinessToolbar-TimelinessToolbar-tab${tab === 'bike' ? ' TimelinessToolbar-TimelinessToolbar-tabActive' : ''}`}
          onClick={() => setTab('bike')}
        >
          <Text>骑行活动</Text>
        </View>
        <View
          className={`TimelinessToolbar-TimelinessToolbar-tab${tab === 'shop' ? ' TimelinessToolbar-TimelinessToolbar-tabActive' : ''}`}
          onClick={() => setTab('shop')}
        >
          <Text>店铺活动</Text>
        </View>
      </View>

      {loading && <View className="list-end">加载中...</View>}

      {!loading && tab === 'bike' && (
        <View className="mine-joins-list">
          {bikeList.length === 0 && <EmptyState title="暂无骑行报名" />}
          {bikeList.map((item) => (
            <View
              key={item.joinId}
              className="mine-joins-card"
              onClick={() => {
                if (item.activity?._id) {
                  Taro.navigateTo({ url: `/pages/activity/bike/index?activity_id=${item.activity._id}` });
                }
              }}
            >
              <Text className="mine-joins-title">{item.activity?.title || '活动已删除'}</Text>
              <Text className="mine-joins-meta">
                {item.activity?.time ? formatDateTime(item.activity.time) : ''}
              </Text>
              <Text className="mine-joins-meta">报名：{item.name} · {item.phone}</Text>
            </View>
          ))}
        </View>
      )}

      {!loading && tab === 'shop' && (
        <View className="mine-joins-list">
          {shopList.length === 0 && <EmptyState title="暂无店铺报名" />}
          {shopList.map((item) => (
            <View
              key={item.joinId}
              className="mine-joins-card"
              onClick={() => {
                if (item.activity?._id) {
                  Taro.navigateTo({ url: `/pages/activity/shop/index?shop_id=${item.activity._id}` });
                }
              }}
            >
              <Text className="mine-joins-title">{item.activity?.title || '活动已删除'}</Text>
              <Text className="mine-joins-meta">
                {item.activity?.time ? formatDateTime(item.activity.time) : ''}
              </Text>
              <Text className="mine-joins-meta">报名：{item.name} · {item.phone}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
