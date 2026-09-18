import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import qrcode from 'qrcode-generator';
import { AnimatedModal } from '@/components/AnimatedModal';
import { getH5Origin } from '@/utils/shareUrl';
import { showError, showSuccess } from '@/utils/helpers';

interface WebEntryProps {
  visible: boolean;
  onClose: () => void;
}

const QR_SIZE = 280;

function createOffscreenCanvas(width: number, height: number): Taro.Canvas {
  const wxApi = (globalThis as {
    wx?: { createOffscreenCanvas?: (opts: { type: string; width: number; height: number }) => unknown };
  }).wx;
  if (!wxApi?.createOffscreenCanvas) {
    throw new Error('当前微信版本不支持二维码生成');
  }
  return wxApi.createOffscreenCanvas({ type: '2d', width, height }) as Taro.Canvas;
}

function drawQr(
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
): void {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 16;
  const inner = size - quiet * 2;
  const tile = inner / count;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#0f172a';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(quiet + col * tile, quiet + row * tile, tile, tile);
      }
    }
  }
}

async function renderHomeQr(url: string): Promise<string> {
  const dpr = 2;
  const canvas = createOffscreenCanvas(QR_SIZE * dpr, QR_SIZE * dpr);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawQr(ctx, url, QR_SIZE);
  const result = await Taro.canvasToTempFilePath({
    canvas,
    x: 0,
    y: 0,
    width: QR_SIZE * dpr,
    height: QR_SIZE * dpr,
    destWidth: QR_SIZE,
    destHeight: QR_SIZE,
    fileType: 'png',
  });
  if (!result.tempFilePath) throw new Error('二维码生成失败');
  return result.tempFilePath;
}

function displayHost(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return origin.replace(/^https?:\/\//, '');
  }
}

export function WebEntry({ visible, onClose }: WebEntryProps) {
  const origin = getH5Origin();
  const host = displayHost(origin);
  const [qrSrc, setQrSrc] = useState('');
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    setQrError('');
    renderHomeQr(origin)
      .then((path) => {
        if (!cancelled) setQrSrc(path);
      })
      .catch(() => {
        if (!cancelled) setQrError('二维码生成失败，可直接复制链接');
      });
    return () => {
      cancelled = true;
    };
  }, [visible, origin]);

  const onCopy = () => {
    Taro.setClipboardData({
      data: origin,
      success: () => showSuccess('链接已复制'),
      fail: () => showError('复制失败，请重试'),
    });
  };

  return (
    <AnimatedModal
      visible={visible}
      onClose={onClose}
      closeOnMask
      maskClassName="web-entry-modal"
      bodyClassName="web-entry-body"
    >
      <Text className="web-entry-brand">达州骑行</Text>
      <Text className="web-entry-lead">用浏览器打开网页版</Text>
      <View className="web-entry-qrWrap">
        {qrSrc ? (
          <Image className="web-entry-qr" src={qrSrc} mode="aspectFit" />
        ) : (
          <Text className="web-entry-qrHint">{qrError || '二维码生成中...'}</Text>
        )}
      </View>
      <Text className="web-entry-host">{host}</Text>
      <Button className="web-entry-copy" onClick={onCopy}>
        复制链接
      </Button>
      <Text className="web-entry-hint">发给好友，或用另一台设备扫码打开</Text>
    </AnimatedModal>
  );
}
