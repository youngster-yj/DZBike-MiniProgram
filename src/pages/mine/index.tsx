import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { showError } from '@/utils/helpers';
import {
  getCachedProfile,
  refreshWxProfile,
  hasWxIdentity,
} from '@/utils/wxProfile';
import { WxProfileData } from '@/services/types';
import { toAssetUrl } from '@/utils/assetUrl';
import { WxAuthModal } from '@/components/WxAuthModal';
import { makePhoneCall } from '@/utils/helpers';

export default function MinePage() {
  const [profile, setProfile] = useState<WxProfileData | null>(getCachedProfile());
  const [authVisible, setAuthVisible] = useState(false);

  const identified = hasWxIdentity(profile);

  useDidShow(() => {
    refreshWxProfile()
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch(() => {
        // silent — may be offline
      });
  });

  const openAuthModal = () => setAuthVisible(true);

  const go = (url: string) => {
    Taro.navigateTo({ url });
  };

  const goProtected = (url: string) => {
    if (!hasWxIdentity(profile)) {
      showError('请先完善头像、昵称与手机号');
      openAuthModal();
      return;
    }
    go(url);
  };

  const cardAvatar = profile?.avatarUrl ? toAssetUrl(profile.avatarUrl) : '';

  return (
    <View className="mine-index-page">
      <View className="mine-index-profileCard">
        {identified ? (
          <>
            <View className="mine-index-avatarTap" onClick={openAuthModal}>
              <Image className="mine-index-avatar" src={cardAvatar} mode="aspectFill" />
            </View>
            <View className="mine-index-profileMain">
              <Text className="mine-index-nicknameText" onClick={openAuthModal}>
                {profile?.nickName}
              </Text>
              <Text className="mine-index-phoneText" onClick={openAuthModal}>
                {profile?.phone}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View className="mine-index-avatarPlaceholder">
              <Text>头像</Text>
            </View>
            <View className="mine-index-profileMain">
              <Text className="mine-index-nicknameHint">完善头像、昵称与手机号后报名更便捷</Text>
              <Button
                className="button-primary mine-index-authCta"
                type="primary"
                onClick={openAuthModal}
              >
                完善资料
              </Button>
            </View>
          </>
        )}
      </View>

      <View className="mine-index-menuCard">
        <View className="mine-index-menuItem" onClick={() => goProtected('/pages/mine/joins/index')}>
          <Text className="mine-index-menuLabel">我的报名</Text>
          <Text className="mine-index-menuArrow">›</Text>
        </View>
        <View className="mine-index-menuItem" onClick={() => goProtected('/pages/mine/favorites/index')}>
          <Text className="mine-index-menuLabel">收藏车型</Text>
          <Text className="mine-index-menuArrow">›</Text>
        </View>
        <View className="mine-index-menuItem" onClick={() => go('/pages/complaint/index')}>
          <Text className="mine-index-menuLabel">投诉反馈</Text>
          <Text className="mine-index-menuArrow">›</Text>
        </View>
      </View>

      <Text
        className="mine-index-footer"
        onClick={() => makePhoneCall('0818-8889777')}
      >
        达州自行车俱乐部 · 0818-8889777
      </Text>

      <WxAuthModal
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        onSuccess={(next) => setProfile(next)}
      />
    </View>
  );
}
