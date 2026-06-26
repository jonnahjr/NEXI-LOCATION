import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Wilson score lower bound — gives a balanced ranking considering both
// quantity and quality. Used by Reddit/Yelp for ranking.
function wilsonScore(positives: number, total: number): number {
  if (total === 0) return 0;
  const z = 1.96; // 95% confidence
  const phat = positives / total;
  return (
    (phat + (z * z) / (2 * total) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total)) /
    (1 + (z * z) / total)
  );
}

// Exponential time decay — activity within last 7 days gets full weight
function timeDecay(dateStr: string, halfLifeDays = 7): number {
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.exp((-ageDays * Math.LN2) / halfLifeDays);
}

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Fetch all active businesses ────────────────────────────────────
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, rating, reviews')
      .eq('status', 'active');

    if (!businesses?.length) {
      return new Response(JSON.stringify({ updated: 0 }), { status: 200 });
    }

    // ── Fetch recent activity counts per business ───────────────────────
    const { data: recentCheckins7d } = await supabase
      .from('check_ins')
      .select('business_id')
      .gte('created_at', since7d);

    const { data: recentCheckins30d } = await supabase
      .from('check_ins')
      .select('business_id')
      .gte('created_at', since30d);

    const { data: recentReviews7d } = await supabase
      .from('reviews')
      .select('business_id, rating, created_at')
      .gte('created_at', since7d)
      .eq('status', 'active');

    // Count maps
    const checkins7dMap: Record<string, number> = {};
    recentCheckins7d?.forEach((c) => {
      checkins7dMap[c.business_id] = (checkins7dMap[c.business_id] || 0) + 1;
    });

    const checkins30dMap: Record<string, number> = {};
    recentCheckins30d?.forEach((c) => {
      checkins30dMap[c.business_id] = (checkins30dMap[c.business_id] || 0) + 1;
    });

    const reviews7dMap: Record<string, { count: number; ratingSum: number }> = {};
    recentReviews7d?.forEach((r) => {
      if (!reviews7dMap[r.business_id]) reviews7dMap[r.business_id] = { count: 0, ratingSum: 0 };
      reviews7dMap[r.business_id].count += 1;
      reviews7dMap[r.business_id].ratingSum += r.rating;
    });

    // ── Compute trending scores ────────────────────────────────────────
    const weeklyUpserts = [];
    const monthlyUpserts = [];

    for (const biz of businesses) {
      const c7 = checkins7dMap[biz.id] || 0;
      const c30 = checkins30dMap[biz.id] || 0;
      const r7 = reviews7dMap[biz.id] || { count: 0, ratingSum: 0 };

      // Quality signal: Wilson score on total reviews (positive = rating ≥ 4)
      const positiveReviews = biz.rating >= 4 ? biz.reviews : Math.round(biz.reviews * (biz.rating / 5));
      const quality = wilsonScore(positiveReviews, biz.reviews || 1);

      // Weekly score: check-ins + reviews in last 7d, weighted by quality
      const weeklyRaw = c7 * 3 + r7.count * 5 + quality * 20;
      
      // Monthly score
      const monthlyRaw = c30 * 2 + biz.reviews * 0.5 + quality * 30;

      weeklyUpserts.push({
        business_id: biz.id,
        period: 'weekly',
        score: Math.round(weeklyRaw * 100) / 100,
        updated_at: new Date().toISOString(),
      });

      monthlyUpserts.push({
        business_id: biz.id,
        period: 'monthly',
        score: Math.round(monthlyRaw * 100) / 100,
        updated_at: new Date().toISOString(),
      });
    }

    // ── Upsert weekly scores ───────────────────────────────────────────
    if (weeklyUpserts.length > 0) {
      await supabase
        .from('trending_scores')
        .upsert(weeklyUpserts, { onConflict: 'business_id,period' });
    }

    // ── Upsert monthly scores ──────────────────────────────────────────
    if (monthlyUpserts.length > 0) {
      await supabase
        .from('trending_scores')
        .upsert(monthlyUpserts, { onConflict: 'business_id,period' });
    }

    // ── Assign ranks ───────────────────────────────────────────────────
    // Weekly rank
    const { data: weeklyRanked } = await supabase
      .from('trending_scores')
      .select('business_id')
      .eq('period', 'weekly')
      .order('score', { ascending: false });

    if (weeklyRanked) {
      const rankUpdates = weeklyRanked.map((row, idx) => ({
        business_id: row.business_id,
        period: 'weekly' as const,
        rank: idx + 1,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('trending_scores').upsert(rankUpdates, { onConflict: 'business_id,period' });
    }

    return new Response(
      JSON.stringify({ success: true, updated: businesses.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
