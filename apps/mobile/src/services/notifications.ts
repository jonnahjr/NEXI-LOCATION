// ═══════════════════════════════════════════════════════════════════════════
// Notifications Service — Fallback Polling
// Primary live push is now handled by RealtimeService.
// This service only polls occasionally (every 30s) as a safety net.
// ═══════════════════════════════════════════════════════════════════════════

import { fetchNotificationsFromSupabase, fetchUnreadCountFromSupabase } from './dataService';

export interface Notification {
  id: string;
  userId: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  link?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type NotificationCategory =
  | 'new_review' | 'new_location' | 'login_alert' | 'ad_promotion'
  | 'reward_earned' | 'business_response' | 'verification_approved'
  | 'photo_liked' | 'referral_bonus' | 'trending_alert'
  | 'leaderboard_update' | 'challenge_complete';

export const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  new_review: { icon: '💬', color: '#3B82F6', label: 'New Review' },
  new_location: { icon: '📍', color: '#10B981', label: 'New Location' },
  login_alert: { icon: '🔐', color: '#F59E0B', label: 'Login Alert' },
  ad_promotion: { icon: '📣', color: '#8B5CF6', label: 'Promotion' },
  reward_earned: { icon: '🎁', color: '#F59E0B', label: 'Reward' },
  business_response: { icon: '💼', color: '#6366F1', label: 'Business Response' },
  verification_approved: { icon: '✅', color: '#10B981', label: 'Verified' },
  photo_liked: { icon: '📸', color: '#EC4899', label: 'Photo Liked' },
  referral_bonus: { icon: '👥', color: '#14B8A6', label: 'Referral Bonus' },
  trending_alert: { icon: '🔥', color: '#EF4444', label: 'Trending' },
  leaderboard_update: { icon: '🏆', color: '#F59E0B', label: 'Leaderboard' },
  challenge_complete: { icon: '🎯', color: '#8B5CF6', label: 'Challenge Complete' },
};

// ── Random notification generator (for dev/testing) ───────────────────────
const RANDOM_TITLES = [
  { title: 'New Review!', desc: 'Someone reviewed a place you saved', icon: '💬', color: '#3B82F6', cat: 'new_review' as NotificationCategory },
  { title: 'Points Earned 🎉', desc: 'You earned 50 points for your review!', icon: '🎁', color: '#10B981', cat: 'reward_earned' as NotificationCategory },
  { title: 'Trending Alert', desc: 'A place you liked is trending this week', icon: '🔥', color: '#EF4444', cat: 'trending_alert' as NotificationCategory },
  { title: 'Leaderboard Update', desc: 'You moved up 3 spots this week!', icon: '🏆', color: '#F59E0B', cat: 'leaderboard_update' as NotificationCategory },
  { title: 'New Place Added', desc: 'A new restaurant opened near you', icon: '📍', color: '#8B5CF6', cat: 'new_location' as NotificationCategory },
];

type NotificationsCallback = (notifications: Notification[]) => void;
type UnreadCountCallback = (count: number) => void;

class NotificationService {
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private currentUserId: string | null = null;
  private isConnected = false;
  private listeners: NotificationsCallback[] = [];
  private countListeners: UnreadCountCallback[] = [];

  // Poll every 30 seconds (reduced from 10s because Realtime handles instant push)
  private readonly POLL_DELAY = 30000;

  // ── Connection ────────────────────────────────────────────────────────────

  connect(userId: string) {
    if (this.isConnected && this.currentUserId === userId) return;

    this.disconnect(); // Clear any existing
    this.currentUserId = userId;
    this.isConnected = true;

    // Immediate initial fetch
    this.fetchData();

    // Start fallback polling
    this.pollInterval = setInterval(() => {
      this.fetchData();
    }, this.POLL_DELAY);

    console.log(`[NotificationService] Fallback polling started for user: ${userId}`);
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
    this.currentUserId = null;
    console.log('[NotificationService] Disconnected');
  }

  // ── Fetching Data ────────────────────────────────────────────────────────

  private async fetchData() {
    if (!this.currentUserId) return;

    try {
      const [list, count] = await Promise.all([
        fetchNotificationsFromSupabase(this.currentUserId),
        fetchUnreadCountFromSupabase(this.currentUserId),
      ]);

      this.notifyListeners(list);
      this.notifyCountListeners(count);
    } catch (error) {
      console.warn('[NotificationService] Fallback fetch failed:', error);
    }
  }

  // ── Subscriptions ────────────────────────────────────────────────────────

  onNotificationsListReceived(callback: NotificationsCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  onUnreadCountChange(callback: UnreadCountCallback): () => void {
    this.countListeners.push(callback);
    return () => {
      this.countListeners = this.countListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(data: Notification[]) {
    this.listeners.forEach((cb) => cb(data));
  }

  private notifyCountListeners(count: number) {
    this.countListeners.forEach((cb) => cb(count));
  }

  // ── Additional methods used by useNotifications hook ─────────────────

  get connected(): boolean {
    return this.isConnected;
  }

  async markAsRead(notificationId: string, _userId?: string): Promise<void> {
    try {
      const { markNotificationReadInSupabase } = await import('./dataService');
      await markNotificationReadInSupabase(notificationId);
    } catch {}
  }

  async markAllAsRead(_userId?: string): Promise<void> {
    try {
      const { markAllNotificationsReadInSupabase } = await import('./dataService');
      await markAllNotificationsReadInSupabase();
    } catch {}
  }

  async refresh(): Promise<void> {
    await this.fetchData();
  }

  async simulateNotification(userId: string, _type?: NotificationCategory): Promise<void> {
    try {
      const pick = RANDOM_TITLES[Math.floor(Math.random() * RANDOM_TITLES.length)];
      const notification: Notification = {
        id: `sim-${Date.now()}`,
        userId,
        category: pick.cat,
        title: pick.title,
        description: pick.desc,
        icon: pick.icon,
        color: pick.color,
        read: false,
        createdAt: new Date().toISOString(),
      };
      this.notifyListeners([notification]);
    } catch {}
  }
}

export const notificationService = new NotificationService();
