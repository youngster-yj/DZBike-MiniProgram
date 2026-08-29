import { View, Text, Image, Button, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { judgePhone, showError, showSuccess } from '@/utils/helpers';
import {
  getCachedProfile,
  refreshWxProfile,
  saveWxProfile,
  ensureWxSession,
  uploadWxAvatarFile,
  hasWxIdentity,
} from '@/utils/wxProfile';
import { WxProfileData } from '@/services/types';
import { toAssetUrl } from '@/utils/assetUrl';
import { AnimatedModal } from '@/components/AnimatedModal';

export default function MinePage() {
  const [profile, setProfile] = useState<WxProfileData | null>(getCachedProfile());

  const [authVisible, setAuthVisible] = useState(false);
  const [authAvatarTemp, setAuthAvatarTemp] = useState('');
  const [authAvatarSaved, setAuthAvatarSaved] = useState('');
  const [authNick, setAuthNick] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

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

  const openAuthModal = async () => {
    try {
      await ensureWxSession();
    } catch {
      // 仍允许打开弹层；提交时会再试
    }
    setAuthAvatarTemp('');
    setAuthAvatarSaved(profile?.avatarUrl || '');
    setAuthNick(profile?.nickName || '');
    setAuthPhone(profile?.phone || '');
    setAuthVisible(true);
  };

  const onAuthChooseAvatar = (e: { detail: { avatarUrl?: string } }) => {
    const url = e.detail.avatarUrl || '';
    if (!url) return;
    setAuthAvatarTemp(url);
  };

  const onAuthAllow = async () => {
    const nickName = authNick.trim();
    const phone = authPhone.trim();
    const hasNewAvatar = Boolean(authAvatarTemp);
    const hasExistingAvatar = Boolean(authAvatarSaved);
    if (!hasNewAvatar && !hasExistingAvatar) {
      return showError('请选择头像');
    }
    if (!nickName) {
      return showError('请填写昵称');
    }
    const phoneErr = judgePhone(phone);
    if (phoneErr !== true) return showError(String(phoneErr));

    setAuthSubmitting(true);
    try {
      await ensureWxSession();
      let avatarUrl = authAvatarSaved;
      if (authAvatarTemp) {
        avatarUrl = await uploadWxAvatarFile(authAvatarTemp);
      }
      const next = await saveWxProfile({ nickName, avatarUrl, phone });
      setProfile(next);
      setAuthVisible(false);
      setAuthAvatarTemp('');
      showSuccess('资料已保存');
    } catch (err) {
      showError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const go = (url: string) => {
    Taro.navigateTo({ url });
  };

  const goProtected = (url: string) => {
    if (!hasWxIdentity(profile)) {
      showError('请先微信授权登录');
      void openAuthModal();
      return;
    }
    go(url);
  };

  const previewAvatar = authAvatarTemp || (authAvatarSaved ? toAssetUrl(authAvatarSaved) : '');
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
                微信授权登录
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

      <Text className="mine-index-footer">达州自行车俱乐部 · 0818-8889777</Text>

      <AnimatedModal
        visible={authVisible}
        onClose={() => !authSubmitting && setAuthVisible(false)}
        closeOnMask
        maskClassName="mine-auth-mask"
        bodyClassName="mine-auth-body"
      >
        <Text className="mine-auth-title">获取你的昵称、头像</Text>

        <View className="mine-auth-row">
          <Text className="mine-auth-label">头像</Text>
          <Button
            className="mine-auth-avatarBtn"
            openType="chooseAvatar"
            onChooseAvatar={onAuthChooseAvatar}
          >
            {previewAvatar ? (
              <Image className="mine-auth-avatarImg" src={previewAvatar} mode="aspectFill" />
            ) : (
              <View className="mine-auth-avatarEmpty">
                <Text>头像</Text>
              </View>
            )}
            <Text className="mine-auth-rowArrow">›</Text>
          </Button>
        </View>

        <View className="mine-auth-row">
          <Text className="mine-auth-label">昵称</Text>
          <Input
            className="mine-auth-nickInput"
            type="nickname"
            value={authNick}
            placeholder="点击填写"
            onInput={(e) => setAuthNick(e.detail.value)}
          />
        </View>

        <View className="mine-auth-row">
          <Text className="mine-auth-label">手机号</Text>
          <Input
            className="mine-auth-nickInput"
            type="number"
            value={authPhone}
            placeholder="请填写手机号"
            onInput={(e) => setAuthPhone(e.detail.value)}
          />
        </View>

        <View className="mine-auth-actions">
          <Button
            className="mine-auth-btn mine-auth-btnDeny"
            disabled={authSubmitting}
            onClick={() => setAuthVisible(false)}
          >
            拒绝
          </Button>
          <Button
            className="mine-auth-btn mine-auth-btnAllow button-primary"
            type="primary"
            loading={authSubmitting}
            onClick={onAuthAllow}
          >
            允许
          </Button>
        </View>
      </AnimatedModal>
    </View>
  );
}
