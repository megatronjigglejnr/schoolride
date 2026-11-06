// Small rules shared by the account screens, the same as app.js.
import { Platform } from 'react-native';

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0] ?? '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export const phoneOk = (v: string) => v.replace(/[^\d]/g, '').length >= 9 && /^\+?[\d\s()-]+$/.test(v);
export const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Memoji only exist on Apple devices. There is no API for the Apple Account's Memoji, so the parent picks one
 * they've saved to Photos (a Memoji sticker can be saved from Messages).
 */
export function isAppleDevice() {
  if (Platform.OS === 'ios') return true;
  if (Platform.OS === 'web' && typeof navigator !== 'undefined')
    return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  return false;
}
