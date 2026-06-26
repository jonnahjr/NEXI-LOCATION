// ═══════════════════════════════════════════════════════════════════════════
// Recommendation Scoring Algorithm
// Used by: recommendationService.ts (mobile), Edge Functions
// ═══════════════════════════════════════════════════════════════════════════

import type { Business, UserCategoryAffinity } from '@nexi/types';

export interface ScoringContext {
  userLat?: number;
  userLng?: number;
  categoryAffinities?: UserCategoryAffinity[];
  savedPlaceIds?: string[];
  visitedBusinessIds?: string[]; // check-in history
}

// ── Haversine distance (km) ────────────────────────────────────────────────
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

// ── Distance Score ─────────────────────────────────────────────────────────
// Score 0–1. Closer = higher. Max relevant distance: 15 km
function distanceScore(distanceKm: number): number {
  if (distanceKm <= 0) return 1;
  if (distanceKm > 15) return 0;
  return Math.max(0, 1 - distanceKm / 15);
}

// ── Category Affinity Score ────────────────────────────────────────────────
// Score 0–1 based on user's historical preference for this category
function categoryAffinityScore(
  categoryId: string,
  affinities: UserCategoryAffinity[],
): number {
  const affinity = affinities.find((a) => a.categoryId === categoryId);
  if (!affinity) return 0.1; // small default for exploration
  return Math.min(1, affinity.score);
}

// ── Rating Score ───────────────────────────────────────────────────────────
// Normalized 0–1 from 0–5 rating
function ratingScore(rating: number): number {
  return Math.max(0, Math.min(1, rating / 5));
}

// ── Trending Score ─────────────────────────────────────────────────────────
// Normalized 0–1 from pre-computed trending score (max ~100)
function trendingScore(score?: number): number {
  if (!score) return 0;
  return Math.min(1, score / 100);
}

// ── Promoted Boost ─────────────────────────────────────────────────────────
function promotionBoost(isPromoted?: boolean): number {
  return isPromoted ? 0.15 : 0;
}

// ── Penalize already visited ───────────────────────────────────────────────
function visitedPenalty(businessId: string, visitedIds: string[]): number {
  return visitedIds.includes(businessId) ? -0.1 : 0;
}

// ── MAIN SCORING FUNCTION ──────────────────────────────────────────────────
/**
 * Compute a 0–1 recommendation score for a business given the user context.
 *
 * Weights:
 *   - Distance:          40%
 *   - Category affinity: 30%
 *   - Rating:            20%
 *   - Trending:          10%
 *   + Promotion boost:   +15% flat
 *   + Visited penalty:   -10% flat
 */
export function scoreBusinessForUser(
  business: Business,
  context: ScoringContext,
): number {
  const {
    userLat,
    userLng,
    categoryAffinities = [],
    visitedBusinessIds = [],
  } = context;

  let dScore = 0.5; // default if no GPS
  if (userLat != null && userLng != null) {
    const km = haversineKm(userLat, userLng, business.latitude, business.longitude);
    dScore = distanceScore(km);
  }

  const catScore = categoryAffinityScore(business.categoryId, categoryAffinities);
  const rScore = ratingScore(business.rating);
  const tScore = trendingScore(business.trendingScore);
  const pBoost = promotionBoost(business.isPromoted);
  const vPenalty = visitedPenalty(business.id, visitedBusinessIds);

  const rawScore =
    dScore * 0.40 +
    catScore * 0.30 +
    rScore * 0.20 +
    tScore * 0.10 +
    pBoost +
    vPenalty;

  return Math.max(0, Math.min(1.15, rawScore)); // clamp to [0, 1.15] with promotion ceiling
}

// ── Rank businesses for a user ─────────────────────────────────────────────
export function rankBusinessesForUser(
  businesses: Business[],
  context: ScoringContext,
  limit = 20,
): Business[] {
  return businesses
    .map((b) => ({
      ...b,
      recommendationScore: scoreBusinessForUser(b, context),
      distance: (context.userLat != null && context.userLng != null)
        ? formatDistance(haversineKm(context.userLat, context.userLng, b.latitude, b.longitude))
        : b.distance,
    }))
    .sort((a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0))
    .slice(0, limit);
}

// ── Get businesses by distance only ───────────────────────────────────────
export function sortByDistance(
  businesses: Business[],
  userLat: number,
  userLng: number,
): Business[] {
  return [...businesses]
    .map((b) => ({
      ...b,
      distance: formatDistance(haversineKm(userLat, userLng, b.latitude, b.longitude)),
      _distKm: haversineKm(userLat, userLng, b.latitude, b.longitude),
    }))
    .sort((a, b) => (a._distKm ?? 0) - (b._distKm ?? 0));
}
