import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme, SPACING, RADIUS } from '../theme/colors';
import { NotificationCategory, CATEGORY_META } from '../services/notifications';

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    isConnected,
    refresh,
    simulateNotification,
  } = useNotifications();

  // ── Sort notifications: unread first, then by date ──────────────────
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      // Unread first
      if (a.read !== b.read) return a.read ? 1 : -1;
      // Then by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications]);

  // ── Format relative time ─────────────────────────────────────────────
  const formatTime = (dateStr: string): string => {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;

    return new Date(dateStr).toLocaleDateString();
  };

  // ── Handle notification tap ──────────────────────────────────────────
  const handleNotificationPress = useCallback((notif: any) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    // Navigate based on link if available
    if (notif.link) {
      router.push(notif.link);
    }
  }, [markAsRead, router]);

  // ── Dev: Simulate notification ──────────────────────────────────────
  // Uses 2 options (Cancel + Random) because Android Alert maxes at 3 buttons.
  const handleSimulate = useCallback(() => {
    Alert.alert(
      'Simulate Notification',
      'A random notification will be created in real-time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Random 🎲', onPress: () => simulateNotification() },
      ],
    );
  }, [simulateNotification]);

  // ── Has notifications ────────────────────────────────────────────────
  const hasNotifications = sortedNotifications.length > 0;
  const unreadExists = unreadCount > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>🔔 Notifications</Text>

        <View style={styles.headerRight}>
          {/* Connection indicator */}
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? '#10B981' : '#EF4444' },
            ]}
          />
          {unreadExists && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={[styles.markRead, { color: colors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        {!hasNotifications ? (
          // ── Empty State ──
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.card }]}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications Yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSub }]}>
              When you get reviews, rewards, and updates,{'\n'}they'll show up here
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/search')}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.emptyBtnText}>Explore Places</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Notification List ── */}
            {sortedNotifications.map((notif, i) => (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: !notif.read ? colors.card : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handleNotificationPress(notif)}
              >
                <View
                  style={[
                    styles.notifIconWrap,
                    { backgroundColor: notif.color + '22' },
                  ]}
                >
                  <Text style={styles.notifIcon}>{notif.icon || '🔔'}</Text>
                </View>
                <View style={styles.notifInfo}>
                  <View style={styles.notifTop}>
                    <Text
                      style={[
                        styles.notifTitle,
                        {
                          color: colors.text,
                          fontWeight: !notif.read ? '700' : '600',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {notif.title}
                    </Text>
                    {!notif.read && (
                      <View
                        style={[styles.unreadDot, { backgroundColor: colors.primary }]}
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.notifDesc, { color: colors.textSub }]}
                    numberOfLines={2}
                  >
                    {notif.description}
                  </Text>
                  <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                    {formatTime(notif.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* ── Dev Simulate Button ── */}
            <TouchableOpacity
              onPress={handleSimulate}
              style={[styles.simulateBtn, { borderColor: colors.border }]}
            >
              <Ionicons name="flask-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.simulateText, { color: colors.textMuted }]}>
                Simulate Test Notification
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  connectionDot: { width: 8, height: 8, borderRadius: 4 },
  markRead: { fontSize: 12, fontWeight: '700' },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm },
  notifCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  notifInfo: { flex: 1, gap: 2 },
  notifTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  notifTitle: { fontSize: 14, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifDesc: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
  notifTime: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  // ── Empty State ──
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: SPACING.sm },
  emptyDesc: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xxl },
  emptyBtn: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, borderRadius: RADIUS.full },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // ── Simulate Button ──
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    borderStyle: 'dashed',
  },
  simulateText: { fontSize: 12, fontWeight: '600' },
});
