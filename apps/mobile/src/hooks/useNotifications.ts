// ── useNotifications Hook ──────────────────────────────────────────────────
// React hook that reads notification state from the Zustand store.
// WebSocket connection is managed globally in app/_layout.tsx.

import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import {
  notificationService,
  NotificationCategory,
  CATEGORY_META,
} from '../services/notifications';

const DEFAULT_USER_ID = 'user-1';

// ── Hook ─────────────────────────────────────────────────────────────────

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    markNotificationRead: storeMarkRead,
    markAllNotificationsRead,
  } = useAppStore();

  // ── Mark single notification as read ────────────────────────────────
  const markAsRead = useCallback((notificationId: string) => {
    storeMarkRead(notificationId);
    notificationService.markAsRead(notificationId, DEFAULT_USER_ID);
  }, [storeMarkRead]);

  // ── Mark all as read ────────────────────────────────────────────────
  const markAllRead = useCallback(() => {
    markAllNotificationsRead();
    notificationService.markAllAsRead(DEFAULT_USER_ID);
  }, [markAllNotificationsRead]);

  // ── Refresh notifications ──────────────────────────────────────────
  const refresh = useCallback(() => {
    notificationService.refresh();
  }, []);

  // ── Simulate a notification (for testing) ───────────────────────────
  const simulateNotification = useCallback(async (type?: NotificationCategory) => {
    return notificationService.simulateNotification(DEFAULT_USER_ID, type);
  }, []);

  // ── Get metadata for a category ────────────────────────────────────
  const getCategoryMeta = useCallback((category: NotificationCategory) => {
    return CATEGORY_META[category] || { icon: '🔔', color: '#6B7280', label: 'Notification' };
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected: notificationService.connected,
    markAsRead,
    markAllRead,
    refresh,
    simulateNotification,
    getCategoryMeta,
  };
}
