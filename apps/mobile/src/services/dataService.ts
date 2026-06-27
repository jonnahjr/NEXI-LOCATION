// ═══════════════════════════════════════════════════════════════════════════
// Data Service — Supabase Direct Queries
// All user operations now use the live authenticated user ID.
// ═══════════════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import { supabase, rowToBusiness } from './supabase';
import { getCurrentUserId } from './authService';
import type { Business } from '../store/appStore';
import type { Notification } from './notifications';

// ── Map NestJS API row (camelCase) to Business type ───────────────────────
function apiRowToBusiness(row: any): Business {
  return {
    id: row.id,
    name: row.name ?? '',
    category: row.category ?? '',
    categoryId: row.categoryId ?? row.category_id ?? '',
    rating: row.rating ?? 0,
    reviews: row.reviews ?? 0,
    distance: row.distance ?? '',
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    image: row.image ?? '',
    verified: row.verified ?? false,
    description: row.description ?? '',
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    hours: row.hours ?? undefined,
    address: row.address ?? '',
    city: row.city ?? undefined,
    priceLevel: row.priceLevel ?? row.price_level ?? undefined,
    features: row.features ?? undefined,
    status: row.status ?? 'active',
    ownerId: row.ownerId ?? row.owner_id ?? undefined,
  };
}

// ── Distance utilities ─────────────────────────────────────────────────────

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export interface SyncResult {
  businesses: Business[];
  savedPlaceIds: string[];
}

// ── Bounding-box viewport query ────────────────────────────────────────────
export async function fetchBusinessesByBounds(
  southWest: { lat: number; lng: number },
  northEast: { lat: number; lng: number },
  categoryId?: string,
  limit = 200,
): Promise<Business[]> {
  try {
    const params = new URLSearchParams({
      swLat: String(southWest.lat),
      swLng: String(southWest.lng),
      neLat: String(northEast.lat),
      neLng: String(northEast.lng),
      limit: String(limit),
    });
    if (categoryId && categoryId !== 'all') params.set('categoryId', categoryId);

    const API_URL = Platform.select({
      android: 'http://10.0.2.2:3000',
      ios: 'http://localhost:3000',
      default: 'http://localhost:3000',
    });
    const response = await fetch(`${API_URL}/api/businesses/bounds?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data || []).map(apiRowToBusiness);
  } catch (error) {
    console.warn('[fetchBusinessesByBounds] Exception:', error);
    return [];
  }
}

// ── Fetch all businesses ────────────────────────────────────────────────────
export async function fetchBusinesses(
  categoryId?: string,
  search?: string,
  lat?: number,
  lng?: number,
  cityId?: string,
): Promise<Business[]> {
  try {
    let query = supabase.from('businesses').select('*').eq('status', 'active');

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,category.ilike.%${search}%,address.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (cityId) {
      query = query.eq('city_id', cityId);
    }

    const { data, error } = await query
      .order('rating', { ascending: false })
      .limit(200);

    if (error) {
      console.warn('[fetchBusinesses] error:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    let businesses = data.map(rowToBusiness);

    if (lat && lng) {
      businesses = businesses
        .map((b) => ({
          ...b,
          distance: formatDistance(haversineKm(lat, lng, b.latitude, b.longitude)),
        }))
        .sort((a, b) =>
          haversineKm(lat, lng, a.latitude, a.longitude) -
          haversineKm(lat, lng, b.latitude, b.longitude)
        );
    }

    return businesses;
  } catch (error) {
    console.warn('[fetchBusinesses] Exception:', error);
    return [];
  }
}

// ── Fetch single business ───────────────────────────────────────────────────
export async function fetchBusinessById(id: string): Promise<Business | null> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToBusiness(data);
  } catch {
    return null;
  }
}

// ── Fetch promoted businesses ──────────────────────────────────────────────
export async function fetchPromotedBusinesses(): Promise<Business[]> {
  try {
    const now = new Date().toISOString();
    const { data: promotions, error: promoError } = await supabase
      .from('business_promotions')
      .select('business_id, type')
      .eq('active', true)
      .lte('starts_at', now)
      .gte('ends_at', now);

    if (promoError || !promotions?.length) return [];

    const businessIds = promotions.map((p: any) => p.business_id);
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .in('id', businessIds)
      .eq('status', 'active');

    if (error || !data) return [];

    return data.map((row: any) => {
      const promo = promotions.find((p: any) => p.business_id === row.id);
      return {
        ...rowToBusiness(row),
        isPromoted: true,
        promotionType: promo?.type ?? 'featured',
      };
    });
  } catch {
    return [];
  }
}

// ── Full sync (businesses + saved places) ─────────────────────────────────
export async function syncAllData(userId: string): Promise<SyncResult> {
  const [businesses, savedIds] = await Promise.all([
    fetchBusinesses(),
    fetchSavedPlaceIds(userId),
  ]);
  return { businesses, savedPlaceIds: savedIds };
}

// ── Saved Places ────────────────────────────────────────────────────────────

export async function fetchSavedPlaceIds(userId?: string): Promise<string[]> {
  try {
    const uid = userId ?? await getCurrentUserId();
    if (!uid) return [];

    const { data, error } = await supabase
      .from('saved_places')
      .select('business_id')
      .eq('user_id', uid);

    if (error) {
      console.warn('Supabase fetchSavedPlaceIds error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => row.business_id);
  } catch {
    return [];
  }
}

export async function savePlaceOnBackend(businessId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('saved_places')
      .insert({ user_id: userId, business_id: businessId });

    if (error) {
      if (error.code === '23505') return true; // Already saved
      console.warn('Supabase savePlace error:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function unsavePlaceOnBackend(businessId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('saved_places')
      .delete()
      .eq('user_id', userId)
      .eq('business_id', businessId);

    if (error) {
      console.warn('Supabase unsavePlace error:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ── Notifications ───────────────────────────────────────────────────────────

function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    description: row.description || '',
    icon: row.icon || '🔔',
    color: row.color || '#3B82F6',
    link: row.link || undefined,
    imageUrl: row.image_url || undefined,
    metadata: row.metadata || undefined,
    read: row.read || false,
    createdAt: row.created_at,
  };
}

export async function fetchNotificationsFromSupabase(userId?: string): Promise<Notification[]> {
  try {
    const uid = userId ?? await getCurrentUserId();
    if (!uid) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[fetchNotifications] error:', error.message);
      return [];
    }

    return (data || []).map(rowToNotification);
  } catch {
    return [];
  }
}

export async function fetchUnreadCountFromSupabase(userId?: string): Promise<number> {
  try {
    const uid = userId ?? await getCurrentUserId();
    if (!uid) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('read', false);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function markNotificationReadInSupabase(notificationId: string): Promise<void> {
  try {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  } catch (err) {
    console.warn('[markNotificationRead] Exception:', err);
  }
}

export async function markAllNotificationsReadInSupabase(userId?: string): Promise<void> {
  try {
    const uid = userId ?? await getCurrentUserId();
    if (!uid) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', uid)
      .eq('read', false);
  } catch (err) {
    console.warn('[markAllNotificationsRead] Exception:', err);
  }
}

// ── User Behavior Tracking ────────────────────────────────────────────────

export async function trackUserBehavior(
  businessId: string,
  action: string,
  categoryId?: string,
): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await supabase.from('user_behavior').insert({
      user_id: userId,
      business_id: businessId,
      action,
      category_id: categoryId ?? null,
    });
  } catch {
    // Non-critical — silently fail
  }
}

// ── Check-Ins ──────────────────────────────────────────────────────────────

export async function checkInToPlace(
  businessId: string,
): Promise<{ success: boolean; pointsEarned: number }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, pointsEarned: 0 };

    const { error } = await supabase.from('check_ins').insert({
      user_id: userId,
      business_id: businessId,
      points_earned: 10,
    });

    if (error) {
      console.warn('[checkIn] error:', error.message);
      return { success: false, pointsEarned: 0 };
    }

    // Track behavior
    await trackUserBehavior(businessId, 'checkin');

    // Award points via Edge Function (non-blocking)
    supabase.functions
      .invoke('award-points', { body: { userId, action: 'checkin', referenceId: businessId } })
      .catch(() => {});

    return { success: true, pointsEarned: 10 };
  } catch {
    return { success: false, pointsEarned: 0 };
  }
}

// ── Trending Data ────────────────────────────────────────────────────────────

export async function fetchTrendingBusinessIds(limit = 10): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('trending_scores')
      .select('business_id')
      .eq('period', 'weekly')
      .order('score', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((row: any) => row.business_id);
  } catch {
    return [];
  }
}

// ── Leaderboard ────────────────────────────────────────────────────────────

export async function fetchLeaderboard(
  period: 'weekly' | 'monthly' = 'weekly',
  limit = 20,
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select(`
        id, user_id, period, points, rank,
        reviews_count, photos_count, checkins_count, updated_at,
        profiles:user_id (name, avatar)
      `)
      .eq('period', period)
      .order('points', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// ── Reviews ─────────────────────────────────────────────────────────────────

export async function fetchReviewsForBusiness(businessId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, business_id, user_id, rating, text, images, helpful, status, created_at,
        profiles:user_id (name, avatar)
      `)
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function submitReview(
  businessId: string,
  rating: number,
  text: string,
  images?: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase.from('reviews').insert({
      business_id: businessId,
      user_id: userId,
      rating,
      text: text.trim(),
      images: images ?? [],
    });

    if (error) return { success: false, error: error.message };

    // Track behavior + award points (non-blocking)
    trackUserBehavior(businessId, 'review').catch(() => {});
    supabase.functions
      .invoke('award-points', { body: { userId, action: 'review', referenceId: businessId } })
      .catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// ── User Category Affinity ─────────────────────────────────────────────────

export async function fetchUserCategoryAffinity(userId?: string): Promise<any[]> {
  try {
    const uid = userId ?? await getCurrentUserId();
    if (!uid) return [];

    const { data, error } = await supabase
      .from('user_category_affinity')
      .select('*')
      .eq('user_id', uid)
      .order('score', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
