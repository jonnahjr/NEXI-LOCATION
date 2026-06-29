// ═══════════════════════════════════════════════════════════════════════════
// Search Service — Smart Search with Postgres FTS
// Ranks results by geo, trending popularity, and text match.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase, rowToBusiness } from './supabase';
import { getCurrentUserId } from './authService';
import type { Business } from '../store/appStore';

type BusinessWithScore = Business & { _distKm?: number; _rankScore?: number };
import { haversineKm, formatDistance, sortByDistance } from '@nexi/shared';

export interface SearchOptions {
  query: string;
  categoryId?: string;
  cityId?: string;
  userLat?: number;
  userLng?: number;
  limit?: number;
}

export async function smartSearch(options: SearchOptions): Promise<Business[]> {
  const { query, categoryId, cityId, userLat, userLng, limit = 50 } = options;
  const startMs = Date.now();

  try {
    let dbQuery = supabase.from('businesses').select('*').eq('status', 'active');

    // 1. Text match (if provided) using Postgres FTS
    if (query && query.trim() !== '') {
      // Clean query for websearch_to_tsquery
      const cleanQuery = query.trim().replace(/[&|!():*]/g, ' ');
      if (cleanQuery) {
        dbQuery = dbQuery.textSearch('search_vector', cleanQuery, { config: 'english' });
      }
    }

    // 2. Filters
    if (categoryId && categoryId !== 'all') {
      dbQuery = dbQuery.eq('category_id', categoryId);
    }
    if (cityId) {
      dbQuery = dbQuery.eq('city_id', cityId);
    }

    const { data, error } = await dbQuery.limit(limit);

    if (error) {
      console.warn('[searchService] Error:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      logSearch(query, 0).catch(() => {});
      return [];
    }

    let businesses: Business[] = data.map(rowToBusiness);

    // 3. Rank results
    // If we have user location, rank by distance + popularity
    if (userLat != null && userLng != null) {
      const scored: BusinessWithScore[] = businesses
        .map((b) => {
          const distKm = haversineKm(userLat, userLng, b.latitude, b.longitude);
          const tScore = b.trendingScore || 0;
          
          // Distance score (0-1, max 15km)
          const distScore = Math.max(0, 1 - distKm / 15);
          
          // Hybrid ranking score
          const rankScore = (distScore * 0.7) + ((Math.min(tScore, 100) / 100) * 0.3);

          return {
            ...b,
            distance: formatDistance(distKm),
            _distKm: distKm,
            _rankScore: rankScore,
          };
        })
        .sort((a, b) => (b._rankScore ?? 0) - (a._rankScore ?? 0));

      // Remove internal props and return clean businesses
      businesses = scored.map(({ _distKm, _rankScore, ...clean }) => clean);
    } else {
      // Fallback: sort by rating & trending
      businesses.sort((a, b) => {
        const scoreA = (a.rating * 10) + (a.trendingScore || 0);
        const scoreB = (b.rating * 10) + (b.trendingScore || 0);
        return scoreB - scoreA;
      });
    }

    logSearch(query, businesses.length).catch(() => {});
    return businesses;
  } catch (err) {
    console.warn('[searchService] Exception:', err);
    return [];
  }
}

// ── Search Analytics ──────────────────────────────────────────────────────

async function logSearch(query: string, resultCount: number): Promise<void> {
  if (!query || query.trim().length < 2) return;
  try {
    const userId = await getCurrentUserId();
    await supabase.from('search_logs').insert({
      user_id: userId,
      query: query.trim(),
      result_count: resultCount,
    });
  } catch {
    // silently fail
  }
}

// ── Trending Searches ─────────────────────────────────────────────────────

export async function fetchTrendingSearches(limit = 5): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('search_logs')
      .select('query')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // last 7 days

    if (error || !data) return [];

    // Aggregate
    const counts: Record<string, number> = {};
    data.forEach(row => {
      const q = row.query.toLowerCase();
      counts[q] = (counts[q] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);
  } catch {
    return [];
  }
}
