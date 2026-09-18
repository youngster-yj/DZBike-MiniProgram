import Taro from '@tarojs/taro';
import { fitImageRect, loadCanvasImage } from '@/utils/sharePosterCanvas';

/** WeChat share card display ratio is 5:4 */
const SHARE_CARD_WIDTH = 500;
const SHARE_CARD_HEIGHT = 400;
const SHARE_CARD_PADDING = 16;
const MAX_SHARE_BYTES = 120 * 1024;
const TARGET_RATIO = SHARE_CARD_WIDTH / SHARE_CARD_HEIGHT;
const RATIO_TOLERANCE = 0.03;
const CLUB_NAME = '达州自行车俱乐部';
const SHARE_TITLE_MAX_CHARS = 28;
/** Bump when share-card layout/typography changes to invalidate in-memory cache */
const DESIGNED_SHARE_CARD_VERSION = 'v4';

let cachedSrc = '';
let cachedPath = '';
let inflightSrc = '';
let inflightPromise: Promise<string | null> | null = null;

let designedCachedKey = '';
let designedCachedPath = '';
let designedInflightKey = '';
let designedInflightPromise: Promise<string | null> | null = null;

export type DesignedShareCardInput = {
  bannerSrc: string;
  title: string;
  /** Chip label e.g. 奖品 / 截止 */
  badgeLabel?: string;
  /** Chip body text */
  badgeText?: string;
  cacheKey: string;
};

/** @deprecated Prefer DesignedShareCardInput; kept for bike call sites */
export type ActivityShareCardInput = {
  bannerSrc: string;
  title: string;
  prize?: string;
  cacheKey: string;
};

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

function wrapShareText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let current = '';
  let overflow = false;
  for (const char of text) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
      if (lines.length >= maxLines) {
        overflow = true;
        break;
      }
    } else {
      current = next;
    }
  }
  if (!overflow && current && lines.length < maxLines) {
    lines.push(current);
  } else if (overflow || (current && lines.length >= maxLines)) {
    overflow = true;
  }
  if (overflow && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (last.length > 0 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = last ? `${last}…` : '…';
  }
  return lines;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: { width: number; height: number; /* Image */ },
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
  ctx.drawImage(image as CanvasImageSource, sx, sy, sw, sh, x, y, w, h);
}

function formatBadgeText(text: string, maxLen = 16): string {
  const value = text.trim();
  if (!value) return '';
  return value.length > maxLen ? `${value.slice(0, maxLen)}…` : value;
}

/** Build WeChat share title: prize hook when present, invite suffix when title is short. */
export function buildActivityShareTitle(title?: string, prize?: string): string {
  const base = (title || '骑行活动').trim() || '骑行活动';
  const prizeText = (prize || '').trim();
  if (prizeText) {
    const shortPrize = prizeText.length > 10 ? `${prizeText.slice(0, 10)}…` : prizeText;
    const combined = `${base}｜${shortPrize}`;
    if (combined.length <= SHARE_TITLE_MAX_CHARS) return combined;
    const remain = SHARE_TITLE_MAX_CHARS - shortPrize.length - 1;
    if (remain >= 4) return `${base.slice(0, remain)}｜${shortPrize}`;
    return combined.slice(0, SHARE_TITLE_MAX_CHARS);
  }
  if (base.length <= 8) return `${base}｜邀请你一起骑`;
  return base;
}

/**
 * Shop WeChat share title — keep short; deadline lives on the share image badge.
 */
export function buildShopShareTitle(title?: string): string {
  const base = (title || '店铺活动').trim() || '店铺活动';
  if (base.length <= 10) return `${base}｜邀请你参加`;
  return base;
}

async function exportCanvas(canvas: Taro.Canvas): Promise<string | null> {
  await delay(100);
  const dpr = Math.min(Taro.getSystemInfoSync().pixelRatio || 2, 2);
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

  return exportCanvas(canvas);
}

async function renderDesignedShareCardOnce(input: DesignedShareCardInput): Promise<string | null> {
  const dpr = Math.min(Taro.getSystemInfoSync().pixelRatio || 2, 2);
  const canvas = createOffscreenCanvas(SHARE_CARD_WIDTH * dpr, SHARE_CARD_HEIGHT * dpr);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const loaded = await loadCanvasImage(canvas, input.bannerSrc);
  if (loaded) {
    drawCoverImage(ctx, loaded, 0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  }

  const gradient = ctx.createLinearGradient(0, SHARE_CARD_HEIGHT * 0.28, 0, SHARE_CARD_HEIGHT);
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
  gradient.addColorStop(0.4, 'rgba(15, 23, 42, 0.62)');
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0.92)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, SHARE_CARD_HEIGHT * 0.28, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT * 0.72);

  const pad = 18;
  const contentW = SHARE_CARD_WIDTH - pad * 2;
  const badgeLabel = (input.badgeLabel || '').trim();
  const badgeText = input.badgeText ? formatBadgeText(input.badgeText) : '';
  let y = SHARE_CARD_HEIGHT - pad;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText(CLUB_NAME, pad, y);
  y -= 34;

  if (badgeLabel && badgeText) {
    const tagPadX = 12;
    const tagH = 40;
    ctx.font = 'bold 22px sans-serif';
    const labelW = ctx.measureText(badgeLabel).width + tagPadX * 2;
    const bodyW = ctx.measureText(badgeText).width + tagPadX * 2;
    const tagW = Math.min(contentW, labelW + bodyW);
    const barY = y - tagH;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pad, barY, tagW, tagH);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(pad, barY, Math.min(labelW, tagW), tagH);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad + 1, barY + 1, tagW - 2, tagH - 2);

    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeLabel, pad + tagPadX, barY + tagH / 2);
    ctx.fillStyle = '#c2410c';
    ctx.fillText(badgeText, pad + labelW + tagPadX, barY + tagH / 2);
    y = barY - 14;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.textBaseline = 'top';
  const titleLineH = 48;
  const titleLines = wrapShareText(ctx, input.title || '活动', contentW, 2);
  const titleBlockH = titleLines.length * titleLineH;
  let titleY = y - titleBlockH;
  titleLines.forEach((line) => {
    ctx.fillText(line, pad, titleY);
    titleY += titleLineH;
  });

  return exportCanvas(canvas);
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

export async function generateDesignedShareCardImage(
  input: DesignedShareCardInput,
): Promise<string | null> {
  if (!input?.bannerSrc || !input?.cacheKey) return null;
  try {
    let path = await renderDesignedShareCardOnce(input);
    if (!path) return null;
    if (!(await isNearFiveFour(path))) {
      path = await renderDesignedShareCardOnce(input);
      if (!path || !(await isNearFiveFour(path))) return null;
    }
    return path;
  } catch {
    return null;
  }
}

export async function generateActivityShareCardImage(
  input: ActivityShareCardInput,
): Promise<string | null> {
  return generateDesignedShareCardImage(toDesignedFromActivity(input));
}

function toDesignedFromActivity(input: ActivityShareCardInput): DesignedShareCardInput {
  const prize = (input.prize || '').trim();
  return {
    bannerSrc: input.bannerSrc,
    title: input.title,
    badgeLabel: prize ? '奖品' : undefined,
    badgeText: prize ? formatBadgeText(prize) : undefined,
    cacheKey: input.cacheKey,
  };
}

export function getShareCardImage(src?: string): string {
  if (!cachedPath) return '';
  if (src && cachedSrc !== src) return '';
  return cachedPath;
}

export function getDesignedShareCardImage(cacheKey?: string): string {
  if (!designedCachedPath) return '';
  if (cacheKey && designedCachedKey !== `${DESIGNED_SHARE_CARD_VERSION}:${cacheKey}`) {
    return '';
  }
  return designedCachedPath;
}

export function getActivityShareCardImage(cacheKey?: string): string {
  return getDesignedShareCardImage(cacheKey);
}

export function setShareCardImage(path: string, src?: string): void {
  cachedPath = path;
  if (src) cachedSrc = src;
}

export function setDesignedShareCardImage(path: string, cacheKey: string): void {
  designedCachedPath = path;
  designedCachedKey = `${DESIGNED_SHARE_CARD_VERSION}:${cacheKey}`;
}

export function setActivityShareCardImage(path: string, cacheKey: string): void {
  setDesignedShareCardImage(path, cacheKey);
}

export function clearShareCardImage(): void {
  cachedSrc = '';
  cachedPath = '';
  inflightSrc = '';
  inflightPromise = null;
  designedCachedKey = '';
  designedCachedPath = '';
  designedInflightKey = '';
  designedInflightPromise = null;
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

/** Designed 5:4 share card (cover + title/badge/brand), cached by cacheKey. */
export async function ensureDesignedShareCardImage(
  input: DesignedShareCardInput,
): Promise<string | null> {
  if (!input?.cacheKey || !input?.bannerSrc) return null;
  const key = `${DESIGNED_SHARE_CARD_VERSION}:${input.cacheKey}`;
  if (designedCachedKey === key && designedCachedPath) return designedCachedPath;
  if (designedInflightKey === key && designedInflightPromise) {
    return designedInflightPromise;
  }

  designedInflightKey = key;
  designedInflightPromise = generateDesignedShareCardImage(input).then((path) => {
    if (path) {
      designedCachedKey = key;
      designedCachedPath = path;
    }
    if (designedInflightKey === key) {
      designedInflightKey = '';
      designedInflightPromise = null;
    }
    return path;
  });
  return designedInflightPromise;
}

/** Activity-designed share card helper (prize badge). */
export async function ensureActivityShareCardImage(
  input: ActivityShareCardInput,
): Promise<string | null> {
  return ensureDesignedShareCardImage(toDesignedFromActivity(input));
}

/** Cover image used on posters / share cards for a given payload kind. */
export function getShareCoverSrc(payload: {
  kind: string;
  data: { bannerSrc?: string; imageUrl?: string };
}): string {
  if (payload.kind === 'activity') return payload.data.bannerSrc || '';
  return payload.data.imageUrl || '';
}
