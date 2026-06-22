// ── Supabase Client ─────────────────────────────────────────────────────────
// Direct PostgreSQL client for the mobile app.
// Replaces the NestJS REST API with direct Supabase queries.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import type { Business } from '../store/appStore';

// ── Supabase credentials (set in environment / .env) ──────────────────────
const SUPABASE_URL = 'https://cktqmupahwvrfuztnksl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kozctxvVEy9OP5HH0srTJA_EMuD9oku';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // React Native; we handle user identity via mock userId
  },
});

// ── Typed row shapes matching the Supabase tables ─────────────────────────

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
  created_at: string;
  updated_at: string;
}

export interface SavedPlaceRow {
  id: number;
  user_id: string;
  business_id: string;
  saved_at: string;
}

// ── Map a Supabase row to the app's Business type ─────────────────────────
export function rowToBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryId: row.category_id,
    rating: row.rating,
    reviews: row.reviews,
    distance: row.distance,
    latitude: row.latitude,
    longitude: row.longitude,
    image: row.image,
    verified: row.verified,
    description: row.description,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    hours: row.hours ?? undefined,
    address: row.address,
  };
}
