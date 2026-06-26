// ═══════════════════════════════════════════════════════════════════════════
// Dynamic Weights
// Default weights + runtime adjustment based on user behavior.
// ═══════════════════════════════════════════════════════════════════════════

import type { BehaviorAction } from '@nexi/types';

// ── Weight configuration ───────────────────────────────────────────────────
export interface RankingWeights {
  distance: number;          // proximity importance
  rating: number;            // rating importance
  popularity: number;        // popularity (review count) importance
  categoryMatch: number;     // category affinity importance
  timeRelevance: number;     // time-of-day relevance importance
  trending: number;          // trending score importance
  promotionBoost: number;    // promotional boost
  weekendBoost: number;      // weekend entertainment boost
  visitedPenalty: number;    // penalty for already-visited places
  savedBoost: number;        // boost for places similar to saved ones
  verifiedBoost: number;     // boost for verified businesses
}

// ── Default Weights ────────────────────────────────────────────────────────
export const DEFAULT_WEIGHTS: RankingWeights = {
  distance: 0.25,
  rating: 0.20,
  popularity: 0.10,
  categoryMatch: 0.20,
  timeRelevance: 0.10,
  trending: 0.10,
  promotionBoost: 0.05,
  weekendBoost: 0.05,
  visitedPenalty: -0.10,
  savedBoost: 0.08,
  verifiedBoost: 0.05,
};

// ── Behavioral adjustment tracking ─────────────────────────────────────────
export interface BehavioralAdjustments {
  categoryClicks: Record<string, number>;   // categoryId → click count
  categorySaves: Record<string, number>;    // categoryId → save count
  categoryCheckins: Record<string, number>; // categoryId → check-in count
  totalInteractions: number;
}

export function emptyBehavioralAdjustments(): BehavioralAdjustments {
  return {
    categoryClicks: {},
    categorySaves: {},
    categoryCheckins: {},
    totalInteractions: 0,
  };
}

// ── Build behavioral adjustments from user behavior data ──────────────────
export function buildBehavioralAdjustments(
  behaviors: Array<{ action: BehaviorAction; categoryId?: string }>,
): BehavioralAdjustments {
  const adj = emptyBehavioralAdjustments();

  for (const b of behaviors) {
    const catId = b.categoryId || 'unknown';
    adj.totalInteractions++;

    if (b.action === 'view' || b.action === 'search_click') {
      adj.categoryClicks[catId] = (adj.categoryClicks[catId] || 0) + 1;
    } else if (b.action === 'save') {
      adj.categorySaves[catId] = (adj.categorySaves[catId] || 0) + 1;
    } else if (b.action === 'checkin') {
      adj.categoryCheckins[catId] = (adj.categoryCheckins[catId] || 0) + 1;
    }
  }

  return adj;
}

// ── Adjust weights based on behavior ───────────────────────────────────────
// Dynamically tunes weights when user has strong category preferences.
export function adjustWeights(
  baseWeights: RankingWeights,
  adjustments: BehavioralAdjustments,
): RankingWeights {
  if (adjustments.totalInteractions < 5) return { ...baseWeights }; // not enough data

  const weights = { ...baseWeights };

  // For each category with high activity, boost categoryMatch weight
  let maxCategoryAffinity = 0;
  for (const catId of Object.keys(adjustments.categoryClicks)) {
    const clicks = adjustments.categoryClicks[catId] || 0;
    const saves = adjustments.categorySaves[catId] || 0;
    const checkins = adjustments.categoryCheckins[catId] || 0;
    const total = clicks + saves * 2 + checkins * 3; // weighted interaction score
    if (total > maxCategoryAffinity) maxCategoryAffinity = total;
  }

  const totalInteractions = adjustments.totalInteractions;

  // If user has > 10 clicks on a single category type, boost category match significantly
  if (maxCategoryAffinity > 10) {
    const boostFactor = Math.min(0.15, (maxCategoryAffinity / totalInteractions) * 0.12);
    weights.categoryMatch = Math.min(0.40, baseWeights.categoryMatch + boostFactor);
    // Reduce distance and general popularity to compensate
    weights.distance = Math.max(0.10, baseWeights.distance - boostFactor * 0.5);
    weights.popularity = Math.max(0.05, baseWeights.popularity - boostFactor * 0.3);
  }

  // If user mostly checks in (heavy user), boost trending & time relevance
  const checkinRatio = Object.values(adjustments.categoryCheckins).reduce((a, b) => a + b, 0) / Math.max(1, totalInteractions);
  if (checkinRatio > 0.3) {
    weights.trending = Math.min(0.20, baseWeights.trending + 0.05);
    weights.timeRelevance = Math.min(0.20, baseWeights.timeRelevance + 0.05);
  }

  return weights;
}

// ── Set weights for a "new user" (exploration mode) ────────────────────────
export function getNewUserWeights(): RankingWeights {
  return {
    distance: 0.20,
    rating: 0.25,           // higher — rely on others' ratings
    popularity: 0.20,        // higher — show popular places
    categoryMatch: 0.10,     // lower — explore new categories
    timeRelevance: 0.10,
    trending: 0.15,          // higher — show what's trending
    promotionBoost: 0.05,
    weekendBoost: 0.05,
    visitedPenalty: 0,
    savedBoost: 0,
    verifiedBoost: 0.05,
  };
}

// ── Export default weight validator ────────────────────────────────────────
export function validateWeights(weights: RankingWeights): boolean {
  const total =
    weights.distance +
    weights.rating +
    weights.popularity +
    weights.categoryMatch +
    weights.timeRelevance +
    weights.trending +
    weights.promotionBoost +
    weights.weekendBoost +
    weights.verifiedBoost;

  // Allow penalties to bring total below 1
  return total >= 0.5 && total <= 1.5;
}
