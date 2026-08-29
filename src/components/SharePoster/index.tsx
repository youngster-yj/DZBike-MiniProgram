import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useRef, useState } from 'react';
import {
  generateSharePosterImage,
  savePosterToAlbum,
  ActivityPosterInput,
  ProductPosterInput,
  ShopPosterInput,
  CollectPosterInput,
} from '@/utils/sharePosterCanvas';
import { ensureShareCardImage, getShareCoverSrc } from '@/utils/shareCardImage';
import { showSuccess } from '@/utils/helpers';
import { AnimatedModal } from '@/components/AnimatedModal';

export type SharePosterKind = 'activity' | 'product' | 'shop' | 'collect';

type SharePosterPayload =
  | { kind: 'activity'; data: ActivityPosterInput }
  | { kind: 'product'; data: ProductPosterInput }
  | { kind: 'shop'; data: ShopPosterInput }
  | { kind: 'collect'; data: CollectPosterInput };

interface SharePosterModalProps {
  visible: boolean;
  payload: SharePosterPayload | null;
  onClose: () => void;
  /** Fired when a 5:4 local share thumb is ready for useShareAppMessage */
  onShareImageReady?: (tempPath: string) => void;
}

const GENERATE_TIMEOUT_MS = 8000;

export function SharePosterModal({ visible, payload, onClose, onShareImageReady }: SharePosterModalProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [shareThumbUrl, setShareThumbUrl] = useState('');
  const [rendering, setRendering] = useState(true);
  const [thumbPreparing, setThumbPreparing] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [thumbError, setThumbError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cancelledRef = useRef(false);
  const onShareImageReadyRef = useRef(onShareImageReady);
  onShareImageReadyRef.current = onShareImageReady;

  useEffect(() => {
    if (!visible || !payload) return undefined;

    cancelledRef.current = false;
    setRendering(true);
    setThumbPreparing(false);
    setRenderError('');
    setThumbError('');
    setPreviewUrl('');
    setShareThumbUrl('');

    const runGenerate = async () => {
      const coverSrc = getShareCoverSrc(payload);
      try {
        const tempFilePath = await Promise.race([
          generateSharePosterImage(payload),
          new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error('海报生成超时，请重试')), GENERATE_TIMEOUT_MS);
          }),
        ]);
        if (cancelledRef.current) return;
        setPreviewUrl(tempFilePath);
        setRendering(false);

        if (!coverSrc) {
          // no cover: still allow share with poster image
          setShareThumbUrl(tempFilePath);
          onShareImageReadyRef.current?.(tempFilePath);
          return;
        }
        setThumbPreparing(true);
        const shareThumb = await ensureShareCardImage(coverSrc);
        if (cancelledRef.current) return;
        const thumb = shareThumb || tempFilePath;
        setShareThumbUrl(thumb);
        onShareImageReadyRef.current?.(thumb);
        // thumb 失败时用海报兜底，不再提示「分享图生成失败」
      } catch (error) {
        if (cancelledRef.current) return;
        setRenderError(error instanceof Error ? error.message : '海报生成失败');
      } finally {
        if (!cancelledRef.current) {
          setRendering(false);
          setThumbPreparing(false);
        }
      }
    };

    Taro.nextTick(() => {
      if (!cancelledRef.current) runGenerate();
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [visible, payload, attempt]);

  const onRetry = () => {
    setAttempt((value) => value + 1);
  };

  const onSave = async () => {
    if (!previewUrl) return;
    setSaving(true);
    try {
      await savePosterToAlbum(previewUrl);
      showSuccess('已保存到相册');
    } catch {
      // savePosterToAlbum handles auth prompt
    } finally {
      setSaving(false);
    }
  };

  const shareDisabled = rendering || thumbPreparing || !previewUrl || !shareThumbUrl;
  const showRetry = !rendering && !thumbPreparing && (Boolean(renderError) || Boolean(thumbError));

  return (
    <AnimatedModal
      visible={visible && Boolean(payload)}
      onClose={onClose}
      maskClassName="share-poster-modal"
      bodyClassName="share-poster-body"
    >
      <Text className="share-poster-title">分享海报</Text>
      {rendering ? (
        <View className="share-poster-loading">
          <View className="dz-shimmer share-poster-shimmer" />
          <Text className="dz-fade-in">海报生成中...</Text>
        </View>
      ) : previewUrl ? (
        <ScrollView className="share-poster-preview-scroll" scrollY enhanced showScrollbar>
          <Image
            className="share-poster-preview dz-poster-preview-in"
            src={previewUrl}
            mode="widthFix"
            showMenuByLongpress
          />
        </ScrollView>
      ) : renderError ? (
        <View className="share-poster-loading">
          <Text>{renderError}</Text>
        </View>
      ) : null}
      {thumbPreparing ? (
        <Text className="share-poster-remark dz-fade-in">分享图准备中...</Text>
      ) : thumbError ? (
        <Text className="share-poster-remark">{thumbError}</Text>
      ) : (
        <Text className="share-poster-remark">如遇无法保存，请长按海报截图分享~</Text>
      )}
      <View className="share-poster-actions">
        <Button size="mini" onClick={onClose}>关闭</Button>
        {showRetry ? (
          <Button size="mini" type="primary" className="button-primary" onClick={onRetry}>
            重试
          </Button>
        ) : null}
        <Button size="mini" loading={saving} disabled={!previewUrl || rendering} onClick={onSave}>
          保存到相册
        </Button>
        <Button
          size="mini"
          type="primary"
          className="button-primary"
          openType="share"
          disabled={shareDisabled}
          loading={thumbPreparing}
        >
          转发给好友
        </Button>
      </View>
    </AnimatedModal>
  );
}
