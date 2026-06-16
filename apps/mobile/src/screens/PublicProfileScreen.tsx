import React from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

export const PublicProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Mock user data
  const profile = {
    name: 'Hana K.',
    avatar: '👩',
    level: 12,
    points: 12500,
    reviews: 150,
    photos: 500,
    saved: 230,
    verified: true,
    badges: ['First Review', 'Top Reviewer', 'City Explorer', 'Photo Master', 'Community Hero'],
    recentReviews: [
      { biz: 'Yod Abyssinia Restaurant', rating: 5, text: 'Absolutely incredible! The best traditional food in Addis.', time: '1w ago' },
      { biz: "Kaldi's Coffee", rating: 4, text: 'Great atmosphere for working. Coffee is excellent.', time: '2w ago' },
      { biz: 'Sheraton Addis Hotel', rating: 5, text: 'World-class service and stunning architecture.', time: '3w ago' },
    ],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}>
            <Text style={styles.avatar}>{profile.avatar}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{profile.name}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: colors.primaryGlow }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>Level {profile.level} Explorer</Text>
            </View>
            {profile.verified && (
              <View style={[styles.badge, { backgroundColor: colors.accentGlow }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.accent} />
                <Text style={[styles.badgeText, { color: colors.accent }]}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={[styles.impact, { color: colors.textSub }]}>
            Trusted contributor — helped 50,000+ people discover places
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.primary }]}>{profile.reviews}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Reviews</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.accent }]}>{profile.photos}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Photos</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.gold }]}>{profile.points.toLocaleString()}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Points</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🏅 Badges</Text>
          <View style={styles.badgesGrid}>
            {profile.badges.map((b, i) => (
              <View key={i} style={[styles.badgeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.badgeCardIcon}>🏅</Text>
                <Text style={[styles.badgeCardLabel, { color: colors.textSub }]}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Reviews */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⭐ Recent Reviews</Text>
          {profile.recentReviews.map((rev, i) => (
            <View key={i} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.reviewBiz, { color: colors.text }]}>{rev.biz}</Text>
              <View style={styles.reviewStars}>
                {Array.from({ length: rev.rating }).map((_, si) => (
                  <Ionicons key={si} name="star" size={12} color={colors.gold} />
                ))}
              </View>
              <Text style={[styles.reviewText, { color: colors.textSub }]}>{rev.text}</Text>
              <Text style={[styles.reviewTime, { color: colors.textMuted }]}>{rev.time}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  content: { paddingHorizontal: SPACING.xl },
  profileSection: { alignItems: 'center', marginBottom: SPACING.xxl },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: SPACING.md },
  avatar: { fontSize: 36 },
  name: { fontSize: 24, fontWeight: '800', marginBottom: SPACING.sm },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  badgeText: { fontSize: 11, fontWeight: '700' },
  impact: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  statsCard: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, marginBottom: SPACING.xxl },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLbl: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, marginVertical: SPACING.xs },
  section: { marginBottom: SPACING.xxl },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: SPACING.lg },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  badgeCard: { width: '46%', flexGrow: 1, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, alignItems: 'center', gap: SPACING.sm, flexDirection: 'row' },
  badgeCardIcon: { fontSize: 20 },
  badgeCardLabel: { fontSize: 12, fontWeight: '600' },
  reviewCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.md, gap: SPACING.sm },
  reviewBiz: { fontSize: 14, fontWeight: '700' },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewText: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
  reviewTime: { fontSize: 11, fontWeight: '500' },
});
