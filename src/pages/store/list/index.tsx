import { View, Input, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchStoreList } from '@/services/api/store';
import { API } from '@/services/types';
import { StoreItem } from '@/components/StoreItem';
import { EmptyState } from '@/components/EmptyState';
import {
  getBrandMapSync,
  getCategoryMapSync,
  getCategoryCodesSetSync,
  getCategoryDetailSync,
} from '@/services/platformConfig';
import { usePlatformConfigVersion } from '@/store/platformConfigStore';


export default function StoreListPage() {
  const router = useRouter();
  const configVersion = usePlatformConfigVersion();
  const brand = router.params.brand || '';
  const category = router.params.category || '';
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [dataSource, setDataSource] = useState<API.StoreListItemResponse[]>([]);
  const [offsetId, setOffsetId] = useState<string | undefined>();

  const isCategoryMode = !!(category && getCategoryCodesSetSync().has(category));

  const title = useMemo(() => {
    if (isCategoryMode) return getCategoryMapSync()[category] || category;
    if (brand) return getBrandMapSync()[brand] || brand;
    return '全部商品';
  }, [brand, category, configVersion, isCategoryMode]);

  const categories = useMemo(
    () => getCategoryDetailSync().filter((item) => !item.isHidden).map((item) => ({
      code: item.code,
      title: item.title,
    })),
    [configVersion],
  );

  const loadData = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        limit: 20,
        search: keyword || undefined,
        offsetId: reset ? undefined : offsetId,
      };
      if (isCategoryMode) {
        params.type = category;
      } else if (brand) {
        params.brand = brand;
        if (selectedType) params.type = selectedType;
      }
      const res = await fetchStoreList(params);
      if (res.ok) {
        const next = reset ? res.data : [...dataSource, ...res.data];
        setDataSource(next);
        setHasMore(next.length < res.total);
        const last = res.data[res.data.length - 1];
        setOffsetId(last?._id);
      }
    } catch {
      // handled in request
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [brand, category, keyword, offsetId, dataSource, loading, isCategoryMode, selectedType]);

  useEffect(() => {
    Taro.setNavigationBarTitle({ title });
  }, [title]);

  useEffect(() => {
    setSelectedType(undefined);
  }, [brand, category, configVersion]);

  useEffect(() => {
    setOffsetId(undefined);
    setDataSource([]);
    loadData(true);
  }, [brand, category, keyword, configVersion, selectedType]);

  usePullDownRefresh(() => {
    setOffsetId(undefined);
    setDataSource([]);
    loadData(true);
  });

  useReachBottom(() => {
    if (hasMore && !loading) loadData(false);
  });

  const onSearch = () => setKeyword(search.trim());

  const onCategoryChange = (code?: string) => {
    setSelectedType(code);
  };

  return (
    <View className="store-list-index-page">
      <View className="store-list-index-searchBar">
        <Input
          className="store-list-index-searchInput"
          placeholder="搜索商品名称"
          value={search}
          onInput={(e) => setSearch(e.detail.value)}
          confirmType="search"
          onConfirm={onSearch}
        />
        <View className="store-list-index-searchBtn" onClick={onSearch}>搜索</View>
      </View>

      {!isCategoryMode && categories.length > 0 && (
        <ScrollView className="store-list-index-filterScroll" scrollX enhanced showScrollbar={false}>
          <View className="store-list-index-filterRow">
            <View
              className={`store-list-index-chip${!selectedType ? ' store-list-index-chipActive' : ''}`}
              onClick={() => onCategoryChange(undefined)}
            >
              <Text>全部</Text>
            </View>
            {categories.map((item) => (
              <View
                key={item.code}
                className={`store-list-index-chip${selectedType === item.code ? ' store-list-index-chipActive' : ''}`}
                onClick={() => onCategoryChange(item.code)}
              >
                <Text>{item.title}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View className="store-list-index-list">
        {dataSource.map((item) => (
          <StoreItem key={item._id} data={item} />
        ))}
      </View>

      {loading && <View className="list-end">加载中...</View>}
      {!loading && dataSource.length === 0 && (
        <EmptyState title="暂无商品" description="换个关键词试试" />
      )}
      {!loading && !hasMore && dataSource.length > 0 && (
        <View className="list-end">已加载全部</View>
      )}
    </View>
  );
}
