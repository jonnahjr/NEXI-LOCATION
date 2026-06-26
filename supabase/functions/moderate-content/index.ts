import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Simple rule-based content moderator ───────────────────────────────────
// In production, replace/augment with a Perspective API or LLM call.

const SPAM_PATTERNS = [
  /\b(whatsapp|telegram|call me)\b/i,
  /\b\d{9,}\b/, // long number strings
  /https?:\/\/\S+/i,
  /\b(buy now|click here|free offer|promo code)\b/i,
];

const HATE_PATTERNS = [
  /\b(hate|racist|stupid|idiot|moron)\b/i,
];

const PROFANITY_PATTERNS = [
  // Add locale-appropriate words here
  /\bf[u*@]ck\b/i,
  /\bsh[i1!]t\b/i,
  /\ba[s$]{2}\b/i,
];

type ContentType = 'review' | 'business_name' | 'description' | 'photo_caption';
type ModerationResult = 'approved' | 'flagged' | 'rejected';

function moderateText(text: string): {
  result: ModerationResult;
  flags: string[];
  score: number;
} {
  const flags: string[] = [];
  let score = 0;

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push('spam');
      score += 40;
      break;
    }
  }

  for (const pattern of HATE_PATTERNS) {
    if (pattern.test(text)) {
      flags.push('hate_speech');
      score += 60;
      break;
    }
  }

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      flags.push('profanity');
      score += 30;
      break;
    }
  }

  // Length checks
  if (text.trim().length < 5) {
    flags.push('too_short');
    score += 20;
  }

  if (text.trim().length > 5000) {
    flags.push('too_long');
    score += 10;
  }

  // Repetition check (same word/char repeated >5 times)
  if (/(.)\1{5,}/.test(text)) {
    flags.push('repetitive');
    score += 20;
  }

  let result: ModerationResult = 'approved';
  if (score >= 60) result = 'rejected';
  else if (score >= 30) result = 'flagged';

  return { result, flags, score };
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { contentType, contentId, text, userId } = await req.json();

    if (!contentType || !contentId || !text) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const { result, flags, score } = moderateText(text);

    // ── Update content status based on moderation result ──────────────
    const table = contentType === 'review' ? 'reviews'
      : contentType === 'business_name' || contentType === 'description' ? 'businesses'
      : null;

    if (table) {
      const newStatus = result === 'rejected' ? 'rejected'
        : result === 'flagged' ? 'pending'
        : 'active';

      await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', contentId);
    }

    // ── Log moderation action ──────────────────────────────────────────
    await supabase.from('moderation_logs').insert({
      content_type: contentType,
      content_id: contentId,
      user_id: userId ?? null,
      result,
      flags,
      score,
      created_at: new Date().toISOString(),
    }).catch(() => {}); // Table may not exist yet — non-critical

    // ── Notify user on rejection ───────────────────────────────────────
    if (result === 'rejected' && userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        category: 'system',
        title: 'Content Removed',
        description: `Your ${contentType} was removed for violating community guidelines: ${flags.join(', ')}.`,
        icon: '⚠️',
        color: '#EF4444',
      });
    }

    return new Response(
      JSON.stringify({ success: true, result, flags, score }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
