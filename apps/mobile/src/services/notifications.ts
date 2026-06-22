// ── Notification Service ────────────────────────────────────────────────────
// Uses REST API + polling for real-time updates (no WebSocket dependency)
// Works reliably across all network configurations

import { api } from './api';

// ── Notification Types (mirrors backend) ───────────────────────────────────

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

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  description: string;
  icon: string;
  color: string;
  link?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// ── Category Meta ──────────────────────────────────────────────────────────

export const CATEGORY_META: Record<NotificationCategory, { icon: string; color: string; label: string }> = {
  [NotificationCategory.NEW_REVIEW]:         { icon: '⭐', color: '#F59E0B', label: 'New Review' },
  [NotificationCategory.NEW_LOCATION]:       { icon: '📍', color: '#3B82F6', label: 'New Place' },
  [NotificationCategory.LOGIN_ALERT]:        { icon: '🔐', color: '#8B5CF6', label: 'Login Alert' },
  [NotificationCategory.AD_PROMOTION]:       { icon: '🎯', color: '#EF4444', label: 'Promotion' },
  [NotificationCategory.REWARD_EARNED]:      { icon: '🎁', color: '#10B981', label: 'Reward' },
  [NotificationCategory.BUSINESS_RESPONSE]:  { icon: '💬', color: '#3B82F6', label: 'Response' },
  [NotificationCategory.VERIFICATION_APPROVED]: { icon: '✅', color: '#8B5CF6', label: 'Verified' },
  [NotificationCategory.PHOTO_LIKED]:        { icon: '📸', color: '#F59E0B', label: 'Photo Liked' },
  [NotificationCategory.REFERRAL_BONUS]:     { icon: '👥', color: '#10B981', label: 'Referral' },
  [NotificationCategory.TRENDING_ALERT]:     { icon: '🔥', color: '#EF4444', label: 'Trending' },
  [NotificationCategory.LEADERBOARD_UPDATE]: { icon: '🏆', color: '#F59E0B', label: 'Leaderboard' },
  [NotificationCategory.CHALLENGE_COMPLETE]: { icon: '🎯', color: '#10B981', label: 'Challenge' },
};

// ── Event Handlers ─────────────────────────────────────────────────────────

export type UnreadCountHandler = (count: number) => void;
export type NotificationsListHandler = (notifications: Notification[]) => void;

// ── Notification Service ───────────────────────────────────────────────────

export class NotificationService {
  private userId: string | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;
  private lastFetchHash = '';
  private consecutiveErrors = 0;

  // Event callbacks
  private onUnreadCount: UnreadCountHandler | null = null;
  private onNotificationsList: NotificationsListHandler | null = null;
  private onConnectionChange: ((connected: boolean) => void) | null = null;

  // ── Start polling (REST API-based "real-time" updates) ───────────────
  connect(userId: string): void {
    if (this.userId === userId && this.pollInterval) return;

    this.disconnect();
    this.userId = userId;

    console.log(`[NotificationService] Starting REST polling for user ${userId}...`);

    // Mark as connected immediately (REST always works if server is reachable)
    this.isConnected = true;
    this.onConnectionChange?.(true);

    // Initial fetch
    this.fetchAll();

    // Poll every 10 seconds for new notifications
    this.pollInterval = setInterval(() => this.fetchAll(), 10000);
  }

  // ── Stop polling ────────────────────────────────────────────────────
  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
    this.userId = null;
  }

  // ── Fetch all notifications + unread count ──────────────────────────
  private async fetchAll(): Promise<void> {
    if (!this.userId) return;

    try {
      const [notifications, unreadResult] = await Promise.all([
        this.fetchNotifications(this.userId),
        this.fetchUnreadCount(this.userId),
      ]);

      // Reset error count on success
      this.consecutiveErrors = 0;
      if (!this.isConnected) {
        this.isConnected = true;
        this.onConnectionChange?.(true);
      }

      // Check if data changed to avoid unnecessary re-renders
      const newHash = JSON.stringify(notifications);
      if (notifications.length > 0 && newHash !== this.lastFetchHash) {
        this.lastFetchHash = newHash;
        this.onNotificationsList?.(notifications);
      }

      this.onUnreadCount?.(unreadResult);
    } catch {
      this.consecutiveErrors++;
      // Mark as disconnected after 3 consecutive errors
      if (this.consecutiveErrors >= 3 && this.isConnected) {
        this.isConnected = false;
        this.onConnectionChange?.(false);
      }
    }
  }

  // ── Event Subscriptions ──────────────────────────────────────────────
  onUnreadCountChange(handler: UnreadCountHandler): () => void {
    this.onUnreadCount = handler;
    return () => { this.onUnreadCount = null; };
  }

  onNotificationsListReceived(handler: NotificationsListHandler): () => void {
    this.onNotificationsList = handler;
    return () => { this.onNotificationsList = null; };
  }

  onConnectionStatusChange(handler: (connected: boolean) => void): () => void {
    this.onConnectionChange = handler;
    return () => { this.onConnectionChange = null; };
  }

  // ── REST API Calls ─────────────────────────────────────────────────

  async fetchNotifications(userId: string): Promise<Notification[]> {
    try {
      return await api.get<Notification[]>('/notifications', { userId });
    } catch (error) {
      return [];
    }
  }

  async fetchUnreadCount(userId: string): Promise<number> {
    try {
      const result = await api.get<{ count: number }>('/notifications/unread-count', { userId });
      return result.count;
    } catch {
      return 0;
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`, undefined, { userId });
      // Re-fetch to get updated data
      this.fetchAll();
    } catch {}
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await api.patch('/notifications/mark-all-read', undefined, { userId });
      this.fetchAll();
    } catch {}
  }

  async simulateNotification(userId: string, type?: NotificationCategory): Promise<Notification | null> {
    try {
      const result = await api.post<Notification>('/notifications/simulate', { type, userId });
      // Re-fetch to get the new notification
      this.fetchAll();
      return result;
    } catch {
      return null;
    }
  }

  // ── Force a refresh ─────────────────────────────────────────────────
  refresh(): void {
    this.fetchAll();
  }

  // ── Connection status ────────────────────────────────────────────────
  get connected(): boolean {
    return this.isConnected;
  }

  get currentUserId(): string | null {
    return this.userId;
  }
}

// ── Singleton instance ──────────────────────────────────────────────────────
export const notificationService = new NotificationService();
