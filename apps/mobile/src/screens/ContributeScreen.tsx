import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

const CONTRIBUTE_OPTIONS = [
  {
    icon: '⭐',
    title: 'Write Review',
    desc: 'Share your experience at a place',
    color: '#F59E0B',
    points: '+20',
    route: '/add-review',
  },
  {
    icon: '📸',
    title: 'Upload Photo',
    desc: 'Add photos to existing places',
    color: '#3B82F6',
    points: '+10',
    route: '/upload-photo',
  },
  {
    icon: '➕',
    title: 'Add Place',
    desc: 'Add a business that is missing',
    color: '#10B981',
    points: '+50',
    route: '/add-place',
  },
  {
    icon: '✅',
    title: 'Verify Place',
    desc: 'Confirm business details are correct',
    color: '#8B5CF6',
    points: '+50',
    route: '/verify-place',
  },
  {
    icon: '🚩',
    title: 'Report Issue',
    desc: 'Report wrong info or closed business',
    color: '#EF4444',
    points: '+5',
    route: '/report-issue',
  },
];

const QUICK_TIPS = [
  '📍 Take a photo of the entrance',
  '📝 Write at least 3 sentences',
  '✅ Only review places you visited',
  '📸 Upload real, clear photos',
];

export const ContributeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.bgGlow, { backgroundColor: colors.violetGlow }]} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerEmoji}>➕</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Contribute</Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.textSub }]}>
            Help build Ethiopia's location database
          </Text>
        </View>

        {/* Contribute Options */}
        {CONTRIBUTE_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => router.push(opt.route as any)}
          >
            <View style={[styles.optionIconWrap, { backgroundColor: opt.color + '22' }]}>
              <Text style={styles.optionIcon}>{opt.icon}</Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{opt.title}</Text>
              <Text style={[styles.optionDesc, { color: colors.textSub }]}>{opt.desc}</Text>
            </View>
            <View style={[styles.pointsBadge, { backgroundColor: colors.accentGlow }]}>
              <Text style={[styles.pointsText, { color: colors.accent }]}>{opt.points}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Impact Card */}
        <View style={[styles.impactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.impactTitle, { color: colors.text }]}>🌍 Your Impact</Text>
          <View style={styles.impactGrid}>
            <View style={styles.impactItem}>
              <Text style={[styles.impactVal, { color: colors.primary }]}>24</Text>
              <Text style={[styles.impactLbl, { color: colors.textMuted }]}>Reviews</Text>
            </View>
            <View style={styles.impactItem}>
              <Text style={[styles.impactVal, { color: colors.accent }]}>48</Text>
              <Text style={[styles.impactLbl, { color: colors.textMuted }]}>Photos</Text>
            </View>
            <View style={styles.impactItem}>
              <Text style={[styles.impactVal, { color: colors.gold }]}>3</Text>
              <Text style={[styles.impactLbl, { color: colors.textMuted }]}>Places Added</Text>
            </View>
          </View>
        </View>

        {/* Quick Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📌 Quick Tips</Text>
          {QUICK_TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
              <Text style={[styles.tipText, { color: colors.textSub }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Contribution Badge */}
        <View style={[styles.badgeCard, { backgroundColor: colors.violetGlow, borderColor: colors.violet + '33' }]}>
          <Ionicons name="sparkles" size={24} color={colors.violet} />
          <Text style={[styles.badgeTitle, { color: colors.text }]}>City Contributor</Text>
          <Text style={[styles.badgeSub, { color: colors.textSub }]}>
            You're helping 12,500+ people discover places
          </Text>
        </View>

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGlow: { position: 'absolute', top: -80, right: -60, width: 200, height: 200, borderRadius: 100, opacity: 0.3, transform: [{ scale: 1.5 }] },
  content: { paddingHorizontal: SPACING.xl },
  header: { marginBottom: SPACING.xxl, alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.md },
  optionIconWrap: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  optionIcon: { fontSize: 24 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  pointsBadge: { borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginRight: SPACING.sm },
  pointsText: { fontSize: 11, fontWeight: '800' },
  impactCard: { borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, marginBottom: SPACING.xxl, alignItems: 'center' },
  impactTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.lg },
  impactGrid: { flexDirection: 'row', gap: SPACING.xxl },
  impactItem: { alignItems: 'center', gap: 4 },
  impactVal: { fontSize: 24, fontWeight: '900' },
  impactLbl: { fontSize: 11, fontWeight: '600' },
  section: { marginBottom: SPACING.xxl },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.lg },
  tipRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  tipBullet: { fontSize: 16, fontWeight: '700' },
  tipText: { fontSize: 13, fontWeight: '500', flex: 1 },
  badgeCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, marginBottom: SPACING.xxl, alignItems: 'center', gap: SPACING.sm },
  badgeTitle: { fontSize: 16, fontWeight: '800' },
  badgeSub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
});
