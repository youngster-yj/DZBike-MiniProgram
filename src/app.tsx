import { PropsWithChildren } from 'react';
import { useLaunch, useError } from '@tarojs/taro';
import { fetchPlatformConfig } from '@/services/platformConfig';
import { bootstrapApp } from '@/services/api/init';
import { wxLogin } from '@/utils/wxAuth';
import './app.css';

function App({ children }: PropsWithChildren) {
  useError((err) => {
    console.error('[App Error]', err);
  });

  useLaunch(async () => {
    // 先拉平台配置，首页 sync 接口可立刻用最新数据
    await fetchPlatformConfig();
    try {
      await wxLogin();
    } catch {
      // 登录失败不阻塞页面（未配 WX_SECRET 时仍可浏览）
    }
    bootstrapApp();
  });

  return children;
}

export default App;
