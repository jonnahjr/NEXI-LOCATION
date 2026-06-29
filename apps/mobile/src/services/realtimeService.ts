// ═══════════════════════════════════════════════════════════════════════════
// Realtime Service — Supabase Realtime Subscriptions
// Replaces polling with live push via WebSocket channels.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase';
import type { Notification } from './notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationRow {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  link: string | null;
  image_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

type NotificationCallback = (notification: Notification) => void;
type LeaderboardCallback = (entries: any[]) => void;
type BusinessActivityCallback = (event: { type: string; businessId: string; data: any }) => void;

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  // ── Subscribe to user notifications (live push) ────────────────────────
  subscribeToNotifications(userId: string, callback: NotificationCallback): void {
    const channelName = `notifications:${userId}`;
    if (this.channels.has(channelName)) return;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            const row = payload.new as NotificationRow;
            const notification: Notification = {
              id: row.id,
              userId: row.user_id,
              category: row.category,
              title: row.title,
              description: row.description || '',
              icon: row.icon || '🔔',
              color: row.color || '#3B82F6',
              link: row.link || undefined,
              imageUrl: row.image_url || undefined,
              metadata: row.metadata || undefined,
              read: false,
              createdAt: row.created_at,
            };
            callback(notification);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] notifications channel status: ${status}`);
      });

    this.channels.set(channelName, channel);
  }

  // ── Subscribe to leaderboard updates ───────────────────────────────────
  subscribeToLeaderboard(
    period: string,
    callback: LeaderboardCallback,
  ): void {
    const channelName = `leaderboard:${period}`;
    if (this.channels.has(channelName)) return;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard',
          filter: `period=eq.${period}`,
        },
        async () => {
          // Re-fetch top entries when any change occurs
          const { data } = await supabase
            .from('leaderboard')
            .select(`
              id, user_id, period, points, rank,
              profiles:user_id (name, avatar)
            `)
            .eq('period', period)
            .order('points', { ascending: false })
            .limit(20);

          if (data) callback(data);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
  }

  // ── Subscribe to business activity (reviews, check-ins) ───────────────
  subscribeToBusinessActivity(
    businessId: string,
    callback: BusinessActivityCallback,
  ): void {
    const channelName = `business:${businessId}`;
    if (this.channels.has(channelName)) return;

    const reviewChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          callback({ type: 'new_review', businessId, data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'check_ins',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          callback({ type: 'new_checkin', businessId, data: payload.new });
        }
      )
      .subscribe();

    this.channels.set(channelName, reviewChannel);
  }

  // ── Unsubscribe all channels ───────────────────────────────────────────
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  // ── Unsubscribe specific channel ───────────────────────────────────────
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  get activeChannelCount(): number {
    return this.channels.size;
  }
}

export const realtimeService = new RealtimeService();
