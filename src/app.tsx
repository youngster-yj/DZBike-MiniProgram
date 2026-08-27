import { PropsWithChildren } from 'react';
import { useLaunch, useError } from '@tarojs/taro';
import { configure } from '@nutui/icons-react-taro';
import '@nutui/icons-react-taro/dist/style_iconfont.css';
import '@nutui/icons-react-taro/dist/style_icon.css';
import { fetchPlatformConfig } from '@/services/platformConfig';
import { bootstrapApp } from '@/services/api/init';
import { wxLogin } from '@/utils/wxAuth';
import './app.css';

configure({
  useSvg: false,
  tag: 'View',
});

function App({ children }: PropsWithChildren) {
  useError((err) => {
    console.error('[App Error]', err);
  });

  useLaunch(() => {
    void (async () => {
      try {
        await fetchPlatformConfig();
        try {
          await wxLogin();
        } catch {
          // 登录失败不阻塞页面（未配 WX_SECRET 时仍可浏览）
        }
        bootstrapApp();
      } catch (err) {
        console.error('[App Launch]', err);
      }
    })();
  });

  return children;
}

export default App;
