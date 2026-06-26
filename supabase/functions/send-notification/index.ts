import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationPayload {
  userId: string;
  category: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  // Optional: send to multiple users
  userIds?: string[];
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const payload: NotificationPayload = await req.json();

    const { userId, userIds, category, title, description, icon, color, link, metadata } = payload;

    // Resolve target user list
    const targetIds: string[] = userIds?.length
      ? userIds
      : userId
      ? [userId]
      : [];

    if (targetIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No target users provided' }), { status: 400 });
    }

    if (!title || !description) {
      return new Response(JSON.stringify({ error: 'title and description are required' }), { status: 400 });
    }

    // ── Build notification rows ────────────────────────────────────────
    const rows = targetIds.map((uid) => ({
      user_id: uid,
      category: category || 'system',
      title,
      description,
      icon: icon ?? '🔔',
      color: color ?? '#3B82F6',
      link: link ?? null,
      metadata: metadata ?? null,
      read: false,
    }));

    // ── Insert in batches of 50 ────────────────────────────────────────
    let inserted = 0;
    const CHUNK = 50;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(rows.slice(i, i + CHUNK))
        .select('id');

      if (!error) inserted += data?.length ?? 0;
    }

    return new Response(
      JSON.stringify({ success: true, inserted }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
