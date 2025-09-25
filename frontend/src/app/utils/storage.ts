// Utility helpers for localStorage with basic quota safety and image caching.

export const GRAYSCALE_PREFIX = "pixelplus-cache-";
const MAX_ITEM_BYTES = 2_500_000; // ~2.5MB safeguard per item

function approximateSize(str: string) {
  return str.length * 2; // conservative UTF-16 assumption
}

export function safeSetItem(key: string, value: string) {
  if (approximateSize(value) > MAX_ITEM_BYTES) {
    console.warn("PixelPlus: item too large to cache", key);
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(GRAYSCALE_PREFIX)
      );
      for (let i = 0; i < Math.ceil(keys.length / 2); i++) {
        localStorage.removeItem(keys[i]);
      }
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn("PixelPlus: failed to cache after eviction", err);
    }
  }
}
