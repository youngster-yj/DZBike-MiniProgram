import type { MapLocationProps } from '@/data/platformDefaults';

const X_PI = (Math.PI * 3000.0) / 180.0;

/** GCJ-02 → BD-09，用于需要百度坐标系的场景 */
export function gcj02ToBd09(
  lng: number,
  lat: number,
): { lng: number; lat: number } {
  const z =
    Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI);
  const bdLng = z * Math.cos(theta) + 0.0065;
  const bdLat = z * Math.sin(theta) + 0.006;
  return { lng: bdLng, lat: bdLat };
}

/**
 * 解析高德中心点。后端可能返回 [lng, lat] 数组，也可能是 "lng lat" 字符串。
 */
function parseGaodeCenter(
  center: MapLocationProps['gaodeOnlineCenter'] | undefined,
): { lng: number; lat: number } | null {
  if (Array.isArray(center) && center.length >= 2) {
    const lng = Number(center[0]);
    const lat = Number(center[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return { lng, lat };
    }
  }

  if (typeof center === 'string') {
    const parts = center.trim().split(/\s+/);
    if (parts.length >= 2) {
      const lng = Number(parts[0]);
      const lat = Number(parts[1]);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return { lng, lat };
      }
    }
  }

  return null;
}

/** 优先用 gaodeOnlineCenter，缺失时回退到 dlat/dlon */
export function resolveGcj02FromLocation(
  location: Pick<MapLocationProps, 'dlat' | 'dlon' | 'gaodeOnlineCenter'>,
): { lng: number; lat: number } | null {
  const parsedCenter = parseGaodeCenter(location.gaodeOnlineCenter);
  if (parsedCenter) {
    return parsedCenter;
  }

  const lng = Number(location.dlat);
  const lat = Number(location.dlon);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lng, lat };
}
