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
import { showError } from '@/utils/helpers';

type SortMode = 'default' | 'price_asc' | 'price_desc';

export default function StoreListPage() {
  const router = useRouter();
  const configVersion = usePlatformConfigVersion();
  const brand = router.params.brand || '';
  const category = router.params.category || '';
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [sort, setSort] = useState<SortMode>('default');
  const [minPriceDraft, setMinPriceDraft] = useState('');
  const [maxPriceDraft, setMaxPriceDraft] = useState('');
  const [appliedMin, setAppliedMin] = useState<number | undefined>();
  const [appliedMax, setAppliedMax] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [dataSource, setDataSource] = useState<API.StoreListItemResponse[]>([]);
  const [offsetId, setOffsetId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const isCategoryMode = !!(category && getCategoryCodesSetSync().has(category));
  const hasPriceFilter = appliedMin != null || appliedMax != null;
  const usePageMode = sort !== 'default' || hasPriceFilter;

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
      const nextPage = reset ? 1 : page;
      const params: Record<string, unknown> = {
        limit: 20,
        search: keyword || undefined,
        sort,
        minPrice: appliedMin,
        maxPrice: appliedMax,
      };
      if (usePageMode) {
        params.page = nextPage;
      } else {
        params.offsetId = reset ? undefined : offsetId;
      }
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
        if (usePageMode) {
          setPage(nextPage + 1);
        } else {
          const last = res.data[res.data.length - 1];
          setOffsetId(last?._id);
        }
      }
    } catch {
      // handled in request
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [
    brand, category, keyword, offsetId, page, dataSource, loading,
    isCategoryMode, selectedType, sort, appliedMin, appliedMax, usePageMode,
  ]);

  useEffect(() => {
    Taro.setNavigationBarTitle({ title });
  }, [title]);

  useEffect(() => {
    setSelectedType(undefined);
  }, [brand, category, configVersion]);

  useEffect(() => {
    setOffsetId(undefined);
    setPage(1);
    setDataSource([]);
    loadData(true);
  }, [brand, category, keyword, configVersion, selectedType, sort, appliedMin, appliedMax]);

  usePullDownRefresh(() => {
    setOffsetId(undefined);
    setPage(1);
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

  const cycleSort = () => {
    setSort((prev) => {
      if (prev === 'default') return 'price_asc';
      if (prev === 'price_asc') return 'price_desc';
      return 'default';
    });
  };

  const applyPriceFilter = () => {
    const minRaw = minPriceDraft.trim();
    const maxRaw = maxPriceDraft.trim();
    const min = minRaw === '' ? undefined : Number(minRaw);
    const max = maxRaw === '' ? undefined : Number(maxRaw);
    if (minRaw !== '' && !Number.isFinite(min)) return showError('最低价无效');
    if (maxRaw !== '' && !Number.isFinite(max)) return showError('最高价无效');
    if (min != null && max != null && min > max) return showError('最低价不能高于最高价');
    setAppliedMin(min);
    setAppliedMax(max);
  };

  const clearPriceFilter = () => {
    setMinPriceDraft('');
    setMaxPriceDraft('');
    setAppliedMin(undefined);
    setAppliedMax(undefined);
  };

  const sortLabel =
    sort === 'price_asc' ? '价格升序 ↑' : sort === 'price_desc' ? '价格降序 ↓' : '默认排序';

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

        <View className="store-list-index-toolbar">
        <View
          className={`store-list-index-sortBtn${sort !== 'default' ? ' store-list-index-sortBtnActive' : ''}`}
          onClick={cycleSort}
        >
          <Text>{sortLabel}</Text>
        </View>
        <Input
          className="store-list-index-priceInput"
          type="digit"
          placeholder="最低价"
          value={minPriceDraft}
          onInput={(e) => setMinPriceDraft(e.detail.value)}
        />
        <Text className="store-list-index-priceSep">–</Text>
        <Input
          className="store-list-index-priceInput"
          type="digit"
          placeholder="最高价"
          value={maxPriceDraft}
          onInput={(e) => setMaxPriceDraft(e.detail.value)}
        />
        <View className="store-list-index-priceChip store-list-index-priceChipActive" onClick={applyPriceFilter}>
          <Text>筛选</Text>
        </View>
        {hasPriceFilter ? (
          <View className="store-list-index-priceChip" onClick={clearPriceFilter}>
            <Text>清除</Text>
          </View>
        ) : null}
      </View>

      <View className="store-list-index-list">
        {dataSource.map((item, index) => (
          <StoreItem key={item._id} data={item} index={index} />
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
