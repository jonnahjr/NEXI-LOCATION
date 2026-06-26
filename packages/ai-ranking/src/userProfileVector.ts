// ═══════════════════════════════════════════════════════════════════════════
// User Preference Vector
// Builds a rich user profile from behavior data, saved places, and affinities.
// ═══════════════════════════════════════════════════════════════════════════

import type { BehaviorAction, UserCategoryAffinity } from '@nexi/types';
import type { EmbeddingVector } from './embeddings';
import { buildUserEmbeddingText } from './embeddings';

// ── User Profile ───────────────────────────────────────────────────────────
export interface UserProfile {
  userId: string;
  favoriteCategories: string[];            // category IDs the user prefers
  favoriteCategoryScores: Record<string, number>; // categoryId → affinity score (0–1)
  visitedPlaceIds: string[];               // places user has checked in to
  savedPlaceIds: string[];                 // places user has saved
  avgSpendLevel: number;                   // average price level (0–3)
  isNewUser: boolean;                      // < 5 total interactions
  totalInteractions: number;
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening' | 'night' | 'mixed';
  categoryInteractionCounts: Record<string, number>; // categoryId → total interactions
  topCategories: string[];                 // top 3 categories by interaction count
  // ── Vector Embeddings ──────────────────────────────────────────────
  /** Text representation of user preferences (used for embedding generation) */
  preferenceText: string;
  /** User preference embedding vector (set externally by embedding service) */
  userEmbedding?: EmbeddingVector;
}

// ── Build user profile from raw data ───────────────────────────────────────
export function buildUserProfile(params: {
  userId: string;
  categoryAffinities?: UserCategoryAffinity[];
  visitedPlaceIds?: string[];
  savedPlaceIds?: string[];
  behaviors?: Array<{ action: BehaviorAction; categoryId?: string }>;
  totalInteractions?: number;
}): UserProfile {
  const {
    userId,
    categoryAffinities = [],
    visitedPlaceIds = [],
    savedPlaceIds = [],
    behaviors = [],
    totalInteractions = behaviors.length,
  } = params;

  // Build favorite categories from affinities
  const favoriteCategoryScores: Record<string, number> = {};
  for (const aff of categoryAffinities) {
    favoriteCategoryScores[aff.categoryId] = aff.score;
  }

  // Sort by score descending
  const sortedCategories = [...categoryAffinities]
    .sort((a, b) => b.score - a.score)
    .map(a => a.categoryId);

  const favoriteCategories = sortedCategories.slice(0, 5);

  // Track category interaction counts from behaviors
  const categoryInteractionCounts: Record<string, number> = {};
  for (const b of behaviors) {
    const catId = b.categoryId || 'unknown';
    categoryInteractionCounts[catId] = (categoryInteractionCounts[catId] || 0) + 1;
  }

  // Determine top 3 categories
  const topCategories = Object.entries(categoryInteractionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([catId]) => catId);

  // Determine preferred time slot from behavior
  const preferredTimeSlot = inferTimeSlot();

  // Calculate average spend level (from saved places' price levels — best-effort)
  const avgSpendLevel = 1; // default middle tier

  // Build preference text for embedding generation (delegates to embeddings.ts)
  const preferenceText = buildUserEmbeddingText({
    topCategories,
    favoriteCategories: sortedCategories.slice(0, 5),
    avgSpendLevel,
    preferredTimeSlot,
    totalInteractions,
  });

  return {
    userId,
    favoriteCategories,
    favoriteCategoryScores,
    visitedPlaceIds,
    savedPlaceIds,
    avgSpendLevel,
    isNewUser: totalInteractions < 5,
    totalInteractions,
    preferredTimeSlot,
    categoryInteractionCounts,
    topCategories,
    // Embedding fields
    preferenceText,
    userEmbedding: undefined, // set externally by embedding service
  };
}

// buildUserPreferenceText has been moved to embeddings.ts as buildUserEmbeddingText
// to serve as the single source of truth.

// ── Infer preferred time slot ──────────────────────────────────────────────
function inferTimeSlot(): UserProfile['preferredTimeSlot'] {
  // For now, infer from current time since we don't track historical time-of-day
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// ── Check if a place matches user preferences ─────────────────────────────
export function getCategoryMatchScore(
  categoryId: string,
  profile: UserProfile,
): number {
  return profile.favoriteCategoryScores[categoryId] ?? 0.1;
}

// ── Get similarity score between saved places and a candidate ─────────────
export function getSavedSimilarityScore(
  candidateCategoryId: string,
  profile: UserProfile,
  allSavedBusinessCategories: string[],
): number {
  if (profile.savedPlaceIds.length === 0 || allSavedBusinessCategories.length === 0) return 0;

  // How many saved places share this category?
  const matchingSaved = allSavedBusinessCategories.filter(c => c === candidateCategoryId).length;
  return Math.min(1, matchingSaved / allSavedBusinessCategories.length);
}
