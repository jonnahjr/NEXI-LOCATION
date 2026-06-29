// ═══════════════════════════════════════════════════════════════════════════
// Supabase Client — Production Configuration
// Session persistence enabled via AsyncStorage.
// ═══════════════════════════════════════════════════════════════════════════

// Required polyfill for Supabase in React Native (URL, URLSearchParams)
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import type { Business } from '../store/appStore';
import type { PromotionType } from '@nexi/types';

// ── Credentials ────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://cktqmupahwvrfuztnksl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kozctxvVEy9OP5HH0srTJA_EMuD9oku';

// ── Client with session persistence ───────────────────────────────────────
// Expo / React Native stores the session in AsyncStorage automatically
// when using @supabase/supabase-js v2 with the default storage adapter.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // React Native doesn't use URL-based session
  },
});

// ── Typed row shapes ────────────────────────────────────────────────────────

export interface BusinessRow {
  id: string;
  name: string;
  category: string;
  category_id: string;
  rating: number;
  reviews: number;
  distance: string;
  latitude: number;
  longitude: number;
  image: string;
  verified: boolean;
  description: string;
  phone: string | null;
  website: string | null;
  hours: string | null;
  address: string;
  city: string | null;
  price_level: number | null;
  features: string[] | null;
  status: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields from trending_scores
  trending_score?: number;
  // Joined fields from business_promotions
  is_promoted?: boolean;
  promotion_type?: string;
}

export interface SavedPlaceRow {
  id: number;
  user_id: string;
  business_id: string;
  saved_at: string;
}

export interface ProfileRow {
  id: string;
  auth_id: string | null;
  email: string;
  phone: string | null;
  name: string;
  avatar: string | null;
  role: string;
  points: number;
  total_earned: number;
  level: number;
  verified: boolean;
  review_count: number;
  photo_count: number;
  city: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// ── Row → Business mapper ──────────────────────────────────────────────────
export function rowToBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryId: row.category_id,
    rating: row.rating,
    reviews: row.reviews,
    distance: row.distance ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    image: row.image,
    verified: row.verified,
    description: row.description,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    hours: row.hours ?? undefined,
    address: row.address,
    city: row.city ?? undefined,
    priceLevel: row.price_level ?? undefined,
    features: row.features ?? undefined,
    status: (row.status || 'active') as Business['status'],
    ownerId: row.owner_id ?? undefined,
    trendingScore: row.trending_score,
    isPromoted: row.is_promoted ?? false,
    promotionType: (row.promotion_type || undefined) as PromotionType | undefined,
  };
}
