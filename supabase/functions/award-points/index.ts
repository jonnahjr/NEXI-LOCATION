import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const POINT_VALUES: Record<string, number> = {
  review:        50,
  checkin:       10,
  photo_upload:  25,
  save:           5,
  share:         15,
  first_review:  100,
  first_checkin:  50,
};

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { userId, action, referenceId } = await req.json();

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: 'Missing userId or action' }), { status: 400 });
    }

    const points = POINT_VALUES[action] ?? 5;

    // ── 1. Check for bonus (first-ever action of type) ──────────────────
    const { count: existingCount } = await supabase
      .from('user_behavior')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', action);

    let bonus = 0;
    if (existingCount === 0) {
      if (action === 'review') bonus = POINT_VALUES['first_review'] ?? 0;
      if (action === 'checkin') bonus = POINT_VALUES['first_checkin'] ?? 0;
    }

    const totalPoints = points + bonus;

    // ── 2. Upsert user points ───────────────────────────────────────────
    const { error: pointsError } = await supabase.rpc('increment_user_points', {
      p_user_id: userId,
      p_points: totalPoints,
    });

    if (pointsError) {
      // Fallback: direct update
      await supabase
        .from('profiles')
        .update({ points: supabase.rpc('coalesce', []) })
        .eq('id', userId);
    }

    // ── 3. Trigger notification ─────────────────────────────────────────
    const actionLabels: Record<string, string> = {
      review: 'writing a review',
      checkin: 'checking in',
      photo_upload: 'uploading a photo',
      share: 'sharing a place',
      save: 'saving a place',
    };

    await supabase.from('notifications').insert({
      user_id: userId,
      category: 'reward',
      title: `+${totalPoints} Nexi Points! 🎉`,
      description: `You earned ${totalPoints} points for ${actionLabels[action] ?? action}.${bonus > 0 ? ` (Includes ${bonus} first-time bonus!)` : ''}`,
      icon: '🏆',
      color: '#F59E0B',
      metadata: { action, referenceId, points: totalPoints },
    });

    return new Response(
      JSON.stringify({ success: true, pointsAwarded: totalPoints, bonus }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
