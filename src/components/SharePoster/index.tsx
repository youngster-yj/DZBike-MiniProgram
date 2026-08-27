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
import { showSuccess } from '@/utils/helpers';

export type SharePosterKind = 'activity' | 'product' | 'shop' | 'collect';

type SharePosterPayload =
  | { kind: 'activity'; data: ActivityPosterInput }
  | { kind: 'product'; data: ProductPosterInput }
  | { kind: 'shop'; data: ShopPosterInput }
  | { kind: 'collect'; data: CollectPosterInput };

interface SharePosterModalProps {
  payload: SharePosterPayload;
  onClose: () => void;
}

const GENERATE_TIMEOUT_MS = 5000;

export function SharePosterModal({ payload, onClose }: SharePosterModalProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [rendering, setRendering] = useState(true);
  const [renderError, setRenderError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setRendering(true);
    setRenderError('');
    setPreviewUrl('');

    const runGenerate = async () => {
      try {
        const tempFilePath = await Promise.race([
          generateSharePosterImage(payload),
          new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error('海报生成超时，请重试')), GENERATE_TIMEOUT_MS);
          }),
        ]);
        if (cancelledRef.current) return;
        setPreviewUrl(tempFilePath);
      } catch (error) {
        if (cancelledRef.current) return;
        setRenderError(error instanceof Error ? error.message : '海报生成失败');
      } finally {
        if (!cancelledRef.current) setRendering(false);
      }
    };

    Taro.nextTick(() => {
      if (!cancelledRef.current) runGenerate();
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [payload, attempt]);

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

  return (
    <View className="share-poster-modal">
      <View className="share-poster-body">
        <Text className="share-poster-title">分享海报</Text>
        {rendering ? (
          <View className="share-poster-loading">
            <Text>海报生成中...</Text>
          </View>
        ) : previewUrl ? (
          <ScrollView className="share-poster-preview-scroll" scrollY enhanced showScrollbar>
            <Image
              className="share-poster-preview"
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
        <Text className="share-poster-remark">如遇无法保存，请长按海报截图分享~</Text>
        <View className="share-poster-actions">
          <Button size="mini" onClick={onClose}>关闭</Button>
          {!rendering && renderError ? (
            <Button size="mini" type="primary" className="button-primary" onClick={onRetry}>
              重试
            </Button>
          ) : null}
          <Button size="mini" loading={saving} disabled={!previewUrl || rendering} onClick={onSave}>
            保存到相册
          </Button>
          <Button size="mini" type="primary" className="button-primary" openType="share" disabled={rendering || !previewUrl}>
            转发给好友
          </Button>
        </View>
      </View>
    </View>
  );
}
