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
  },
} satisfies UserConfigExport;
