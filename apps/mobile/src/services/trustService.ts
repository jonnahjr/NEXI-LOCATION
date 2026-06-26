// ═══════════════════════════════════════════════════════════════════════════
// Trust Service — User & Content Trust Scoring
// Signals: account age, review count, verified status, report history
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase';
import { getCurrentUserId } from './authService';

export interface TrustScore {
  score: number;           // 0–100
  level: 'new' | 'regular' | 'trusted' | 'verified';
  label: string;
  color: string;
  canReview: boolean;
  canUploadPhotos: boolean;
  canSuggestEdits: boolean;
}

// ── Score thresholds ──────────────────────────────────────────────────────
const THRESHOLDS = {
  trusted: 60,
  regular: 30,
  new: 0,
};

// ── Compute a user's trust score ──────────────────────────────────────────
export async function computeUserTrustScore(userId?: string): Promise<TrustScore> {
  try {
    const uid = userId ?? await getCurrentUserId();
    if (!uid) return defaultScore();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (!profile) return defaultScore();

    let score = 0;

    // Account age: up to 20 pts
    const ageDays = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(ageDays / 30, 1) * 20; // 1 pt per 1.5 days, max 20

    // Email verified: +10
    if (profile.email_verified) score += 10;

    // Phone verified: +15
    if (profile.phone_verified) score += 15;

    // Reviews written: up to 20 pts (2 pts each, max 10 reviews)
    const reviewCount = profile.review_count || 0;
    score += Math.min(reviewCount * 2, 20);

    // Photos uploaded: up to 10 pts
    const photoCount = profile.photo_count || 0;
    score += Math.min(photoCount, 10);

    // Points accumulated: up to 15 pts
    const points = profile.points || 0;
    score += Math.min(points / 100, 15);

    // Reports received (negative signal): -5 per report
    const { count: reportCount } = await supabase
      .from('moderation_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('result', 'rejected');

    score -= Math.min((reportCount || 0) * 5, 30);
    score = Math.max(0, Math.min(100, Math.round(score)));

    return scoreToTrustLevel(score);
  } catch {
    return defaultScore();
  }
}

// ── Report a review or business ───────────────────────────────────────────
export async function reportContent(
  contentType: 'review' | 'business' | 'photo',
  contentId: string,
  reason: string,
): Promise<{ success: boolean }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false };

    const { error } = await supabase.from('reports').insert({
      reporter_id: userId,
      content_type: contentType,
      content_id: contentId,
      reason,
      status: 'pending',
    });

    // Trigger moderation if it's a review
    if (!error && contentType === 'review') {
      const { data: review } = await supabase
        .from('reviews')
        .select('text, user_id')
        .eq('id', contentId)
        .single();

      if (review) {
        supabase.functions.invoke('moderate-content', {
          body: {
            contentType: 'review',
            contentId,
            text: review.text,
            userId: review.user_id,
          },
        }).catch(() => {});
      }
    }

    return { success: !error };
  } catch {
    return { success: false };
  }
}

// ── Fetch open reports (for admin) ────────────────────────────────────────
export async function fetchPendingReports(limit = 50): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id, content_type, content_id, reason, status, created_at,
        profiles:reporter_id (name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// ── Resolve a report (admin action) ──────────────────────────────────────
export async function resolveReport(
  reportId: string,
  resolution: 'dismissed' | 'actioned',
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reports')
      .update({ status: resolution })
      .eq('id', reportId);
    return !error;
  } catch {
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function defaultScore(): TrustScore {
  return scoreToTrustLevel(10);
}

function scoreToTrustLevel(score: number): TrustScore {
  if (score >= THRESHOLDS.trusted) {
    return {
      score,
      level: 'trusted',
      label: 'Trusted Contributor',
      color: '#10B981',
      canReview: true,
      canUploadPhotos: true,
      canSuggestEdits: true,
    };
  }
  if (score >= THRESHOLDS.regular) {
    return {
      score,
      level: 'regular',
      label: 'Regular User',
      color: '#3B82F6',
      canReview: true,
      canUploadPhotos: true,
      canSuggestEdits: false,
    };
  }
  return {
    score,
    level: 'new',
    label: 'New User',
    color: '#9CA3AF',
    canReview: true,
    canUploadPhotos: false,
    canSuggestEdits: false,
  };
}
