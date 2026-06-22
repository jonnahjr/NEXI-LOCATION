import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Notification,
  CreateNotificationDto,
  NotificationCategory,
  CATEGORY_META,
} from './notification.types';

// ── In-memory storage (replace with DB later) ──────────────────────────────
// userId -> Notification[]
const notificationStore: Map<string, Notification[]> = new Map();

// ── Seed some sample data per user ─────────────────────────────────────────
function seedUserNotifications(userId: string): Notification[] {
  const now = Date.now();
  return [
    {
      id: uuidv4(), userId,
      category: NotificationCategory.NEW_REVIEW,
      title: 'New Review',
      description: 'John D. reviewed Yod Abyssinia Restaurant',
      icon: '⭐', color: '#F59E0B',
      read: false,
      createdAt: new Date(now - 2 * 60 * 1000).toISOString(), // 2 min ago
    },
    {
      id: uuidv4(), userId,
      category: NotificationCategory.REWARD_EARNED,
      title: 'Reward Earned',
      description: '+50 points for your review',
      icon: '🎁', color: '#10B981',
      read: false,
      createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(), userId,
      category: NotificationCategory.BUSINESS_RESPONSE,
      title: 'Business Response',
      description: 'Tomoca Coffee replied to your review',
      icon: '💬', color: '#3B82F6',
      read: false,
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(), userId,
      category: NotificationCategory.VERIFICATION_APPROVED,
      title: 'Verification Approved',
      description: 'YeGesha Cafe is now verified',
      icon: '✅', color: '#8B5CF6',
      read: false,
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(), userId,
      category: NotificationCategory.AD_PROMOTION,
      title: 'Promotion Nearby',
      description: "20% off at Kaldi's Coffee · Bole",
      icon: '📍', color: '#EF4444',
      read: true,
      createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(), userId,
      category: NotificationCategory.PHOTO_LIKED,
      title: 'Photo Liked',
      description: 'Sarah M. liked your photo at Tomoca',
      icon: '📸', color: '#F59E0B',
      read: true,
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(), userId,
      category: NotificationCategory.REFERRAL_BONUS,
      title: 'Referral Bonus',
      description: '+100 points — Dawit joined using your code',
      icon: '👥', color: '#10B981',
      read: true,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(), userId,
      category: NotificationCategory.TRENDING_ALERT,
      title: 'Trending Alert',
      description: 'Tomoca Coffee is trending in Bole',
      icon: '🔥', color: '#EF4444',
      read: true,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(), userId,
      category: NotificationCategory.LEADERBOARD_UPDATE,
      title: 'Leaderboard',
      description: 'You moved up to #42 in Addis Ababa',
      icon: '🏆', color: '#F59E0B',
      read: true,
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(), userId,
      category: NotificationCategory.CHALLENGE_COMPLETE,
      title: 'Challenge Complete',
      description: 'Daily challenge: Review 1 Place completed!',
      icon: '🎯', color: '#10B981',
      read: true,
      createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

@Injectable()
export class NotificationsService {
  constructor() {
    // Seed data for default user
    if (!notificationStore.has('user-1')) {
      notificationStore.set('user-1', seedUserNotifications('user-1'));
    }
  }

  // ── Get all notifications for a user ─────────────────────────────────
  getNotifications(userId: string): Notification[] {
    const notifications = notificationStore.get(userId);
    if (!notifications) {
      // Auto-seed if new user
      const seeded = seedUserNotifications(userId);
      notificationStore.set(userId, seeded);
      return seeded;
    }
    return notifications;
  }

  // ── Get unread count ─────────────────────────────────────────────────
  getUnreadCount(userId: string): number {
    return this.getNotifications(userId).filter((n) => !n.read).length;
  }

  // ── Mark single notification as read ─────────────────────────────────
  markAsRead(userId: string, notificationId: string): Notification | null {
    const notifications = notificationStore.get(userId);
    if (!notifications) return null;
    const notif = notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
    return notif || null;
  }

  // ── Mark all notifications as read ────────────────────────────────────
  markAllAsRead(userId: string): number {
    const notifications = notificationStore.get(userId);
    if (!notifications) return 0;
    let count = 0;
    for (const n of notifications) {
      if (!n.read) {
        n.read = true;
        count++;
      }
    }
    return count;
  }

  // ── Create a new notification ─────────────────────────────────────────
  createNotification(dto: CreateNotificationDto): Notification {
    const meta = CATEGORY_META[dto.category] || { icon: '🔔', color: '#6B7280' };
    const notification: Notification = {
      id: uuidv4(),
      userId: dto.userId,
      category: dto.category,
      title: dto.title,
      description: dto.description,
      icon: dto.icon || meta.icon,
      color: dto.color || meta.color,
      link: dto.link,
      imageUrl: dto.imageUrl,
      metadata: dto.metadata,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const notifications = notificationStore.get(dto.userId);
    if (notifications) {
      notifications.unshift(notification); // Newest first
    } else {
      notificationStore.set(dto.userId, [notification]);
    }

    return notification;
  }

  // ── Generate a login alert notification ──────────────────────────────
  createLoginAlert(userId: string, deviceInfo?: string): Notification {
    return this.createNotification({
      userId,
      category: NotificationCategory.LOGIN_ALERT,
      title: 'New Login',
      description: deviceInfo
        ? `New sign-in from ${deviceInfo}`
        : 'New sign-in detected on your account',
      metadata: { deviceInfo },
    });
  }

  // ── Generate a new location notification ─────────────────────────────
  createNewLocationAlert(userId: string, placeName: string, placeId?: string): Notification {
    return this.createNotification({
      userId,
      category: NotificationCategory.NEW_LOCATION,
      title: 'New Place Added',
      description: `${placeName} has been added to Nexi Locate`,
      link: placeId ? `/business/${placeId}` : undefined,
      metadata: { placeName, placeId },
    });
  }

  // ── Generate an ad/promotion notification ────────────────────────────
  createPromotionAlert(userId: string, businessName: string, discount?: string): Notification {
    return this.createNotification({
      userId,
      category: NotificationCategory.AD_PROMOTION,
      title: 'Special Offer',
      description: discount
        ? `${discount} at ${businessName} · Nearby`
        : `Check out ${businessName} · New offers available`,
      icon: '🎯',
      color: '#EF4444',
      metadata: { businessName, discount },
    });
  }

  // ── Delete a notification ────────────────────────────────────────────
  deleteNotification(userId: string, notificationId: string): boolean {
    const notifications = notificationStore.get(userId);
    if (!notifications) return false;
    const index = notifications.findIndex((n) => n.id === notificationId);
    if (index === -1) return false;
    notifications.splice(index, 1);
    return true;
  }
}
