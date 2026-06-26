// ═══════════════════════════════════════════════════════════════════════════
// Content Moderation — Rule-Based Filter
// Used by: Edge Function moderate-content, mobile trustService
// ═══════════════════════════════════════════════════════════════════════════

export type ModerationVerdict = 'clean' | 'flagged' | 'blocked';

export interface ModerationResult {
  verdict: ModerationVerdict;
  reasons: string[];
  score: number; // 0 = clean, 1 = definitely spam
}

// ── Spam Pattern Definitions ─────────────────────────────────────────────
const SPAM_PATTERNS = [
  { pattern: /(.)\1{4,}/g, weight: 0.4, reason: 'Repetitive characters' },
  { pattern: /https?:\/\/\S+/gi, weight: 0.5, reason: 'External URLs in review' },
  { pattern: /whatsapp|telegram|instagram|facebook\.com/gi, weight: 0.4, reason: 'Social media links' },
  { pattern: /call me|contact me|dm me|message me/gi, weight: 0.35, reason: 'Solicitation' },
  { pattern: /[A-Z]{5,}/g, weight: 0.2, reason: 'Excessive caps' },
  { pattern: /\b(fake|scam|fraud|cheat|stolen)\b/gi, weight: 0.25, reason: 'Potential defamation' },
  { pattern: /(\b\w+\b)(\s+\1){2,}/gi, weight: 0.4, reason: 'Repetitive words' },
];

const OFFENSIVE_WORDS = [
  // Keep this minimal — actual offensive words would be in a proper list
  'spam', 'bot', 'fake review',
];

// ── Short text detection ──────────────────────────────────────────────────
const MIN_REVIEW_LENGTH = 10;
const MAX_REVIEW_LENGTH = 2000;

// ── Main filter function ──────────────────────────────────────────────────
export function moderateContent(text: string): ModerationResult {
  const reasons: string[] = [];
  let score = 0;

  if (!text || typeof text !== 'string') {
    return { verdict: 'blocked', reasons: ['Empty content'], score: 1 };
  }

  const trimmed = text.trim();

  // Length checks
  if (trimmed.length < MIN_REVIEW_LENGTH) {
    reasons.push(`Too short (min ${MIN_REVIEW_LENGTH} chars)`);
    score += 0.3;
  }

  if (trimmed.length > MAX_REVIEW_LENGTH) {
    reasons.push('Exceeds maximum length');
    score += 0.2;
  }

  // Pattern checks
  for (const { pattern, weight, reason } of SPAM_PATTERNS) {
    pattern.lastIndex = 0; // reset regex state
    if (pattern.test(trimmed)) {
      reasons.push(reason);
      score += weight;
    }
  }

  // Offensive word check
  const lowerText = trimmed.toLowerCase();
  for (const word of OFFENSIVE_WORDS) {
    if (lowerText.includes(word)) {
      reasons.push(`Potential offensive content`);
      score += 0.4;
      break;
    }
  }

  // All-caps check (more nuanced than pattern)
  const uppercaseRatio = (trimmed.match(/[A-Z]/g)?.length ?? 0) / trimmed.length;
  if (uppercaseRatio > 0.5 && trimmed.length > 20) {
    reasons.push('Excessive uppercase ratio');
    score += 0.2;
  }

  // Determine verdict
  score = Math.min(1, score);
  let verdict: ModerationVerdict;
  if (score >= 0.8) {
    verdict = 'blocked';
  } else if (score >= 0.4) {
    verdict = 'flagged';
  } else {
    verdict = 'clean';
  }

  return { verdict, reasons, score };
}

// ── Quick pre-check for client (before submitting) ─────────────────────────
export function isLikelySpam(text: string): boolean {
  const result = moderateContent(text);
  return result.verdict !== 'clean';
}

// ── Username validation ────────────────────────────────────────────────────
export function validateUsername(name: string): { valid: boolean; reason?: string } {
  if (!name || name.trim().length < 2) {
    return { valid: false, reason: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 50) {
    return { valid: false, reason: 'Name must be less than 50 characters' };
  }
  if (/[<>{}|\\]/.test(name)) {
    return { valid: false, reason: 'Name contains invalid characters' };
  }
  return { valid: true };
}

// ── Email validation ────────────────────────────────────────────────────────
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// ── Phone validation (Ethiopian numbers) ──────────────────────────────────
export function validateEthiopianPhone(phone: string): boolean {
  // Ethiopian mobile: +251 9x xxx xxxx or 09x xxx xxxx
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+251|0)(7|9)\d{8}$/.test(cleaned);
}

// ── User reputation score ─────────────────────────────────────────────────
export function computeUserReputation(params: {
  reviewCount: number;
  photoCount: number;
  helpfulVotes: number;
  flaggedReviews: number;
  daysActive: number;
}): number {
  const { reviewCount, photoCount, helpfulVotes, flaggedReviews, daysActive } = params;
  const base =
    reviewCount * 2 +
    photoCount * 1 +
    helpfulVotes * 0.5 -
    flaggedReviews * 5;
  // Longevity bonus (capped at 30 days)
  const longevityBonus = Math.min(30, daysActive) * 0.1;
  return Math.max(0, base + longevityBonus);
}
