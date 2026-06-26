// ═══════════════════════════════════════════════════════════════════════════
// Place Feature Vector
// Converts raw business data into "AI-readable" features for ranking.
// ═══════════════════════════════════════════════════════════════════════════

import type { Business } from '@nexi/types';
import type { EmbeddingVector } from './embeddings';
import { buildBusinessEmbeddingText } from './embeddings';

// ── Place Features ─────────────────────────────────────────────────────────
// Each place becomes an AI-readable feature vector
export interface PlaceFeatures {
  businessId: string;
  distance: number;         // km from user
  rating: number;           // 0–5
  reviewCount: number;      // total reviews
  categoryMatch: number;    // 0–1 how well this matches user's preferred categories
  popularity: number;       // normalized popularity score (0–1)
  checkins: number;         // total check-ins
  timeOfDayScore: number;   // 0–1 how relevant this place is at current time
  savedCount: number;       // how many users have saved this place
  trending: number;         // trending score (0–1)
  isPromoted: boolean;       // paid promotion
  hours: string | undefined; // raw hours string for context layer
  priceLevel: number | undefined; // 1–3 (low, medium, high)
  verified: boolean;         // verified by admin
  features: string[] | undefined; // amenity features
  // ── Vector Embedding ────────────────────────────────────────────────
  /** Text representation of this business (used for embedding generation) */
  embeddingText: string;
  /** Business embedding vector (set externally by embedding service) */
  embedding?: EmbeddingVector;
  /** Cosine similarity score between user embedding and this business embedding */
  embeddingSimilarity: number;
}

// ── Build embedding text for a business ────────────────────────────────────
// Delegates to embeddings.ts — single source of truth for text construction.
export function buildEmbeddingText(business: Business): string {
  return buildBusinessEmbeddingText({
    name: business.name,
    category: business.category,
    description: business.description,
    features: business.features,
    address: business.address,
    priceLevel: business.priceLevel,
  });
}

// ── Extract place features from a full business object ────────────────────
export function extractFeatures(
  business: Business,
  distanceKm: number,
  userCategoryIds: string[] = [],
): PlaceFeatures {
  // Category match: does user like this category?
  const categoryMatch = userCategoryIds.includes(business.categoryId) ? 1.0 : 0.3;

  // Normalize popularity using log scale
  const popularity = business.reviews > 0
    ? Math.min(1, Math.log(business.reviews + 1) / Math.log(500))
    : 0;

  // Time-of-day relevance score (0–1)
  const timeOfDayScore = computeTimeRelevance(business.category, business.hours);

  return {
    businessId: business.id,
    distance: distanceKm,
    rating: business.rating,
    reviewCount: business.reviews,
    categoryMatch,
    popularity,
    checkins: 0, // populated from check-in data later
    timeOfDayScore,
    savedCount: 0, // populated from saved-places data later
    trending: business.trendingScore
      ? Math.min(1, business.trendingScore / 100)
      : 0,
    isPromoted: business.isPromoted ?? false,
    hours: business.hours,
    priceLevel: business.priceLevel,
    verified: business.verified,
    features: business.features,
    // ── Vector Embedding fields ────────────────────────────────────
    embeddingText: buildEmbeddingText(business),
    embedding: undefined,
    embeddingSimilarity: 0,
  };
}

// ── Time-of-Day Relevance ──────────────────────────────────────────────────
export function computeTimeRelevance(
  category: string,
  hours?: string,
): number {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;
  const lower = category.toLowerCase();

  // Morning (6–11): boost cafes, breakfast spots
  if (hour >= 6 && hour < 11) {
    if (lower.includes('cafe') || lower.includes('coffee') || lower.includes('breakfast')) return 1.0;
    if (lower.includes('restaurant')) return 0.6;
    if (lower.includes('gym') || lower.includes('fitness')) return 0.8;
    return 0.4;
  }

  // Lunch (11–14): boost restaurants, fast food
  if (hour >= 11 && hour < 14) {
    if (lower.includes('restaurant') || lower.includes('food') || lower.includes('fast')) return 1.0;
    if (lower.includes('cafe') || lower.includes('coffee')) return 0.7;
    return 0.5;
  }

  // Afternoon (14–17): cafes, shopping, services
  if (hour >= 14 && hour < 17) {
    if (lower.includes('cafe') || lower.includes('coffee')) return 0.8;
    if (lower.includes('shop') || lower.includes('mall') || lower.includes('market')) return 0.9;
    if (lower.includes('bank') || lower.includes('finance')) return 0.7;
    if (lower.includes('salon') || lower.includes('beauty')) return 0.7;
    return 0.5;
  }

  // Evening (17–21): dinner, entertainment
  if (hour >= 17 && hour < 21) {
    if (lower.includes('restaurant') || lower.includes('food')) return 1.0;
    if (lower.includes('night') || lower.includes('club') || lower.includes('bar')) return 0.7;
    if (lower.includes('lounge')) return 0.7;
    if (lower.includes('hotel')) return 0.6;
    return 0.5;
  }

  // Night (21–6): nightlife, 24hr places
  if (hour >= 21 || hour < 6) {
    if (lower.includes('night') || lower.includes('club') || lower.includes('bar')) return 1.0;
    if (lower.includes('lounge')) return 0.9;
    if (hours?.includes('24')) return 1.0;
    if (lower.includes('fuel') || lower.includes('gas')) return 0.8;
    if (lower.includes('hospital') || lower.includes('pharmacy')) return 0.7;
    return 0.2;
  }

  return 0.5;
}

// ── Weekend boost for entertainment ────────────────────────────────────────
export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

export function getWeekendBoost(category: string): number {
  if (!isWeekend()) return 0;
  const lower = category.toLowerCase();
  if (lower.includes('night') || lower.includes('club') || lower.includes('bar')) return 0.15;
  if (lower.includes('restaurant') || lower.includes('food')) return 0.1;
  if (lower.includes('lounge')) return 0.1;
  if (lower.includes('entertainment') || lower.includes('culture')) return 0.15;
  if (lower.includes('park') || lower.includes('recreation')) return 0.12;
  return 0.05;
}
