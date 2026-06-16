import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

const NOTIFICATIONS = [
  { icon: '⭐', title: 'New Review', desc: 'John D. reviewed Yod Abyssinia Restaurant', time: '2m ago', color: '#F59E0B', unread: true },
  { icon: '🎁', title: 'Reward Earned', desc: '+50 points for your review', time: '15m ago', color: '#10B981', unread: true },
  { icon: '🏪', title: 'Business Response', desc: 'Tomoca Coffee replied to your review', time: '1h ago', color: '#3B82F6', unread: true },
  { icon: '✅', title: 'Verification Approved', desc: 'YeGesha Cafe is now verified', time: '3h ago', color: '#8B5CF6', unread: true },
  { icon: '📍', title: 'Promotion Nearby', desc: '20% off at Kaldi\'s Coffee · Bole', time: '5h ago', color: '#EF4444', unread: false },
  { icon: '📸', title: 'Photo Liked', desc: 'Sarah M. liked your photo at Tomoca', time: '1d ago', color: '#F59E0B', unread: false },
  { icon: '👥', title: 'Referral Bonus', desc: '+100 points — Dawit joined using your code', time: '2d ago', color: '#10B981', unread: false },
  { icon: '🔥', title: 'Trending Alert', desc: 'Tomoca Coffee is trending in Bole', time: '3d ago', color: '#EF4444', unread: false },
  { icon: '🏆', title: 'Leaderboard', desc: 'You moved up to #42 in Addis Ababa', time: '5d ago', color: '#F59E0B', unread: false },
  { icon: '🎯', title: 'Challenge Complete', desc: 'Daily challenge: Review 1 Place completed!', time: '1w ago', color: '#10B981', unread: false },
];

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { markAllRead } = useAppStore();
  const [allRead, setAllRead] = useState(false);

  const handleMarkAllRead = () => {
    markAllRead();
    setAllRead(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🔔 Notifications</Text>
        {!allRead && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markRead, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {NOTIFICATIONS.map((notif, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.notifCard,
              { backgroundColor: notif.unread ? colors.card : 'transparent', borderColor: colors.border },
            ]}
            activeOpacity={0.7}
          >
            <View style={[styles.notifIconWrap, { backgroundColor: notif.color + '22' }]}>
              <Text style={styles.notifIcon}>{notif.icon}</Text>
            </View>
            <View style={styles.notifInfo}>
              <View style={styles.notifTop}>
                <Text style={[styles.notifTitle, { color: colors.text, fontWeight: notif.unread ? '700' : '600' }]}>
                  {notif.title}
                </Text>
                {notif.unread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[styles.notifDesc, { color: colors.textSub }]}>{notif.desc}</Text>
              <Text style={[styles.notifTime, { color: colors.textMuted }]}>{notif.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800' },
  markRead: { fontSize: 12, fontWeight: '700' },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm },
  notifCard: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, borderWidth: 1 },
  notifIconWrap: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { fontSize: 18 },
  notifInfo: { flex: 1, gap: 2 },
  notifTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  notifTitle: { fontSize: 14 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifDesc: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
  notifTime: { fontSize: 11, fontWeight: '500', marginTop: 2 },
});
