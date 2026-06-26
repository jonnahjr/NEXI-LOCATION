import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Action weights for category affinity
const ACTION_WEIGHTS: Record<string, number> = {
  view:          0.1,
  save:          0.5,
  checkin:       1.0,
  review:        1.5,
  search_click:  0.3,
  photo_upload:  1.2,
  share:         0.8,
};

// Decay factor — older interactions matter less
const DECAY = 0.95;

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json().catch(() => ({}));
    // If userId is provided, update only that user. Otherwise batch-update all.
    const targetUserId: string | undefined = body.userId;

    // ── Fetch behaviors ────────────────────────────────────────────────
    let behaviorsQuery = supabase
      .from('user_behavior')
      .select('user_id, category_id, action, created_at')
      .not('category_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // last 90 days

    if (targetUserId) {
      behaviorsQuery = behaviorsQuery.eq('user_id', targetUserId);
    }

    const { data: behaviors, error } = await behaviorsQuery;
    if (error || !behaviors?.length) {
      return new Response(JSON.stringify({ updated: 0 }), { status: 200 });
    }

    // ── Aggregate per user × category ─────────────────────────────────
    const affinityMap: Record<string, Record<string, { score: number; count: number }>> = {};

    for (const row of behaviors) {
      const uid = row.user_id;
      const cat = row.category_id;
      if (!uid || !cat) continue;

      if (!affinityMap[uid]) affinityMap[uid] = {};
      if (!affinityMap[uid][cat]) affinityMap[uid][cat] = { score: 0, count: 0 };

      const weight = ACTION_WEIGHTS[row.action] ?? 0.1;
      const ageDays = (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const decayedWeight = weight * Math.pow(DECAY, ageDays);

      affinityMap[uid][cat].score += decayedWeight;
      affinityMap[uid][cat].count += 1;
    }

    // ── Normalize scores per user (0–1) and build upserts ─────────────
    const upserts = [];
    for (const [uid, cats] of Object.entries(affinityMap)) {
      const maxScore = Math.max(...Object.values(cats).map((c) => c.score));
      for (const [cat, data] of Object.entries(cats)) {
        upserts.push({
          user_id: uid,
          category_id: cat,
          score: maxScore > 0 ? Math.round((data.score / maxScore) * 100) / 100 : 0.1,
          interaction_count: data.count,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // ── Batch upsert in chunks of 100 ─────────────────────────────────
    const CHUNK = 100;
    for (let i = 0; i < upserts.length; i += CHUNK) {
      await supabase
        .from('user_category_affinity')
        .upsert(upserts.slice(i, i + CHUNK), { onConflict: 'user_id,category_id' });
    }

    return new Response(
      JSON.stringify({ success: true, updated: upserts.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
