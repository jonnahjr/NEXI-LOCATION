// ═══════════════════════════════════════════════════════════════════════════
// Recommendation Service — AI-Powered Discovery Engine (Vector Edition)
// Client-side execution using @nexi/ai-ranking with cosine similarity.
// Returns ranked results with "Why this place?" explanations.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase, rowToBusiness } from './supabase';
import { getCurrentUserId } from './authService';
import type { Business } from '../store/appStore';
import { fetchUserCategoryAffinity, fetchSavedPlaceIds } from './dataService';
import { fetchUserBehaviors } from './behaviorService';
import {
  buildUserProfile,
  getSmartContext,
  rankPlaces,
  aggregateUserEmbedding,
  normalizeVector,
  type RankedResult,
  type UserProfile,
  type EmbeddingVector,
} from '@nexi/ai-ranking';

// ── Local embedding comparison when backend embeddings are available ──────
// We fetch stored embeddings from Supabase alongside businesses,
// then compute cosine similarity client-side in the ranking engine.

/**
 * Fetch all businesses with their stored embeddings.
 */
async function fetchBusinessesWithEmbeddings(
  limit = 200,
  cityId?: string,
): Promise<{ business: Business; embedding: EmbeddingVector }[]> {
  try {
    let query = supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .not('embedding', 'is', null); // Only businesses with embeddings

    if (cityId) {
      query = query.eq('city_id', cityId);
    }

    const { data, error } = await query.limit(limit);

    if (error || !data) return [];

    return data
      .filter((row: any) => row.embedding != null)
      .map((row: any) => {
        let embedding: EmbeddingVector = [];
        try {
          embedding = typeof row.embedding === 'string'
            ? JSON.parse(row.embedding)
            : row.embedding;
        } catch {
          embedding = [];
        }
        return {
          business: rowToBusiness(row),
          embedding,
        };
      })
      .filter((item) => item.embedding.length > 0);
  } catch {
    return [];
  }
}

/**
 * Build a user preference embedding by aggregating embeddings
 * of saved and visited businesses.
 */
async function buildUserEmbeddingFromSaved(
  userId: string,
  savedPlaceIds: string[],
  visitedPlaceIds: string[],
): Promise<EmbeddingVector | null> {
  try {
    // Collect all business IDs the user has interacted with
    const bizIds = [...new Set([...savedPlaceIds, ...visitedPlaceIds])];
    if (bizIds.length === 0) return null;

    // Fetch their embeddings from Supabase
    const { data, error } = await supabase
      .from('businesses')
      .select('id, embedding')
      .in('id', bizIds);

    if (error || !data) return null;

    const weightedEmbeddings: Array<{ vector: EmbeddingVector; weight: number }> = [];

    for (const row of data) {
      if (!row.embedding) continue;

      let vector: EmbeddingVector = [];
      try {
        vector = typeof row.embedding === 'string'
          ? JSON.parse(row.embedding)
          : row.embedding;
      } catch {
        continue;
      }

      if (vector.length === 0) continue;

      // Saved places get higher weight than visited places
      const weight = savedPlaceIds.includes(row.id) ? 2.0 : 1.0;
      weightedEmbeddings.push({ vector, weight });
    }

    if (weightedEmbeddings.length === 0) return null;

    // Use shared aggregateUserEmbedding from @nexi/ai-ranking
    const result = aggregateUserEmbedding(weightedEmbeddings);
    if (result.length === 0) return null;
    return normalizeVector(result);
  } catch {
    return null;
  }
}

// ── Fetch all user data needed for AI ranking ────────────────────────────
async function fetchUserData(userId: string) {
  const [affinities, checkIns, savedIds, behaviors] = await Promise.all([
    fetchUserCategoryAffinity(userId),
    supabase.from('check_ins').select('business_id').eq('user_id', userId),
    fetchSavedPlaceIds(userId),
    fetchUserBehaviors(userId),
  ]);

  const visitedIds = checkIns?.data?.map(c => c.business_id) || [];

  return { affinities, visitedIds, savedIds, behaviors };
}

// ── Build user profile vector ─────────────────────────────────────────────
export async function buildRankingProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { affinities, visitedIds, savedIds, behaviors } = await fetchUserData(userId);

    return buildUserProfile({
      userId,
      categoryAffinities: affinities,
      visitedPlaceIds: visitedIds,
      savedPlaceIds: savedIds,
      behaviors: behaviors as any,
      totalInteractions: behaviors?.length ?? 0,
    });
  } catch (error) {
    console.warn('[buildRankingProfile] Error:', error);
    return null;
  }
}

// ── Get AI-ranked recommendations with embeddings and explanations ────────
export async function getRecommendedForUser(
  userId: string,
  userLat?: number,
  userLng?: number,
  cityId?: string,
): Promise<Business[]> {
  try {
    const { affinities, visitedIds, savedIds, behaviors } = await fetchUserData(userId);

    // Build user profile vector
    const profile = buildUserProfile({
      userId,
      categoryAffinities: affinities,
      visitedPlaceIds: visitedIds,
      savedPlaceIds: savedIds,
      behaviors: behaviors as any,
      totalInteractions: behaviors?.length ?? 0,
    });

    // ── Vector Embedding: Build user embedding from saved/visited places ──
    let userEmbedding: EmbeddingVector | null = null;
    let businessEmbeddings: Record<string, EmbeddingVector> | null = null;

    // Only attempt if user has saved or visited places
    if (profile.savedPlaceIds.length > 0 || profile.visitedPlaceIds.length > 0) {
      userEmbedding = await buildUserEmbeddingFromSaved(
        userId,
        profile.savedPlaceIds,
        profile.visitedPlaceIds,
      );
    }

    // Fetch candidate businesses (active, matching city)
    let query = supabase.from('businesses').select('*').eq('status', 'active');
    if (cityId) {
      query = query.eq('city_id', cityId);
    }
    const { data: candidates, error } = await query.limit(200);

    if (error || !candidates) return [];

    const businesses = candidates.map(rowToBusiness);

    // If we have a user embedding, also fetch business embeddings for similarity
    if (userEmbedding) {
      const embeddingRows = await fetchBusinessesWithEmbeddings(200, cityId);
      businessEmbeddings = {};
      for (const item of embeddingRows) {
        businessEmbeddings[item.business.id] = item.embedding;
      }
    }

    // Fetch categories of all saved businesses
    const savedBizIds = profile.savedPlaceIds;
    let allSavedBusinessCategories: string[] = [];
    if (savedBizIds.length > 0) {
      const { data: savedBiz } = await supabase
        .from('businesses')
        .select('category_id')
        .in('id', savedBizIds);
      allSavedBusinessCategories = (savedBiz || []).map((r: any) => r.category_id);
    }

    // ── Use AI ranking engine with embeddings + cosine similarity ─────
    const rankedResults = rankPlaces({
      businesses,
      userLocation: userLat != null && userLng != null
        ? { latitude: userLat, longitude: userLng }
        : undefined,
      userProfile: profile,
      behaviors: behaviors as any,
      categoryAffinities: affinities,
      limit: 15,
      allSavedBusinessCategories,
      // ── Embedding fields ──────────────────────────────────────────
      businessEmbeddings: businessEmbeddings ?? undefined,
      userEmbedding: userEmbedding ?? undefined,
    });

    // Return businesses with explanation metadata attached
    return rankedResults.map(r => ({
      ...r.business,
      recommendationScore: r.score,
      rank: r.rank,
      _aiExplanation: r.explanation,
    }));
  } catch (error) {
    console.warn('[recommendationService] Error generating recommendations:', error);
    return [];
  }
}

// ── Get AI-ranked results with full explanations (for home screen) ────────
export async function getRankedWithExplanations(
  userId: string,
  userLat?: number,
  userLng?: number,
  cityId?: string,
): Promise<{ businesses: Business[]; explanations: Record<string, any> }> {
  try {
    const { affinities, visitedIds, savedIds, behaviors } = await fetchUserData(userId);

    const profile = buildUserProfile({
      userId,
      categoryAffinities: affinities,
      visitedPlaceIds: visitedIds,
      savedPlaceIds: savedIds,
      behaviors: behaviors as any,
    });

    const context = getSmartContext(profile);

    // ── Vector Embedding: Build user embedding ──────────────────────────
    let userEmbedding: EmbeddingVector | null = null;
    let businessEmbeddings: Record<string, EmbeddingVector> | null = null;

    if (profile.savedPlaceIds.length > 0 || profile.visitedPlaceIds.length > 0) {
      userEmbedding = await buildUserEmbeddingFromSaved(
        userId,
        profile.savedPlaceIds,
        profile.visitedPlaceIds,
      );
    }

    // Fetch candidates
    let query = supabase.from('businesses').select('*').eq('status', 'active');
    if (cityId) query = query.eq('city_id', cityId);
    const { data: candidates, error } = await query.limit(200);
    if (error || !candidates) return { businesses: [], explanations: {} };

    const businesses = candidates.map(rowToBusiness);

    // Fetch business embeddings if user embedding exists
    if (userEmbedding) {
      const embeddingRows = await fetchBusinessesWithEmbeddings(200, cityId);
      businessEmbeddings = {};
      for (const item of embeddingRows) {
        businessEmbeddings[item.business.id] = item.embedding;
      }
    }

    // Fetch categories of saved businesses
    const savedBizIds = profile.savedPlaceIds;
    let allSavedBusinessCategories: string[] = [];
    if (savedBizIds.length > 0) {
      const { data: savedBiz } = await supabase
        .from('businesses')
        .select('category_id')
        .in('id', savedBizIds);
      allSavedBusinessCategories = (savedBiz || []).map((r: any) => r.category_id);
    }

    const ranked = rankPlaces({
      businesses,
      userLocation: userLat != null && userLng != null
        ? { latitude: userLat, longitude: userLng }
        : undefined,
      userProfile: profile,
      behaviors: behaviors as any,
      categoryAffinities: affinities,
      limit: 20,
      allSavedBusinessCategories,
      // ── Embedding fields ──────────────────────────────────────────
      businessEmbeddings: businessEmbeddings ?? undefined,
      userEmbedding: userEmbedding ?? undefined,
    });

    const explanations: Record<string, any> = {};
    ranked.forEach(r => {
      explanations[r.business.id] = {
        score: r.score,
        rank: r.rank,
        reasons: r.explanation.reasons,
        hasEmbeddingSimilarity: !!(
          userEmbedding &&
          businessEmbeddings?.[r.business.id]
        ),
        breakdown: r.explanation.breakdown,
        timeInfo: context.timeOfDay !== 'mixed' ? context.timeOfDay : undefined,
        isWeekend: context.isWeekend,
        isNewUser: context.isNewUser,
      };
    });

    return {
      businesses: ranked.map(r => ({ ...r.business, recommendationScore: r.score, rank: r.rank })),
      explanations,
    };
  } catch (error) {
    console.warn('[getRankedWithExplanations] Error:', error);
    return { businesses: [], explanations: {} };
  }
}
