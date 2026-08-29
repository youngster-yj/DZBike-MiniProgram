import { View } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { fetchStoreFavorites } from '@/services/api/store';
import { API } from '@/services/types';
import { StoreItem } from '@/components/StoreItem';
import { EmptyState } from '@/components/EmptyState';
import { ensureWxSession } from '@/utils/wxProfile';
import { showError } from '@/utils/helpers';

export default function FavoritesPage() {
  const [list, setList] = useState<API.StoreListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    setLoading(true);
    ensureWxSession()
      .then(() => fetchStoreFavorites())
      .then((res) => {
        if (res.ok) setList(res.data || []);
      })
      .catch((e) => showError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  });

  return (
    <View className="mine-favorites-page">
      <View className="store-list-index-list">
        {list.map((item, index) => (
          <StoreItem key={item._id} data={item} index={index} />
        ))}
      </View>
      {loading && <View className="list-end">加载中...</View>}
      {!loading && list.length === 0 && (
        <EmptyState title="暂无收藏" description="在商品详情可收藏心仪车型" />
      )}
    </View>
  );
}
