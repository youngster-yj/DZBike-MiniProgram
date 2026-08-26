/** 内置门店编码（与后端 VALID_SHOPS 保持一致，新编码也可手动输入） */
export const PLATFORM_KNOWN_SHOPS = [
  'X-LAB',
  'PARDUS',
  'JAVA',
  'FOREVER',
  'TRINX',
  'TMIK',
  'SECONDBIKE',
] as const;

export interface MapLocationProps {
  dlat: string;
  dlon: string;
  name: string;
  show: 'all';
  /** 后端可能返回 [lng, lat]，也可能是 "lng lat" 字符串 */
  gaodeOnlineCenter: number[] | string;
}

export interface PlatformStoreItem {
  shop: string;
  title: string;
  subTitle: string;
  address: string;
  describe?: string;
  phone: number;
  bg: string;
  wechat: string;
  location?: MapLocationProps;
  isHidden?: boolean;
  imgStyle?: string;
}

export interface StoreAddressItemInfoProps extends PlatformStoreItem {
  imgStyleMode?: 'contain' | 'cover';
}

export interface PlatformBrandItem {
  title: string;
  brand: string;
  bg?: string;
  jump: string;
  level?: number;
  isHidden?: boolean;
  navStandalone?: boolean;
}

export interface BrandItemInfo extends PlatformBrandItem {
  bg?: string;
}

export interface PlatformCarouselItem {
  jump: string;
  title: string;
  subTitle: string;
  bg: string;
  bgColor: string;
  isHidden?: boolean;
}

export interface PlatformCategoryItem {
  code: string;
  title: string;
  bg?: string;
  isHidden?: boolean;
  sort?: number;
}

/** 接口未返回或失败时的门店兜底数据（与 Client 端保持一致） */
export const DEFAULT_STORE_ADDRESS_DETAIL: PlatformStoreItem[] = [
  {
    title: '喜德盛 X-LAB',
    subTitle: '龙郡外滩达州旗舰店',
    address: '达州市达川区南滨路三段475号',
    phone: 15508186565,
    bg: 'assets/brand/xds/store.jpg',
    shop: 'X-LAB',
    wechat: 'assets/brand/xds/wechat.jpg',
    location: {
      dlat: '107.4994882',
      dlon: '31.2158012',
      name: '达州市喜德盛自行车南滨路店',
      show: 'all',
      gaodeOnlineCenter: [107.492976, 31.209814],
    },
  },
  {
    title: '瑞豹 PARDUS',
    subTitle: '达州代理',
    address: '达州市达川区南滨路三段409号',
    phone: 13548298989,
    bg: 'assets/brand/pardus/store.jpg',
    shop: 'PARDUS',
    wechat: 'assets/brand/pardus/wechat.jpg',
    location: {
      dlat: '107.4998668',
      dlon: '31.2152040',
      name: '达州市瑞豹自行车',
      show: 'all',
      gaodeOnlineCenter: [107.493568, 31.208978],
    },
  },
  {
    title: '佳沃 JAVA',
    subTitle: '达州代理',
    address: '达州市达川区南滨路三段345号',
    phone: 13548298989,
    bg: 'assets/brand/java/store.jpg',
    shop: 'JAVA',
    wechat: 'assets/brand/pardus/wechat.jpg',
    location: {
      dlat: '107.5012861',
      dlon: '31.2138992',
      name: '达州市佳沃自行车',
      show: 'all',
      gaodeOnlineCenter: [107.494530, 31.207770],
    },
  },
  {
    title: '永久 FOREVER',
    subTitle: '龙郡外滩店',
    address: '达州市达川区南滨路三段471号',
    phone: 8889777,
    bg: 'assets/brand/forever/face.jpg',
    shop: 'FOREVER',
    wechat: 'assets/brand/xds/wechat.jpg',
    location: {
      dlat: '107.4998668',
      dlon: '31.2152040',
      name: '达州市永久自行车达川区店',
      show: 'all',
      gaodeOnlineCenter: [107.492804, 31.209893],
    },
  },
  {
    title: '千里达 TRINX',
    subTitle: '达州代理',
    address: '达州市达川区南滨路三段189号',
    phone: 13548298989,
    bg: 'assets/nopic.jpg',
    shop: 'TRINX',
    wechat: 'assets/brand/pardus/wechat.jpg',
    location: {
      dlat: '107.4998668',
      dlon: '31.2152040',
      name: '达州市千里达自行车',
      show: 'all',
      gaodeOnlineCenter: [107.493568, 31.208978],
    },
    isHidden: true,
  },
  {
    title: '天迈 TMIK',
    subTitle: '达州代理',
    address: '达州市达川区南滨路三段193号',
    phone: 18583736345,
    bg: 'assets/brand/tmik/TMIKFaceIcon.jpg',
    shop: 'TMIK',
    wechat: 'assets/brand/pardus/wechat.jpg',
    imgStyle: 'contain',
  },
  {
    title: '单车行',
    subTitle: '二手自行车',
    address: '达州市达川区南滨路三段189号',
    phone: 18583736345,
    bg: 'assets/nopic.jpg',
    shop: 'SECONDBIKE',
    wechat: 'assets/brand/pardus/wechat.jpg',
    isHidden: true,
  },
];

/** 品牌兜底列表；isHidden 的项不在首页展示 */
export const DEFAULT_BRAND_DETAIL: PlatformBrandItem[] = [
  { title: '喜德盛', brand: 'X-LAB', bg: 'assets/brand/xds/mybike.jpg', jump: 'xds', level: 1 },
  { title: '瑞豹', brand: 'PARDUS', bg: 'assets/brand/pardus/1.jpg', jump: 'pardus', level: 1 },
  { title: '佳沃', brand: 'JAVA', bg: 'assets/brand/java/1.jpg', jump: 'java', level: 1 },
  { title: '梅花', brand: 'Colnago', bg: 'assets/brand/colnago/face.jpg', jump: 'colnago', level: 1 },
  { title: '千里达', brand: 'TRINX', bg: 'assets/brand/trinx/1.png', jump: 'trinx', isHidden: true },
  { title: '坎普', brand: 'CAMP', bg: 'assets/brand/camp/1.jpg', jump: 'camp' },
  { title: '速比特', brand: 'SUNPEED', bg: 'assets/brand/sunpeed/1.png', jump: 'sunpeed' },
  { title: '永久', brand: 'FOREVER', bg: 'assets/brand/forever/face.jpg', jump: 'forever' },
  { title: '天迈', brand: 'TMIK', bg: 'assets/brand/tmik/face.jpg', jump: 'tmik' },
  { title: '格莱仕', brand: 'GALAXY', bg: 'assets/brand/galaxy/face.jpg', jump: 'galaxy' },
  { title: '大行', brand: 'DAHON', bg: 'assets/brand/dahon/1.jpg', jump: 'dahon' },
  { title: '骓特', brand: 'TWITTER', bg: 'assets/brand/twitter/1.png', jump: 'twitter' },
  { title: '精灵', brand: 'ELVES', bg: 'assets/brand/elves/1.png', jump: 'eleves' },
  {
    title: '童车',
    brand: 'BabyBike',
    bg: 'assets/type/babybike.jpg',
    jump: 'babyBike',
    navStandalone: true,
    isHidden: true,
  },
  { title: '其它', brand: 'OTHER', jump: 'other', isHidden: true },
];

/** 商品分类兜底；sort 越小越靠前 */
export const DEFAULT_CATEGORY_DETAIL: PlatformCategoryItem[] = [
  { code: 'roadBicycle', title: '公路车', sort: 1 },
  { code: 'mountainBike', title: '山地车', sort: 2 },
  { code: 'foldedBicycle', title: '折叠车', sort: 3 },
  { code: 'electricBike', title: '电动车', sort: 4 },
  { code: 'babyBike', title: '童车', bg: 'assets/type/babybike.jpg', sort: 5 },
  { code: 'equip', title: '装备', sort: 6 },
  { code: 'parts', title: '配件', sort: 7 },
  { code: 'maintenance', title: '维修', sort: 8 },
  { code: 'other', title: '其他', sort: 9 },
];

/** 首页轮播兜底；jump 对应品牌编码 */
export const DEFAULT_CAROUSEL_DETAIL: PlatformCarouselItem[] = [
  { jump: 'xds', title: '喜德盛', subTitle: 'X-LAB', bg: 'assets/brand/xds/face.jpg', bgColor: 'black' },
  { jump: 'pardus', title: '瑞豹', subTitle: 'PARDUS', bg: 'assets/brand/pardus/face.jpg', bgColor: 'rgb(20,20,20)' },
  { jump: 'java', title: '佳沃', subTitle: 'JAVA', bg: 'assets/brand/java/face.jpg', bgColor: 'black' },
  { jump: 'colnago', title: '梅花', subTitle: 'COLNAGO', bg: 'assets/brand/colnago/face.jpg', bgColor: 'black' },
  { jump: 'sunpeed', title: '速比特', subTitle: 'SUNPEED', bg: 'assets/brand/sunpeed/face.jpg', bgColor: 'black' },
];
