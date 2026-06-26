// ═══════════════════════════════════════════════════════════════════════════
// Cache Service — AsyncStorage with TTL
// Offline-first data layer. Stale-while-revalidate pattern.
// ═══════════════════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@nexi_cache:';

interface CacheEntry<T> {
  data: T;
  savedAt: number;
  ttlMs: number;
}

// ── TTL presets (ms) ──────────────────────────────────────────────────────
export const TTL = {
  SHORT:  5  * 60 * 1000,   //  5 minutes  — search results
  MEDIUM: 30 * 60 * 1000,   // 30 minutes  — business lists
  LONG:   2  * 60 * 60 * 1000, // 2 hours  — static content
  DAY:    24 * 60 * 60 * 1000, // 1 day    — user profile
};

// ── Write to cache ─────────────────────────────────────────────────────────
export async function cacheSet<T>(key: string, data: T, ttlMs = TTL.MEDIUM): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, savedAt: Date.now(), ttlMs };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Non-critical — silently fail
  }
}

// ── Read from cache ────────────────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<{ data: T; stale: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.savedAt;
    const stale = age > entry.ttlMs;

    return { data: entry.data, stale };
  } catch {
    return null;
  }
}

// ── Check if cache is still fresh ─────────────────────────────────────────
export async function cacheIsFresh(key: string): Promise<boolean> {
  const result = await cacheGet(key);
  if (!result) return false;
  return !result.stale;
}

// ── Delete a cache key ─────────────────────────────────────────────────────
export async function cacheDelete(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {}
}

// ── Clear all Nexi cache keys ──────────────────────────────────────────────
export async function cacheClear(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const nexiKeys = allKeys.filter(k => k.startsWith(PREFIX));
    if (nexiKeys.length > 0) {
      await AsyncStorage.multiRemove(nexiKeys);
    }
  } catch {}
}

// ── Stale-while-revalidate helper ─────────────────────────────────────────
// Returns cached data immediately (even if stale), then fetches fresh data.
// onData is called up to twice: once with cached, once with fresh.
export async function cacheWithRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  onData: (data: T, isFromCache: boolean) => void,
  ttlMs = TTL.MEDIUM,
): Promise<void> {
  // 1. Return cached immediately if available
  const cached = await cacheGet<T>(key);
  if (cached) {
    onData(cached.data, true);
    if (!cached.stale) return; // Still fresh — no need to refetch
  }

  // 2. Fetch fresh data
  try {
    const fresh = await fetcher();
    await cacheSet(key, fresh, ttlMs);
    onData(fresh, false);
  } catch {
    // If fetch fails and we have stale data, that's fine — caller already got it
  }
}

// ── Cache keys (standardized) ─────────────────────────────────────────────
export const CACHE_KEYS = {
  businesses: (cityId?: string) => `businesses:${cityId || 'all'}`,
  business: (id: string) => `business:${id}`,
  userProfile: (userId: string) => `profile:${userId}`,
  savedPlaces: (userId: string) => `saved:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  trending: 'trending:weekly',
  categories: 'categories',
};
