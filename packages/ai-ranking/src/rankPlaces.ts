// ═══════════════════════════════════════════════════════════════════════════
// AI Ranking Engine — CORE (Vector Embedding Edition)
// Smart Context Layer + Cosine Similarity + "Why this place?" explanations
// ═══════════════════════════════════════════════════════════════════════════

import type { Business } from '@nexi/types';
import { extractFeatures, getWeekendBoost, isWeekend, buildEmbeddingText } from './features';
import { DEFAULT_WEIGHTS, adjustWeights, buildBehavioralAdjustments, getNewUserWeights, type RankingWeights } from './weights';
import { buildUserProfile, type UserProfile } from './userProfileVector';
import type { BehaviorAction, UserCategoryAffinity } from '@nexi/types';
import {
  cosineSimilarity,
  normalizeVector,
  type EmbeddingVector,
} from './embeddings';

// ── Smart Context ──────────────────────────────────────────────────────────
export interface SmartContext {
  timeOfDay: string;           // 'morning' | 'afternoon' | 'evening' | 'night'
  isWeekend: boolean;
  userHour: number;            // current hour (0–23)
  isNewUser: boolean;          // user has < 5 interactions
  hasLocation: boolean;        // does user have GPS?
}

export function getSmartContext(userProfile: UserProfile): SmartContext {
  const hour = new Date().getHours();
  let timeOfDay: SmartContext['timeOfDay'];
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  return {
    timeOfDay,
    isWeekend: isWeekend(),
    userHour: hour,
    isNewUser: userProfile.isNewUser,
    hasLocation: false, // set externally
  };
}

// ── Ranking Explanation ────────────────────────────────────────────────────
export interface RankingExplanation {
  reasons: string[];           // bullet-point reasons like "800m near you", "high rating (4.6)"
  score: number;               // final score
  breakdown: {
    distance: number;
    rating: number;
    popularity: number;
    categoryMatch: number;     // now includes vector similarity
    timeRelevance: number;
    trending: number;
    boosts: number;
    penalties: number;
  };
}

export interface RankedResult {
  business: Business;
  score: number;
  explanation: RankingExplanation;
  rank: number;
}

// ── Input type for the ranking engine ─────────────────────────────────────
export interface RankingInput {
  businesses: Business[];
  userLocation?: { latitude: number; longitude: number };
  userProfile: UserProfile;
  categoryAffinities?: UserCategoryAffinity[];
  behaviors?: Array<{ action: BehaviorAction; categoryId?: string }>;
  weights?: RankingWeights;               // optional custom weights
  limit?: number;                          // max results (default 50)
  allSavedBusinessCategories?: string[];   // categories of all saved businesses
  // ── Vector Embedding fields ──────────────────────────────────────────
  /** Pre-computed business embeddings (businessId → vector) */
  businessEmbeddings?: Record<string, EmbeddingVector>;
  /** User preference embedding vector */
  userEmbedding?: EmbeddingVector;
}

// ── Haversine distance (local copy to avoid shared dep for a standalone pkg) ─
function haversineKm(
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

// ── Generate "Why this place?" explanation ────────────────────────────────
function generateExplanation(
  business: Business,
  score: number,
  distanceKm: number | null,
  breakdown: RankingExplanation['breakdown'],
  context: SmartContext,
  profile: UserProfile,
  weights: RankingWeights,
  hasEmbeddingSimilarity: boolean,
): RankingExplanation {
  const reasons: string[] = [];

  // Distance
  if (distanceKm !== null && distanceKm <= 5) {
    if (distanceKm < 1) {
      reasons.push(`${Math.round(distanceKm * 1000)}m near you`);
    } else {
      reasons.push(`${distanceKm.toFixed(1)}km near you`);
    }
  }

  // Rating
  if (business.rating >= 4.0) {
    reasons.push(`high rating (${business.rating.toFixed(1)})`);
  }

  // Vector embedding similarity (semantic match — replaces category string match)
  if (hasEmbeddingSimilarity && breakdown.categoryMatch > 0.15 * weights.categoryMatch) {
    reasons.push('matches your preferences');
  }

  // Category match (fallback when embeddings aren't available)
  if (!hasEmbeddingSimilarity && profile.favoriteCategories.includes(business.categoryId)) {
    reasons.push('similar to places you liked');
  }

  // Trending
  if ((business.trendingScore ?? 0) > 50) {
    reasons.push('trending in your area');
  }

  // Time relevance
  if (breakdown.timeRelevance > 0.15 * weights.timeRelevance) {
    if (context.timeOfDay === 'morning') reasons.push('great for this morning');
    else if (context.timeOfDay === 'afternoon') reasons.push('perfect for this afternoon');
    else if (context.timeOfDay === 'evening') reasons.push('ideal for this evening');
    else if (context.timeOfDay === 'night') reasons.push('good for tonight');
  }

  // Verified
  if (business.verified) {
    reasons.push('verified business');
  }

  // Promoted (only if relevant)
  if (business.isPromoted && breakdown.boosts > 0.03) {
    reasons.push('featured listing');
  }

  // Weekend boost
  if (context.isWeekend && breakdown.boosts > 0.08) {
    reasons.push('great for the weekend');
  }

  // Popularity
  if (business.reviews > 200) {
    reasons.push(`popular with ${business.reviews}+ reviews`);
  }

  // New user — show distance + rating + popular
  if (profile.isNewUser) {
    if (!reasons.some(r => r.includes('popular'))) {
      reasons.push('popular choice');
    }
  }

  return {
    reasons,
    score,
    breakdown,
  };
}

// ── CORE RANKING FUNCTION (Embedding-Enhanced) ────────────────────────────
/**
 * Rank places by AI relevance score using:
 *   - Cosine similarity (vector embedding) for semantic matching
 *   - Distance, rating, popularity, time-of-day, trending
 *   - Smart context layer
 *   - "Why this place?" explanations
 *
 * When businessEmbeddings and userEmbedding are provided,
 * the static category string matching is replaced with true semantic similarity.
 */
export function rankPlaces(input: RankingInput): RankedResult[] {
  const {
    businesses,
    userLocation,
    userProfile,
    behaviors = [],
    categoryAffinities = [],
    weights: customWeights,
    limit = 50,
    allSavedBusinessCategories = [],
    businessEmbeddings = {},
    userEmbedding: inputUserEmbedding,
  } = input;

  // Use the user embedding from input, or from the profile, or computed later
  const userEmbedding = inputUserEmbedding ?? userProfile.userEmbedding;
  const hasEmbeddings = userEmbedding !== undefined && userEmbedding.length > 0 &&
    Object.keys(businessEmbeddings).length > 0;

  // Normalize user embedding once for efficient dot-product comparisons
  const normalizedUserEmbedding = hasEmbeddings ? normalizeVector(userEmbedding!) : null;

  // ── Step 1: Determine weights ─────────────────────────────────────────
  let weights: RankingWeights;
  if (customWeights) {
    weights = customWeights;
  } else if (userProfile.isNewUser) {
    weights = getNewUserWeights();
  } else if (behaviors.length > 5) {
    const adjustments = buildBehavioralAdjustments(behaviors);
    weights = adjustWeights(DEFAULT_WEIGHTS, adjustments);
  } else {
    weights = { ...DEFAULT_WEIGHTS };
  }

  // ── Step 2: Get smart context ─────────────────────────────────────────
  const context = getSmartContext(userProfile);
  context.hasLocation = userLocation != null;

  // ── Step 3: Score each place ──────────────────────────────────────────
  const scored = businesses.map((business) => {
    // Distance
    let distanceKm: number | null = null;
    if (userLocation) {
      distanceKm = haversineKm(
        userLocation.latitude, userLocation.longitude,
        business.latitude, business.longitude,
      );
    }
    const distanceScore = distanceKm !== null
      ? Math.max(0, 1 - distanceKm / 15)
      : 0.5;

    // Rating (0–1)
    const ratingScore = Math.min(1, business.rating / 5);

    // Popularity (log scale)
    const popularityScore = business.reviews > 0
      ? Math.min(1, Math.log(business.reviews + 1) / Math.log(500))
      : 0;

    // ── Category Match: Cosine Similarity (Embedding) or Static fallback ─
    let categoryScore: number;

    if (hasEmbeddings && normalizedUserEmbedding) {
      // Use cosine similarity between user embedding and business embedding
      const bizVector = businessEmbeddings[business.id];
      if (bizVector && bizVector.length > 0) {
        const normalizedBizVector = normalizeVector(bizVector);
        const rawSimilarity = cosineSimilarity(normalizedUserEmbedding, normalizedBizVector);
        // Map from [-1, 1] to [0, 1] and scale up for better differentiation
        categoryScore = Math.max(0, (rawSimilarity + 1) / 2);
      } else {
        // Fallback to category affinity if no embedding for this business
        categoryScore = categoryAffinities.find(a => a.categoryId === business.categoryId)?.score ?? 0.3;
      }
    } else {
      // Static fallback: category string matching
      categoryScore = userProfile.favoriteCategories.includes(business.categoryId)
        ? 1.0
        : (categoryAffinities.find(a => a.categoryId === business.categoryId)?.score ?? 0.3);
    }

    // Time relevance
    const timeScore = (() => {
      const hour = context.userHour;
      const lower = business.category.toLowerCase();

      if (hour >= 6 && hour < 11) {
        if (lower.includes('cafe') || lower.includes('coffee') || lower.includes('breakfast')) return 1.0;
        if (lower.includes('gym') || lower.includes('fitness')) return 0.8;
        if (lower.includes('restaurant') || lower.includes('food')) return 0.6;
        return 0.4;
      }
      if (hour >= 11 && hour < 14) {
        if (lower.includes('restaurant') || lower.includes('food')) return 1.0;
        if (lower.includes('cafe') || lower.includes('coffee')) return 0.7;
        return 0.5;
      }
      if (hour >= 14 && hour < 17) {
        if (lower.includes('shop') || lower.includes('mall') || lower.includes('market')) return 0.9;
        if (lower.includes('cafe') || lower.includes('coffee')) return 0.8;
        if (lower.includes('bank') || lower.includes('finance')) return 0.7;
        if (lower.includes('salon') || lower.includes('beauty')) return 0.7;
        return 0.5;
      }
      if (hour >= 17 && hour < 21) {
        if (lower.includes('restaurant') || lower.includes('food')) return 1.0;
        if (lower.includes('night') || lower.includes('club') || lower.includes('bar')) return 0.7;
        if (lower.includes('lounge')) return 0.7;
        if (lower.includes('hotel')) return 0.6;
        return 0.5;
      }
      if (hour >= 21 || hour < 6) {
        if (lower.includes('night') || lower.includes('club') || lower.includes('bar')) return 1.0;
        if (lower.includes('lounge')) return 0.9;
        if (business.hours?.includes('24')) return 1.0;
        if (lower.includes('fuel') || lower.includes('gas')) return 0.8;
        if (lower.includes('hospital') || lower.includes('pharmacy')) return 0.7;
        return 0.2;
      }
      return 0.5;
    })();

    // Trending
    const trendingScore = (business.trendingScore ?? 0) / 100;

    // Promotion boost
    const promoBoost = business.isPromoted ? weights.promotionBoost : 0;

    // Weekend boost
    const weekendBoost = getWeekendBoost(business.category) * (context.isWeekend ? 1 : 0);

    // Verified boost
    const verifiedBoost = business.verified ? weights.verifiedBoost : 0;

    // Saved similarity boost
    const savedMatchCount = allSavedBusinessCategories.filter(c => c === business.categoryId).length;
    const savedSimilarityBoost = userProfile.savedPlaceIds.length > 0 && allSavedBusinessCategories.length > 0
      ? Math.min(weights.savedBoost, (savedMatchCount / allSavedBusinessCategories.length) * weights.savedBoost * 2)
      : 0;

    // Visited penalty
    const visitedPenalty = userProfile.visitedPlaceIds.includes(business.id)
      ? weights.visitedPenalty
      : 0;

    // ── Compute final score ─────────────────────────────────────────────
    const rawScore =
      distanceScore * weights.distance +
      ratingScore * weights.rating +
      popularityScore * weights.popularity +
      categoryScore * weights.categoryMatch +
      timeScore * weights.timeRelevance +
      trendingScore * weights.trending +
      promoBoost +
      weekendBoost +
      verifiedBoost +
      savedSimilarityBoost +
      visitedPenalty;

    const finalScore = Math.max(0, rawScore);

    // ── Breakdown for explanation ───────────────────────────────────────
    const breakdown: RankingExplanation['breakdown'] = {
      distance: distanceScore * weights.distance,
      rating: ratingScore * weights.rating,
      popularity: popularityScore * weights.popularity,
      categoryMatch: categoryScore * weights.categoryMatch,
      timeRelevance: timeScore * weights.timeRelevance,
      trending: trendingScore * weights.trending,
      boosts: promoBoost + weekendBoost + verifiedBoost + savedSimilarityBoost,
      penalties: visitedPenalty,
    };

    const explanation = generateExplanation(
      business,
      finalScore,
      distanceKm,
      breakdown,
      context,
      userProfile,
      weights,
      hasEmbeddings,
    );

    return {
      business,
      score: finalScore,
      explanation,
      rank: 0, // assigned below
    };
  });

  // ── Step 4: Sort by score descending ──────────────────────────────────
  scored.sort((a, b) => b.score - a.score);

  // ── Step 5: Assign ranks and limit ────────────────────────────────────
  const limited = scored.slice(0, limit).map((result, i) => ({
    ...result,
    rank: i + 1,
  }));

  return limited;
}

// ── Convenience wrapper ────────────────────────────────────────────────────
export function rankForUserProfile(
  businesses: Business[],
  profile: UserProfile,
  userLocation?: { latitude: number; longitude: number },
  behaviors?: Array<{ action: BehaviorAction; categoryId?: string }>,
  categoryAffinities?: UserCategoryAffinity[],
  limit = 50,
  businessEmbeddings?: Record<string, EmbeddingVector>,
): RankedResult[] {
  return rankPlaces({
    businesses,
    userLocation,
    userProfile: profile,
    behaviors,
    categoryAffinities,
    limit,
    businessEmbeddings,
    userEmbedding: profile.userEmbedding,
  });
}
