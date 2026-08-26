export interface PaginationSchema {
  page: number;
  limit: number;
}

export declare namespace API {
  export interface ActionSucceeded {
    ok: boolean;
    reason: string;
  }

  export interface StoreListItemResponse {
    _id: string;
    brand: string;
    creatDate: number;
    imgUrl: string[];
    name: string;
    price: string;
    shop: string;
    type: string;
  }

  export interface StoreListResponse extends ActionSucceeded {
    code?: number;
    data: StoreListItemResponse[];
    pagination: PaginationSchema;
    total: number;
  }

  export interface StoreDetailDataResponse extends StoreListItemResponse {
    detail?: string;
    detailMD?: string;
  }

  export interface StoreDetailResponse extends ActionSucceeded {
    data: StoreDetailDataResponse;
    code?: number;
  }

  export interface ActiveFormResponse extends ActionSucceeded {
    data: { _id: string };
  }

  export interface UserPhoneResponse extends ActionSucceeded {
    data: string;
  }

  export interface JoinDataResponse extends ActionSucceeded {
    data: JoinDataProps[];
  }

  export interface ActivityJoinDataProps {
    _id: string;
    name: string;
    phone: string;
    isCheck: boolean;
  }

  export interface ActivityListItemResponse {
    content: string;
    creatDate: number;
    limit: number;
    name: string;
    source: 'personal' | 'official';
    time: number;
    endTime?: number;
    title: string;
    prize?: string;
    joinCount: number;
    isEnd: boolean;
    _id: string;
  }

  export interface ActivityListResponse extends ActionSucceeded {
    data: ActivityListItemResponse[];
    pagination: PaginationSchema;
    total: number;
  }

  export interface ShopListItemResponse {
    creatDate: number;
    limit: number;
    title: string;
    imgUrl: string[];
    detail: string;
    detailMD?: string;
    shop: string;
    time: number;
    joinCount: number;
    _id: string;
  }

  export interface ShopListResponse extends ActionSucceeded {
    data: ShopListItemResponse[];
    pagination: PaginationSchema;
    total: number;
  }

  export interface JoinDataProps {
    name: string;
    phone: string;
    isCheck: boolean;
    _id: string;
  }

  export interface ActivityDetailItemResponse {
    content: string;
    creatDate: number;
    joinData: JoinDataProps[];
    limit: number;
    name: string;
    phone: string;
    source: 'personal' | 'official';
    status: 'wait' | 'success';
    prize?: string;
    time: number;
    endTime?: number;
    title: string;
    isEnd: boolean;
    _id: string;
  }

  export interface ActivityDetailResponse extends ActionSucceeded {
    data: ActivityDetailItemResponse;
  }

  export interface ShopJoinDataProps {
    _id: string;
    name: string;
    phone: string;
    isCheck: boolean;
  }

  export interface ShopDetailItemResponse {
    creatDate: number;
    limit: number;
    title: string;
    imgUrl: string[];
    detail: string;
    detailMD?: string;
    shop: string;
    time: number;
    joinData: ShopJoinDataProps[];
    _id: string;
  }

  export interface ShopDetailResponse extends ActionSucceeded {
    data: ShopDetailItemResponse;
  }

  export interface CollectListItemResponse {
    creatDate: number;
    title: string;
    imgUrl: string[];
    detail: string;
    detailMD?: string;
    shop: string;
    time: number;
    _id: string;
  }

  export interface CollectListResponse extends ActionSucceeded {
    data: CollectListItemResponse[];
    pagination: PaginationSchema;
    total: number;
  }

  export interface CollectDetailResponse extends ActionSucceeded {
    data: CollectListItemResponse;
  }

  export interface PlatformConfigData {
    stores: import('@/data/platformDefaults').PlatformStoreItem[];
    brands: import('@/data/platformDefaults').PlatformBrandItem[];
    carousel: import('@/data/platformDefaults').PlatformCarouselItem[];
    categories: import('@/data/platformDefaults').PlatformCategoryItem[];
    updatedAt?: number;
  }

  export interface PlatformConfigResponse extends ActionSucceeded {
    data: PlatformConfigData;
  }
}

export interface StoreListParamsProps {
  shop?: string;
  brand?: string;
  type?: string;
  search?: string;
  offsetId?: string;
  page?: number;
  limit?: number;
  isStock?: boolean;
}

export interface ActiveFormParamsProps {
  name: string;
  phone: string;
  title: string;
  content: string;
  time: number;
  endTime?: number;
  key: string;
  prize?: string;
}

export interface ShopActiveFormParamsProps {
  activityId: string;
  name: string;
  phone: string;
  deviceId?: string;
}

export interface ComplaintFormParamsProps {
  shop: string;
  name: string;
  phone: string;
  content: string;
  deviceId?: string;
}

export interface WxLoginData {
  token: string;
  openid: string;
}
