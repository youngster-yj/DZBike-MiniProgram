/// <reference types="@tarojs/taro" />

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.scss';
declare module '*.sass';
declare module '*.css';

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_ENV: 'weapp' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd';
    TARO_APP_API_BASE: string;
    TARO_APP_ASSET_BASE: string;
    TARO_APP_WX_SUBSCRIBE_ACTIVITY_AUDIT: string;
  }
}
