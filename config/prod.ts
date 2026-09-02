import type { UserConfigExport } from '@tarojs/cli';

/** 生产构建：接口与静态资源走线上域名（npm run build:weapp 默认走这份配置） */
export default {
  mini: {},
  h5: {
    webpackChain(chain) {
      chain.merge({
        plugin: {
          install: {
            plugin: require('terser-webpack-plugin'),
            args: [
              {
                terserOptions: {
                  compress: true,
                  keep_classnames: true,
                  keep_fnames: true,
                },
              },
            ],
          },
        },
      });
    },
  },
  env: {
    // 直连 www，避免裸域 301 把 POST 登录改成 GET 导致 404
    TARO_APP_API_BASE: '"https://www.dzbike.club/dz-bike/"',
    TARO_APP_ASSET_BASE: '"https://www.dzbike.club/"',
    TARO_APP_WX_SUBSCRIBE_ACTIVITY_AUDIT: '""',
    TARO_APP_WX_SUBSCRIBE_BIKE_REMIND: '"p1cqXA7eVAf8p0RMEuH-S9yd4Cvt2POI0gTj5AiGawc"',
    TARO_APP_WX_SUBSCRIBE_SHOP_REMIND: '"p1cqXA7eVAf8p0RMEuH-S9yd4Cvt2POI0gTj5AiGawc"',
  },
} satisfies UserConfigExport;
