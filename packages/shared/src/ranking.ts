// ═══════════════════════════════════════════════════════════════════════════
// Ranking & Trending Score Algorithm
// Wilson Score Confidence Interval + Review Velocity Weighting
// ═══════════════════════════════════════════════════════════════════════════

import type { Business } from '@nexi/types';

// ── Wilson Score Lower Bound (95% CI) ─────────────────────────────────────
// Better than simple average — punishes businesses with few reviews
// Returns a score between 0 and 1
export function wilsonScore(positive: number, total: number): number {
  if (total === 0) return 0;
  const z = 1.96; // 95% confidence
  const phat = positive / total;
  const numerator = phat + z * z / (2 * total) - z * Math.sqrt((phat * (1 - phat) + z * z / (4 * total)) / total);
  const denominator = 1 + z * z / total;
  return numerator / denominator;
}

// ── Rating to positive ratio ──────────────────────────────────────────────
// Treat 4+ star reviews as "positive"
export function ratingToWilson(rating: number, reviewCount: number): number {
  // Approximate positive reviews based on rating distribution
  // rating 5 → ~90% positive, rating 4 → ~70%, rating 3 → ~50%
  const positiveFraction = Math.max(0, (rating - 2) / 3);
  const positiveCount = Math.round(positiveFraction * reviewCount);
  return wilsonScore(positiveCount, reviewCount);
}

// ── Trending Score (for pre-computation) ─────────────────────────────────
/**
 * Trending score formula (run server-side):
 * score = (reviews_7d * 3) + (checkins_7d * 2) + (saves_7d * 1) + (rating * 10)
 *
 * This is what the Edge Function `update-trending` computes.
 * Client-side we use the pre-computed score from the DB.
 */
export function computeTrendingScore(params: {
  reviewsLast7Days: number;
  checkInsLast7Days: number;
  savesLast7Days: number;
  avgRating: number;
}): number {
  const { reviewsLast7Days, checkInsLast7Days, savesLast7Days, avgRating } = params;
  return (
    reviewsLast7Days * 3 +
    checkInsLast7Days * 2 +
    savesLast7Days * 1 +
    avgRating * 10
  );
}

// ── Sort by trending score ─────────────────────────────────────────────────
export function sortByTrending(businesses: Business[]): Business[] {
  return [...businesses].sort(
    (a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0),
  );
}

// ── Sort by Wilson score (quality-adjusted rating) ─────────────────────────
export function sortByQuality(businesses: Business[]): Business[] {
  return [...businesses].sort((a, b) => {
    const scoreA = ratingToWilson(a.rating, a.reviews);
    const scoreB = ratingToWilson(b.rating, b.reviews);
    return scoreB - scoreA;
  });
}

// ── Category Affinity Update (incremental) ───────────────────────────────
/**
 * Incrementally update a category affinity score.
 * Uses exponential moving average (α = 0.3) for recency weighting.
 */
export function updateCategoryAffinity(
  currentScore: number,
  interactionCount: number,
  newInteractionWeight: number = 1,
  alpha: number = 0.3,
): number {
  if (interactionCount === 0) return newInteractionWeight;
  return alpha * newInteractionWeight + (1 - alpha) * currentScore;
}

// ── Level thresholds ────────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3200, 4500, 6000, 10000];

export function getLevelFromPoints(totalEarned: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalEarned >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getPointsForNextLevel(totalEarned: number): {
  currentLevel: number;
  nextLevel: number;
  pointsNeeded: number;
  progressPercent: number;
} {
  const currentLevel = getLevelFromPoints(totalEarned);
  const nextLevel = Math.min(currentLevel + 1, LEVEL_THRESHOLDS.length);
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel - 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const pointsInCurrentLevel = totalEarned - currentThreshold;
  const pointsNeededForNext = nextThreshold - currentThreshold;
  return {
    currentLevel,
    nextLevel,
    pointsNeeded: nextThreshold - totalEarned,
    progressPercent: Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForNext) * 100)),
  };
}

// ── Points for actions ─────────────────────────────────────────────────────
export const POINTS_TABLE: Record<string, number> = {
  daily_login: 5,
  checkin: 10,
  photo: 25,
  review: 50,
  referral: 100,
  claim_business: 200,
  first_review: 75, // bonus for first review on a business
  helpful_review: 15, // someone marked your review helpful
};

export function getPointsForAction(action: string): number {
  return POINTS_TABLE[action] ?? 0;
}
