// ── Notification Types ─────────────────────────────────────────────────────
// All supported notification categories for Nexi Locate

export enum NotificationCategory {
  NEW_REVIEW = 'new_review',
  NEW_LOCATION = 'new_location',
  LOGIN_ALERT = 'login_alert',
  AD_PROMOTION = 'ad_promotion',
  REWARD_EARNED = 'reward_earned',
  BUSINESS_RESPONSE = 'business_response',
  VERIFICATION_APPROVED = 'verification_approved',
  PHOTO_LIKED = 'photo_liked',
  REFERRAL_BONUS = 'referral_bonus',
  TRENDING_ALERT = 'trending_alert',
  LEADERBOARD_UPDATE = 'leaderboard_update',
  CHALLENGE_COMPLETE = 'challenge_complete',
}

// ── Notification Interface ─────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  description: string;
  icon: string;
  color: string;
  link?: string;          // Deep link (e.g., /business/food-1)
  imageUrl?: string;      // Optional thumbnail image
  metadata?: Record<string, any>; // Extra data (business ID, review ID, etc.)
  read: boolean;
  createdAt: string;
}

// ── Create Notification DTO ────────────────────────────────────────────────

export interface CreateNotificationDto {
  userId: string;
  category: NotificationCategory;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  link?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

// ── Category metadata mapping ──────────────────────────────────────────────

export const CATEGORY_META: Record<NotificationCategory, { icon: string; color: string }> = {
  [NotificationCategory.NEW_REVIEW]:         { icon: '⭐', color: '#F59E0B' },
  [NotificationCategory.NEW_LOCATION]:       { icon: '📍', color: '#3B82F6' },
  [NotificationCategory.LOGIN_ALERT]:        { icon: '🔐', color: '#8B5CF6' },
  [NotificationCategory.AD_PROMOTION]:       { icon: '🎯', color: '#EF4444' },
  [NotificationCategory.REWARD_EARNED]:      { icon: '🎁', color: '#10B981' },
  [NotificationCategory.BUSINESS_RESPONSE]:  { icon: '💬', color: '#3B82F6' },
  [NotificationCategory.VERIFICATION_APPROVED]: { icon: '✅', color: '#8B5CF6' },
  [NotificationCategory.PHOTO_LIKED]:        { icon: '📸', color: '#F59E0B' },
  [NotificationCategory.REFERRAL_BONUS]:     { icon: '👥', color: '#10B981' },
  [NotificationCategory.TRENDING_ALERT]:     { icon: '🔥', color: '#EF4444' },
  [NotificationCategory.LEADERBOARD_UPDATE]: { icon: '🏆', color: '#F59E0B' },
  [NotificationCategory.CHALLENGE_COMPLETE]: { icon: '🎯', color: '#10B981' },
};
