// ─── Moderation utilities ─────────────────────────────────────────────────────
// Re-exported from packages/shared/src/moderation for mobile use.
// Keeps existing relative imports in screens working without Metro workspace config.

export type {
  ModerationVerdict,
  ModerationResult,
} from '../../../../packages/shared/src/moderation';

export {
  moderateContent,
  isLikelySpam,
  validateUsername,
  validateEmail,
  validateEthiopianPhone,
  computeUserReputation,
} from '../../../../packages/shared/src/moderation';
