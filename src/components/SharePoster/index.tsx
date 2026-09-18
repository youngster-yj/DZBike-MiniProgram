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
import {
  ensureActivityShareCardImage,
  ensureDesignedShareCardImage,
  ensureShareCardImage,
  getShareCoverSrc,
} from '@/utils/shareCardImage';
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

const GENERATE_TIMEOUT_MS = 15000;

export function SharePosterModal({ visible, payload, onClose, onShareImageReady }: SharePosterModalProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [shareThumbUrl, setShareThumbUrl] = useState('');
  const [rendering, setRendering] = useState(true);
  const [thumbPreparing, setThumbPreparing] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cancelledRef = useRef(false);
  const runIdRef = useRef(0);
  const onShareImageReadyRef = useRef(onShareImageReady);
  onShareImageReadyRef.current = onShareImageReady;

  useEffect(() => {
    if (!visible || !payload) return undefined;

    cancelledRef.current = false;
    const runId = ++runIdRef.current;
    setRendering(true);
    setThumbPreparing(false);
    setRenderError('');
    setPreviewUrl('');
    setShareThumbUrl('');

    const runGenerate = async () => {
      const coverSrc = getShareCoverSrc(payload);
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
      }, GENERATE_TIMEOUT_MS);

      try {
        const tempFilePath = await Promise.race([
          generateSharePosterImage(payload),
          new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error('海报生成超时，请重试')), GENERATE_TIMEOUT_MS);
          }),
        ]);
        clearTimeout(timeoutId);
        if (cancelledRef.current || runId !== runIdRef.current) return;
        setPreviewUrl(tempFilePath);
        setRendering(false);

        if (!coverSrc) {
          setShareThumbUrl(tempFilePath);
          onShareImageReadyRef.current?.(tempFilePath);
          return;
        }
        setThumbPreparing(true);
        let shareThumb: string | null = null;
        if (payload.kind === 'activity') {
          shareThumb = await ensureActivityShareCardImage({
            bannerSrc: coverSrc,
            title: payload.data.title,
            prize: payload.data.prize,
            cacheKey: payload.data.activityId || payload.data.activityKey || coverSrc,
          });
        } else if (payload.kind === 'shop') {
          const deadline = (payload.data.endTimeText || '').replace(/^\d{4}-/, '');
          shareThumb = await ensureDesignedShareCardImage({
            bannerSrc: coverSrc,
            title: payload.data.title,
            badgeLabel: deadline ? '截止' : undefined,
            badgeText: deadline || undefined,
            cacheKey: payload.data.activityId || coverSrc,
          });
        } else {
          shareThumb = await ensureShareCardImage(coverSrc);
        }
        if (cancelledRef.current || runId !== runIdRef.current) return;
        const thumb = shareThumb || tempFilePath;
        setShareThumbUrl(thumb);
        onShareImageReadyRef.current?.(thumb);
      } catch (error) {
        clearTimeout(timeoutId);
        if (cancelledRef.current || runId !== runIdRef.current) return;
        const message =
          timedOut || (error instanceof Error && error.message.includes('超时'))
            ? '海报生成超时，请重试'
            : error instanceof Error
              ? error.message
              : '海报生成失败';
        setRenderError(message);
      } finally {
        if (!cancelledRef.current && runId === runIdRef.current) {
          setRendering(false);
          setThumbPreparing(false);
        }
      }
    };

    Taro.nextTick(() => {
      if (!cancelledRef.current && runId === runIdRef.current) runGenerate();
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

  const hasError = Boolean(renderError) && !previewUrl;
  const shareDisabled = rendering || thumbPreparing || !previewUrl || !shareThumbUrl;
  const showRetry = hasError && !rendering && !thumbPreparing;

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
      ) : hasError ? (
        <View className="share-poster-error">
          <Text className="share-poster-error-text">{renderError}</Text>
          <Text className="share-poster-error-hint">网络较慢或图片较大时可能超时，请点击重试</Text>
        </View>
      ) : null}
      {!hasError ? (
        thumbPreparing ? (
          <Text className="share-poster-remark dz-fade-in">分享图准备中...</Text>
        ) : (
          <Text className="share-poster-remark">如遇无法保存，请长按海报截图分享~</Text>
        )
      ) : null}
      <View className={`share-poster-actions${hasError ? ' share-poster-actions--error' : ''}`}>
        <Button className="share-poster-action-btn share-poster-action-btn--ghost" onClick={onClose}>
          关闭
        </Button>
        {showRetry ? (
          <Button
            className="share-poster-action-btn share-poster-action-btn--primary"
            onClick={onRetry}
          >
            重试
          </Button>
        ) : (
          <>
            <Button
              className="share-poster-action-btn share-poster-action-btn--ghost"
              loading={saving}
              disabled={!previewUrl || rendering}
              onClick={onSave}
            >
              保存到相册
            </Button>
            <Button
              className="share-poster-action-btn share-poster-action-btn--primary"
              openType="share"
              disabled={shareDisabled}
              loading={thumbPreparing}
            >
              转发给好友
            </Button>
          </>
        )}
      </View>
    </AnimatedModal>
  );
}
