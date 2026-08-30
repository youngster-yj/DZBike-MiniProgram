import type { UserConfigExport } from '@tarojs/cli';

/** 本地联调：接口与静态资源都走 DZBike-Server（默认 :3001） */
export default {
  logger: {
    quiet: false,
    stats: true,
  },
  mini: {},
  h5: {},
  env: {
    TARO_APP_API_BASE: '"http://localhost:3001/dz-bike/"',
    TARO_APP_ASSET_BASE: '"http://localhost:3001/"',
    TARO_APP_WX_SUBSCRIBE_ACTIVITY_AUDIT: '""',
    TARO_APP_WX_SUBSCRIBE_BIKE_REMIND: '"p1cqXA7eVAf8p0RMEuH-S9yd4Cvt2POI0gTj5AiGawc"',
    TARO_APP_WX_SUBSCRIBE_SHOP_REMIND: '"p1cqXA7eVAf8p0RMEuH-S9yd4Cvt2POI0gTj5AiGawc"',
  },
} satisfies UserConfigExport;
