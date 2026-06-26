// ═══════════════════════════════════════════════════════════════════════════
// Behavior Service
// Fetches user behavior data (views, saves, check-ins, reviews, etc.)
// Used by the AI Ranking Engine to build user preference vectors.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase';
import { getCurrentUserId } from './authService';
import type { BehaviorAction } from '@nexi/types';

export interface UserBehaviorRecord {
  id: string;
  user_id: string;
  business_id: string;
  action: BehaviorAction;
  category_id?: string;
  created_at: string;
}

// ── Fetch all behaviors for a user ─────────────────────────────────────────
export async function fetchUserBehaviors(
  userId?: string,
): Promise<Array<{ action: BehaviorAction; categoryId?: string }>> {
  try {
    const uid = userId ?? await getCurrentUserId();
    if (!uid) return [];

    const { data, error } = await supabase
      .from('user_behavior')
      .select('action, category_id')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !data) return [];

    return data.map((row: any) => ({
      action: row.action as BehaviorAction,
      categoryId: row.category_id ?? undefined,
    }));
  } catch {
    return [];
  }
}

// ── Fetch category interaction counts ─────────────────────────────────────
export async function fetchCategoryInteractionCounts(
  userId?: string,
): Promise<Record<string, number>> {
  try {
    const uid = userId ?? await getCurrentUserId();
    if (!uid) return {};

    const behaviors = await fetchUserBehaviors(uid);
    const counts: Record<string, number> = {};

    for (const b of behaviors) {
      const catId = b.categoryId || 'unknown';
      counts[catId] = (counts[catId] || 0) + 1;
    }

    return counts;
  } catch {
    return {};
  }
}

// ── Track a new behavior event ─────────────────────────────────────────────
export async function trackBehavior(
  businessId: string,
  action: BehaviorAction,
  categoryId?: string,
): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await supabase.from('user_behavior').insert({
      user_id: userId,
      business_id: businessId,
      action,
      category_id: categoryId ?? null,
    });
  } catch {
    // Non-critical — silently fail
  }
}
