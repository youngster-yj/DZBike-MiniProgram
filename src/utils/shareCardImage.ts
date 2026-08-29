import Taro from '@tarojs/taro';
import { fitImageRect } from '@/utils/sharePosterCanvas';

/** WeChat share card display ratio is 5:4 */
const SHARE_CARD_WIDTH = 500;
const SHARE_CARD_HEIGHT = 400;
const SHARE_CARD_PADDING = 16;
const MAX_SHARE_BYTES = 120 * 1024;
const TARGET_RATIO = SHARE_CARD_WIDTH / SHARE_CARD_HEIGHT;
const RATIO_TOLERANCE = 0.03;

let cachedSrc = '';
let cachedPath = '';
let inflightSrc = '';
let inflightPromise: Promise<string | null> | null = null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createOffscreenCanvas(width: number, height: number): Taro.Canvas {
  const wxApi = (globalThis as {
    wx?: { createOffscreenCanvas?: (opts: { type: string; width: number; height: number }) => unknown };
  }).wx;
  if (!wxApi?.createOffscreenCanvas) {
    throw new Error('当前微信版本不支持分享图生成');
  }
  return wxApi.createOffscreenCanvas({ type: '2d', width, height }) as Taro.Canvas;
}

async function resolveImagePath(src: string): Promise<string> {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) {
    const res = await Taro.downloadFile({ url: src });
    if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
      return res.tempFilePath;
    }
    throw new Error('图片下载失败');
  }
  try {
    const info = await Taro.getImageInfo({ src });
    return info.path || src;
  } catch {
    return src;
  }
}

async function loadCanvasImage(canvas: Taro.Canvas, src: string): Promise<Image | null> {
  if (!src) return null;
  try {
    const path = await resolveImagePath(src);
    const image = canvas.createImage();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = path;
    });
    return image;
  } catch {
    return null;
  }
}

async function getFileSize(filePath: string): Promise<number> {
  try {
    const info = await new Promise<{ size: number }>((resolve, reject) => {
      Taro.getFileSystemManager().getFileInfo({
        filePath,
        success: (res) => resolve({ size: res.size }),
        fail: reject,
      });
    });
    return info.size;
  } catch {
    return 0;
  }
}

async function compressIfNeeded(filePath: string): Promise<string> {
  const size = await getFileSize(filePath);
  if (size > 0 && size <= MAX_SHARE_BYTES) return filePath;
  try {
    const result = await Taro.compressImage({
      src: filePath,
      quality: 70,
    });
    return result.tempFilePath || filePath;
  } catch {
    return filePath;
  }
}

async function isNearFiveFour(filePath: string): Promise<boolean> {
  try {
    const info = await Taro.getImageInfo({ src: filePath });
    if (!info.width || !info.height) return false;
    const ratio = info.width / info.height;
    return Math.abs(ratio - TARGET_RATIO) <= RATIO_TOLERANCE;
  } catch {
    return false;
  }
}

async function renderShareCardOnce(src: string): Promise<string | null> {
  const dpr = Math.min(Taro.getSystemInfoSync().pixelRatio || 2, 2);
  const canvas = createOffscreenCanvas(SHARE_CARD_WIDTH * dpr, SHARE_CARD_HEIGHT * dpr);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const loaded = await loadCanvasImage(canvas, src);
  if (!loaded) return null;

  const innerW = SHARE_CARD_WIDTH - SHARE_CARD_PADDING * 2;
  const innerH = SHARE_CARD_HEIGHT - SHARE_CARD_PADDING * 2;
  const { drawW, drawH } = fitImageRect(loaded.width, loaded.height, innerW, innerH);
  const offsetX = SHARE_CARD_PADDING + (innerW - drawW) / 2;
  const offsetY = SHARE_CARD_PADDING + (innerH - drawH) / 2;
  ctx.drawImage(loaded, offsetX, offsetY, drawW, drawH);

  await delay(100);
  const exportWidth = SHARE_CARD_WIDTH * dpr;
  const exportHeight = SHARE_CARD_HEIGHT * dpr;
  const result = await Taro.canvasToTempFilePath({
    canvas,
    x: 0,
    y: 0,
    width: exportWidth,
    height: exportHeight,
    destWidth: SHARE_CARD_WIDTH,
    destHeight: SHARE_CARD_HEIGHT,
    fileType: 'jpg',
    quality: 0.82,
  });
  if (!result.tempFilePath) return null;
  return compressIfNeeded(result.tempFilePath);
}

/**
 * Build a local 5:4 JPG suitable for WeChat shareAppMessage imageUrl.
 * Returns null on failure so callers can fall back carefully.
 */
export async function generateShareCardImage(src: string): Promise<string | null> {
  if (!src) return null;
  try {
    let path = await renderShareCardOnce(src);
    if (!path) return null;
    if (!(await isNearFiveFour(path))) {
      path = await renderShareCardOnce(src);
      if (!path || !(await isNearFiveFour(path))) return null;
    }
    return path;
  } catch {
    return null;
  }
}

export function getShareCardImage(src?: string): string {
  if (!cachedPath) return '';
  if (src && cachedSrc !== src) return '';
  return cachedPath;
}

export function setShareCardImage(path: string, src?: string): void {
  cachedPath = path;
  if (src) cachedSrc = src;
}

export function clearShareCardImage(): void {
  cachedSrc = '';
  cachedPath = '';
  inflightSrc = '';
  inflightPromise = null;
}

/** Generate (or reuse) a share card thumb and cache it for useShareAppMessage. */
export async function ensureShareCardImage(src: string): Promise<string | null> {
  if (!src) return null;
  if (cachedSrc === src && cachedPath) return cachedPath;
  if (inflightSrc === src && inflightPromise) return inflightPromise;

  inflightSrc = src;
  inflightPromise = generateShareCardImage(src).then((path) => {
    if (path) {
      cachedSrc = src;
      cachedPath = path;
    }
    if (inflightSrc === src) {
      inflightSrc = '';
      inflightPromise = null;
    }
    return path;
  });
  return inflightPromise;
}

/** Cover image used on posters / share cards for a given payload kind. */
export function getShareCoverSrc(payload: {
  kind: string;
  data: { bannerSrc?: string; imageUrl?: string };
}): string {
  if (payload.kind === 'activity') return payload.data.bannerSrc || '';
  return payload.data.imageUrl || '';
}
