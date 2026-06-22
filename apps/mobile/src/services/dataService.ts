// ── Data Synchronization Service (Supabase) ──────────────────────────────
// Replaces the NestJS REST API with direct Supabase PostgreSQL queries.
// All businesses and saved places are stored in Supabase.
// ──────────────────────────────────────────────────────────────────────────

import { supabase, rowToBusiness } from './supabase';
import type { Business } from '../store/appStore';

const MOCK_USER_ID = 'user-1';

export interface SyncResult {
  businesses: Business[];
  savedPlaceIds: string[];
}

// ── Haversine distance (km) for client-side sorting ──────────────────────
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ── Fetch all businesses from Supabase ────────────────────────────────────
export async function fetchBusinesses(
  categoryId?: string,
  search?: string,
  lat?: number,
  lng?: number,
): Promise<Business[]> {
  try {
    let query = supabase.from('businesses').select('*').eq('status', 'active');

    // Category filter
    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    // Search filter — match against name, category, or address
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,category.ilike.%${search}%,address.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    // Fetch up to 200 results, ordered by rating desc for a good default sort
    const { data, error } = await query
      .order('rating', { ascending: false })
      .limit(200);

    if (error) {
      console.warn('[fetchBusinesses] Supabase error:', error.message, '| code:', error.code);
      return [];
    }

    console.log(`[fetchBusinesses] Got ${data?.length ?? 0} rows (cat=${categoryId}, q=${search})`);

    if (!data || data.length === 0) return [];

    let businesses = data.map(rowToBusiness);

    // Sort by real GPS distance if user location provided
    if (lat && lng) {
      businesses.sort((a, b) => {
        const da = haversineKm(lat, lng, a.latitude, a.longitude);
        const db = haversineKm(lat, lng, b.latitude, b.longitude);
        return da - db;
      });
      businesses = businesses.map((b) => ({
        ...b,
        distance: formatDistance(haversineKm(lat, lng, b.latitude, b.longitude)),
      }));
    }

    return businesses;
  } catch (error) {
    console.warn('[fetchBusinesses] Exception:', error);
    return [];
  }
}

// ── Fetch a single business by ID ─────────────────────────────────────────
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

// ── Sync all data: businesses + saved places ──────────────────────────────
export async function syncAllData(): Promise<SyncResult> {
  const [businesses, savedIds] = await Promise.all([
    fetchBusinesses(),
    fetchSavedPlaceIds(),
  ]);
  return { businesses, savedPlaceIds: savedIds };
}

// ── Saved Places ──────────────────────────────────────────────────────────

export async function fetchSavedPlaceIds(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('saved_places')
      .select('business_id')
      .eq('user_id', MOCK_USER_ID);

    if (error) {
      console.warn('Supabase fetchSavedPlaceIds error:', error.message);
      return [];
    }

    return (data || []).map((row) => row.business_id);
  } catch {
    return [];
  }
}

export async function savePlaceOnBackend(businessId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_places')
      .insert({ user_id: MOCK_USER_ID, business_id: businessId });

    if (error) {
      // If duplicate (already saved), that's fine
      if (error.code === '23505') return true;
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
    const { error } = await supabase
      .from('saved_places')
      .delete()
      .eq('user_id', MOCK_USER_ID)
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
