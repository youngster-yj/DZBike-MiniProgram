import { View, Text, Image, Button, Input } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { judgeName, judgePhone, showError, showSuccess } from '@/utils/helpers';
import {
  getCachedProfile,
  saveWxProfile,
  ensureWxSession,
  uploadWxAvatarFile,
} from '@/utils/wxProfile';
import { WxProfileData } from '@/services/types';
import { toAssetUrl } from '@/utils/assetUrl';
import { AnimatedModal } from '@/components/AnimatedModal';

export interface WxAuthModalProps {
  visible: boolean;
  onClose: () => void;
  /** 资料保存成功后回调（可用于续报） */
  onSuccess?: (profile: WxProfileData) => void;
  title?: string;
}

export function WxAuthModal({
  visible,
  onClose,
  onSuccess,
  title = '完善头像、昵称与手机号',
}: WxAuthModalProps) {
  const [authAvatarTemp, setAuthAvatarTemp] = useState('');
  const [authAvatarSaved, setAuthAvatarSaved] = useState('');
  const [authNick, setAuthNick] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const profile = getCachedProfile();
    setAuthAvatarTemp('');
    setAuthAvatarSaved(profile?.avatarUrl || '');
    setAuthNick(profile?.nickName || '');
    setAuthPhone(profile?.phone || '');
    void ensureWxSession().catch(() => undefined);
  }, [visible]);

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
    const nickErr = judgeName(nickName);
    if (nickErr !== true) return showError(String(nickErr));
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
      showSuccess('资料已保存');
      onSuccess?.(next);
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const previewAvatar = authAvatarTemp || (authAvatarSaved ? toAssetUrl(authAvatarSaved) : '');

  return (
    <AnimatedModal
      visible={visible}
      onClose={() => !authSubmitting && onClose()}
      closeOnMask
      maskClassName="mine-auth-mask"
      bodyClassName="mine-auth-body"
    >
      <Text className="mine-auth-title">{title}</Text>

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
          onClick={onClose}
        >
          取消
        </Button>
        <Button
          className="mine-auth-btn mine-auth-btnAllow button-primary"
          type="primary"
          loading={authSubmitting}
          onClick={onAuthAllow}
        >
          保存
        </Button>
      </View>
    </AnimatedModal>
  );
}
