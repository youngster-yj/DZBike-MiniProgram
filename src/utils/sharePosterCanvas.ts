import Taro from '@tarojs/taro';
import qrcode from 'qrcode-generator';
import { toAssetUrl } from '@/utils/assetUrl';

export const POSTER_WIDTH = 600;
const PADDING = 24;
const QR_SIZE = 112;
const FOOTER_HEIGHT = 176;
const QR_CAPTION_HEIGHT = 24;
const CLUB_NAME = '达州自行车俱乐部';
const CLUB_PHONE = '0818-8889777';
const TITLE_FONT = 'bold 30px sans-serif';
const TITLE_LINE_HEIGHT = 36;
const TITLE_LINE_HEIGHT_PRODUCT = 38;
const TITLE_CARD_PADDING = 16;
const TITLE_DIVIDER_GAP = 8;
const GAP_AFTER_TITLE = 16;
const GAP_AFTER_IMAGE = 16;
const GAP_BEFORE_DETAIL = 20;
const GAP_BEFORE_FOOTER = 16;
const ACTIVITY_HERO_HEIGHT = 220;
const ACTIVITY_BODY_GAP = 20;

const MAX_IMAGE_WIDTH = POSTER_WIDTH - PADDING * 2;
const MAX_IMAGE_HEIGHT = {
  product: 420,
  shop: 360,
  collect: 360,
} as const;

export interface PosterImageMeta {
  width: number;
  height: number;
}

export interface PosterLayout {
  totalHeight: number;
  footerTop: number;
  footerInfoLines: string[];
  titleLines: string[];
  imageTop: number;
  imageMaxW: number;
  imageMaxH: number;
  imageDrawW: number;
  imageDrawH: number;
  detailLines: string[];
  heroHeight?: number;
  bodyTop?: number;
  styledProductTitle?: boolean;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function getMeasureContext(): CanvasRenderingContext2D {
  const wxApi = (globalThis as { wx?: { createOffscreenCanvas?: (opts: { type: string; width: number; height: number }) => unknown } }).wx;
  if (!wxApi?.createOffscreenCanvas) {
    throw new Error('当前微信版本不支持海报生成，请升级后重试');
  }
  const canvas = wxApi.createOffscreenCanvas({ type: '2d', width: POSTER_WIDTH, height: 100 }) as Taro.Canvas;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.textBaseline = 'top';
  return ctx;
}

function measureTitleLines(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
  maxLines = 2,
): { lines: string[]; blockHeight: number } {
  ctx.font = TITLE_FONT;
  const lines = wrapText(ctx, title, maxWidth, maxLines);
  const blockHeight = 12 + lines.length * TITLE_LINE_HEIGHT + 8;
  return { lines, blockHeight };
}

function measureProductTitleBlock(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
): { lines: string[]; blockHeight: number } {
  ctx.font = TITLE_FONT;
  const innerWidth = maxWidth - TITLE_CARD_PADDING * 2;
  const lines = wrapText(ctx, title, innerWidth, 3);
  const textHeight = lines.length * TITLE_LINE_HEIGHT_PRODUCT;
  const blockHeight = TITLE_CARD_PADDING * 2 + textHeight + 2 + TITLE_DIVIDER_GAP;
  return { lines, blockHeight };
}

function measureDetailLines(
  ctx: CanvasRenderingContext2D,
  detail: string | undefined,
  maxWidth: number,
  maxLines = 2,
): { lines: string[]; blockHeight: number } {
  ctx.font = '22px sans-serif';
  const lines = wrapText(ctx, detail || '', maxWidth, maxLines);
  return { lines, blockHeight: lines.length * 28 };
}

export function fitImageRect(iw: number, ih: number, maxW: number, maxH: number): { drawW: number; drawH: number } {
  if (iw <= 0 || ih <= 0) return { drawW: maxW, drawH: maxH };
  const scale = Math.min(maxW / iw, maxH / ih);
  return { drawW: iw * scale, drawH: ih * scale };
}

export function drawImageContain(
  ctx: CanvasRenderingContext2D,
  image: Image,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
): { drawW: number; drawH: number } {
  const { drawW, drawH } = fitImageRect(image.width, image.height, maxW, maxH);
  const offsetX = x + (maxW - drawW) / 2;
  ctx.drawImage(image, offsetX, y, drawW, drawH);
  return { drawW, drawH };
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: Image,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / image.width, h / image.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function getPosterImageUrl(payload: SharePosterPayloadInput): string {
  if (payload.kind === 'activity') return payload.data.bannerSrc;
  return payload.data.imageUrl;
}

function getActivityBodyHeight(): number {
  return ACTIVITY_BODY_GAP + 34 + 28 + 28;
}

export function computePosterLayout(
  payload: SharePosterPayloadInput,
  imageMeta: PosterImageMeta | null,
): PosterLayout {
  const measureCtx = getMeasureContext();

  if (payload.kind === 'activity') {
    const heroHeight = ACTIVITY_HERO_HEIGHT;
    const bodyHeight = getActivityBodyHeight();
    const footerTop = heroHeight + bodyHeight;
    return {
      totalHeight: footerTop + FOOTER_HEIGHT,
      footerTop,
      footerInfoLines: [],
      titleLines: [],
      imageTop: 0,
      imageMaxW: POSTER_WIDTH,
      imageMaxH: heroHeight,
      imageDrawW: POSTER_WIDTH,
      imageDrawH: heroHeight,
      detailLines: [],
      heroHeight,
      bodyTop: heroHeight + ACTIVITY_BODY_GAP,
    };
  }

  const maxImageH = payload.kind === 'product' ? MAX_IMAGE_HEIGHT.product : MAX_IMAGE_HEIGHT[payload.kind];
  const isProduct = payload.kind === 'product';
  const titleMeasure = isProduct
    ? measureProductTitleBlock(measureCtx, payload.data.title, MAX_IMAGE_WIDTH)
    : measureTitleLines(measureCtx, payload.data.title, MAX_IMAGE_WIDTH);
  const { lines: titleLines, blockHeight: titleBlockHeight } = titleMeasure;
  const { drawW, drawH } = fitImageRect(
    imageMeta?.width ?? MAX_IMAGE_WIDTH,
    imageMeta?.height ?? maxImageH,
    MAX_IMAGE_WIDTH,
    maxImageH,
  );
  const imageTop = PADDING + titleBlockHeight + GAP_AFTER_TITLE;
  let footerTop = imageTop + drawH + GAP_AFTER_IMAGE;

  const detailText = payload.kind === 'shop' || payload.kind === 'collect' ? payload.data.detail : undefined;
  const { lines: detailLines, blockHeight: detailHeight } = measureDetailLines(measureCtx, detailText, MAX_IMAGE_WIDTH);
  if (detailLines.length > 0) {
    footerTop = imageTop + drawH + GAP_BEFORE_DETAIL + detailHeight + GAP_BEFORE_FOOTER;
  }

  const footerInfoLines =
    payload.kind === 'shop'
      ? [`结束时间：${payload.data.endTimeText}`]
      : payload.kind === 'collect'
        ? [`拍摄时间：${payload.data.shootTimeText}`]
        : [];

  return {
    totalHeight: footerTop + FOOTER_HEIGHT,
    footerTop,
    footerInfoLines,
    titleLines,
    imageTop,
    imageMaxW: MAX_IMAGE_WIDTH,
    imageMaxH: maxImageH,
    imageDrawW: drawW,
    imageDrawH: drawH,
    detailLines,
    styledProductTitle: isProduct,
  };
}

async function downloadRemoteImage(url: string): Promise<string> {
  const res = await Taro.downloadFile({ url });
  if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
    return res.tempFilePath;
  }
  throw new Error('图片下载失败');
}

/** Resolve local/package or remote image to a path OffscreenCanvas createImage can load. */
export async function resolveImagePath(src: string): Promise<string> {
  if (!src) throw new Error('图片地址为空');

  if (/^https?:\/\//i.test(src)) {
    return downloadRemoteImage(src);
  }

  const candidates = Array.from(
    new Set(
      [src, src.replace(/^\//, ''), src.startsWith('/') ? src : `/${src}`].filter(Boolean),
    ),
  );

  for (const candidate of candidates) {
    try {
      const info = await Taro.getImageInfo({ src: candidate });
      if (info.path) return info.path;
    } catch {
      // try next variant
    }
  }

  try {
    return await downloadRemoteImage(toAssetUrl(src));
  } catch {
    throw new Error('本地图片加载失败');
  }
}

const LOAD_IMAGE_TIMEOUT_MS = 3000;

function guessImageMime(filePath: string): string {
  if (/\.jpe?g($|\?)/i.test(filePath)) return 'image/jpeg';
  if (/\.webp($|\?)/i.test(filePath)) return 'image/webp';
  return 'image/png';
}

async function readFileAsDataUrl(filePath: string): Promise<string> {
  const data = await new Promise<string>((resolve, reject) => {
    Taro.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(String(res.data)),
      fail: reject,
    });
  });
  return `data:${guessImageMime(filePath)};base64,${data}`;
}

function assignImageSrc(image: Image, src: string, timeoutMs = LOAD_IMAGE_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('image load timeout')), timeoutMs);
    image.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error('image load error'));
    };
    image.src = src;
  });
}

/** Load image for OffscreenCanvas; falls back to package-file base64 when createImage fails. */
export async function loadCanvasImage(canvas: Taro.Canvas, src: string): Promise<Image | null> {
  if (!src) return null;

  let resolved = src;
  try {
    resolved = await resolveImagePath(src);
  } catch {
    resolved = src;
  }

  const tryCreate = async (url: string) => {
    const image = canvas.createImage();
    await assignImageSrc(image, url);
    return image;
  };

  try {
    const direct =
      /^https?:\/\//i.test(resolved) && !/[?&]t=/.test(resolved)
        ? `${resolved}${resolved.includes('?') ? '&' : '?'}t=${Date.now()}`
        : resolved;
    return await tryCreate(direct);
  } catch {
    // package / local path: read as base64 (WeChat OffscreenCanvas workaround)
  }

  const readCandidates = Array.from(
    new Set(
      [
        resolved,
        src,
        src.replace(/^\//, ''),
        src.startsWith('/') ? src : `/${src.replace(/^\//, '')}`,
      ].filter(Boolean),
    ),
  );

  for (const candidate of readCandidates) {
    if (/^https?:\/\//i.test(candidate) || candidate.startsWith('data:')) continue;
    try {
      const dataUrl = await readFileAsDataUrl(candidate);
      return await tryCreate(dataUrl);
    } catch {
      // try next
    }
  }

  return null;
}

async function preloadPosterImage(payload: SharePosterPayloadInput): Promise<PosterImageMeta | null> {
  const src = getPosterImageUrl(payload);
  if (!src) return null;
  try {
    const path = await resolveImagePath(src);
    const info = await Taro.getImageInfo({ src: path });
    return { width: info.width, height: info.height };
  } catch {
    return null;
  }
}

function drawQrCode2d(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
): void {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const tile = size / count;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#000000';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(x + col * tile, y + row * tile, tile, tile);
      }
    }
  }
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  y: number,
  h5Url: string,
  infoLines: string[],
): number {
  const footerTop = y;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, footerTop, POSTER_WIDTH, FOOTER_HEIGHT);

  const hasInfoLines = infoLines.length > 0;

  if (hasInfoLines) {
    ctx.fillStyle = '#64748b';
    ctx.font = '22px sans-serif';
    infoLines.forEach((line, index) => {
      ctx.fillText(line, PADDING, footerTop + 16 + index * 30);
    });
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(CLUB_NAME, PADDING, footerTop + FOOTER_HEIGHT - 52);
    ctx.fillStyle = '#64748b';
    ctx.font = '20px sans-serif';
    ctx.fillText(CLUB_PHONE, PADDING, footerTop + FOOTER_HEIGHT - 28);
  } else {
    const clubBlockHeight = 22 + 8 + 20;
    const clubTop = footerTop + (FOOTER_HEIGHT - clubBlockHeight) / 2;
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(CLUB_NAME, PADDING, clubTop);
    ctx.fillStyle = '#64748b';
    ctx.font = '20px sans-serif';
    ctx.fillText(CLUB_PHONE, PADDING, clubTop + 30);
  }

  const qrX = POSTER_WIDTH - PADDING - QR_SIZE;
  const qrY = footerTop + (FOOTER_HEIGHT - QR_SIZE - QR_CAPTION_HEIGHT) / 2;
  drawQrCode2d(ctx, h5Url, qrX, qrY, QR_SIZE);

  ctx.fillStyle = '#64748b';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('扫码查看', qrX + QR_SIZE / 2, qrY + QR_SIZE + 8);
  ctx.textAlign = 'left';

  return footerTop + FOOTER_HEIGHT;
}

export interface ActivityPosterInput {
  title: string;
  activityKey: string;
  publisherName: string;
  startTimeText: string;
  bannerSrc: string;
  h5Url: string;
}

export interface ProductPosterInput {
  title: string;
  imageUrl: string;
  h5Url: string;
}

export interface ShopPosterInput {
  title: string;
  detail?: string;
  endTimeText: string;
  imageUrl: string;
  h5Url: string;
}

export interface CollectPosterInput {
  title: string;
  detail?: string;
  shootTimeText: string;
  imageUrl: string;
  h5Url: string;
}

export type SharePosterPayloadInput =
  | { kind: 'activity'; data: ActivityPosterInput }
  | { kind: 'product'; data: ProductPosterInput }
  | { kind: 'shop'; data: ShopPosterInput }
  | { kind: 'collect'; data: CollectPosterInput };

function initCanvasContext(canvas: Taro.Canvas, logicalHeight: number): CanvasRenderingContext2D {
  const dpr = Taro.getSystemInfoSync().pixelRatio || 2;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, POSTER_WIDTH, logicalHeight);
  return ctx;
}

function drawTitleBlock(ctx: CanvasRenderingContext2D, titleLines: string[], styledProductTitle?: boolean): void {
  if (styledProductTitle) {
    const cardWidth = POSTER_WIDTH - PADDING * 2;
    const textHeight = titleLines.length * TITLE_LINE_HEIGHT_PRODUCT;
    const cardHeight = TITLE_CARD_PADDING * 2 + textHeight;
    const cardTop = PADDING;

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    const radius = 12;
    const x = PADDING;
    const y = cardTop;
    const w = cardWidth;
    const h = cardHeight;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = TITLE_FONT;
    titleLines.forEach((line, index) => {
      ctx.fillText(
        line,
        PADDING + TITLE_CARD_PADDING,
        cardTop + TITLE_CARD_PADDING + index * TITLE_LINE_HEIGHT_PRODUCT,
      );
    });

    const dividerY = cardTop + cardHeight + 1;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(PADDING, dividerY, cardWidth, 2);
    return;
  }

  ctx.fillStyle = '#1e293b';
  ctx.font = TITLE_FONT;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, PADDING, PADDING + 12 + index * TITLE_LINE_HEIGHT);
  });
}

async function drawMainImageAsync(
  ctx: CanvasRenderingContext2D,
  canvas: Taro.Canvas,
  imageUrl: string,
  layout: PosterLayout,
): Promise<void> {
  const loaded = await loadCanvasImage(canvas, imageUrl);
  if (loaded) {
    drawImageContain(ctx, loaded, PADDING, layout.imageTop, layout.imageMaxW, layout.imageMaxH);
    return;
  }
  ctx.fillStyle = '#f1f5f9';
  const offsetX = PADDING + (layout.imageMaxW - layout.imageDrawW) / 2;
  ctx.fillRect(offsetX, layout.imageTop, layout.imageDrawW, layout.imageDrawH);
}

function drawDetailBlock(ctx: CanvasRenderingContext2D, layout: PosterLayout): number {
  if (layout.detailLines.length === 0) return layout.imageTop + layout.imageDrawH + GAP_AFTER_IMAGE;
  let y = layout.imageTop + layout.imageDrawH + GAP_BEFORE_DETAIL;
  ctx.fillStyle = '#475569';
  ctx.font = '22px sans-serif';
  layout.detailLines.forEach((line) => {
    ctx.fillText(line, PADDING, y);
    y += 28;
  });
  return y + GAP_BEFORE_FOOTER;
}

export async function renderActivityPoster(
  canvas: Taro.Canvas,
  input: ActivityPosterInput,
  layout: PosterLayout,
): Promise<number> {
  const heroHeight = layout.heroHeight ?? ACTIVITY_HERO_HEIGHT;
  const ctx = initCanvasContext(canvas, layout.totalHeight);

  const banner = await loadCanvasImage(canvas, input.bannerSrc);
  if (banner) {
    drawImageCover(ctx, banner, 0, 0, POSTER_WIDTH, heroHeight);
  } else {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, POSTER_WIDTH, heroHeight);
  }

  const overlayHeight = 88;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fillRect(0, heroHeight - overlayHeight, POSTER_WIDTH, overlayHeight);
  ctx.fillStyle = '#ffffff';
  ctx.font = TITLE_FONT;
  const bannerTitleLines = wrapText(ctx, input.title, POSTER_WIDTH - PADDING * 2, 2);
  bannerTitleLines.forEach((line, index) => {
    ctx.fillText(line, PADDING, heroHeight - overlayHeight + 12 + index * 34);
  });

  let y = layout.bodyTop ?? heroHeight + ACTIVITY_BODY_GAP;
  ctx.fillStyle = '#dc2626';
  ctx.font = '24px sans-serif';
  ctx.fillText(`活动口令：${input.activityKey}`, PADDING, y);
  y += 34;
  ctx.fillStyle = '#64748b';
  ctx.font = '22px sans-serif';
  ctx.fillText(`${input.publisherName} 邀请您`, PADDING, y);
  y += 28;
  ctx.fillText(input.startTimeText, PADDING, y);

  drawFooter(ctx, layout.footerTop, input.h5Url, layout.footerInfoLines);
  return layout.totalHeight;
}

export async function renderProductPoster(
  canvas: Taro.Canvas,
  input: ProductPosterInput,
  layout: PosterLayout,
): Promise<number> {
  const ctx = initCanvasContext(canvas, layout.totalHeight);
  drawTitleBlock(ctx, layout.titleLines, layout.styledProductTitle);
  await drawMainImageAsync(ctx, canvas, input.imageUrl, layout);
  drawFooter(ctx, layout.footerTop, input.h5Url, layout.footerInfoLines);
  return layout.totalHeight;
}

export async function renderShopPoster(
  canvas: Taro.Canvas,
  input: ShopPosterInput,
  layout: PosterLayout,
): Promise<number> {
  const ctx = initCanvasContext(canvas, layout.totalHeight);
  drawTitleBlock(ctx, layout.titleLines, layout.styledProductTitle);
  await drawMainImageAsync(ctx, canvas, input.imageUrl, layout);
  drawDetailBlock(ctx, layout);
  drawFooter(ctx, layout.footerTop, input.h5Url, layout.footerInfoLines);
  return layout.totalHeight;
}

export async function renderCollectPoster(
  canvas: Taro.Canvas,
  input: CollectPosterInput,
  layout: PosterLayout,
): Promise<number> {
  const ctx = initCanvasContext(canvas, layout.totalHeight);
  drawTitleBlock(ctx, layout.titleLines, layout.styledProductTitle);
  await drawMainImageAsync(ctx, canvas, input.imageUrl, layout);
  drawDetailBlock(ctx, layout);
  drawFooter(ctx, layout.footerTop, input.h5Url, layout.footerInfoLines);
  return layout.totalHeight;
}

export async function renderPoster(
  canvas: Taro.Canvas,
  payload: SharePosterPayloadInput,
  layout: PosterLayout,
): Promise<number> {
  if (payload.kind === 'activity') return renderActivityPoster(canvas, payload.data, layout);
  if (payload.kind === 'product') return renderProductPoster(canvas, payload.data, layout);
  if (payload.kind === 'shop') return renderShopPoster(canvas, payload.data, layout);
  return renderCollectPoster(canvas, payload.data, layout);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createOffscreenPosterCanvas(width: number, height: number): Taro.Canvas {
  const wxApi = (globalThis as { wx?: { createOffscreenCanvas?: (opts: { type: string; width: number; height: number }) => unknown } }).wx;
  if (!wxApi?.createOffscreenCanvas) {
    throw new Error('当前微信版本不支持海报生成，请升级后重试');
  }
  return wxApi.createOffscreenCanvas({
    type: '2d',
    width,
    height,
  }) as Taro.Canvas;
}

export async function canvasToTempFile(canvas: Taro.Canvas, logicalHeight: number): Promise<string> {
  await delay(50);
  const dpr = Taro.getSystemInfoSync().pixelRatio || 2;
  const exportWidth = POSTER_WIDTH * dpr;
  const exportHeight = logicalHeight * dpr;
  try {
    const result = await Taro.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width: exportWidth,
      height: exportHeight,
      destWidth: exportWidth,
      destHeight: exportHeight,
      fileType: 'png',
    });
    if (!result.tempFilePath) {
      throw new Error('海报导出失败');
    }
    return result.tempFilePath;
  } catch (error) {
    const message = error instanceof Error ? error.message : '海报导出失败';
    throw new Error(message);
  }
}

export async function generateSharePosterImage(payload: SharePosterPayloadInput): Promise<string> {
  const imageMeta = await preloadPosterImage(payload);
  const layout = computePosterLayout(payload, imageMeta);
  const dpr = Taro.getSystemInfoSync().pixelRatio || 2;
  const canvas = createOffscreenPosterCanvas(POSTER_WIDTH * dpr, layout.totalHeight * dpr);
  const height = await renderPoster(canvas, payload, layout);
  return canvasToTempFile(canvas, height);
}

export async function savePosterToAlbum(filePath: string): Promise<void> {
  try {
    await Taro.saveImageToPhotosAlbum({ filePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('auth deny') || message.includes('authorize')) {
      await Taro.showModal({
        title: '需要相册权限',
        content: '请在设置中允许保存到相册，以便保存分享海报',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) Taro.openSetting({});
        },
      });
    }
    throw error;
  }
}
