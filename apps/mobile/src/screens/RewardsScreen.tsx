import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/appStore';
import { useRouter } from 'expo-router';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

// ── Mock Data ────────────────────────────────────────────────────────────

const EARN_TASKS = [
  { icon: '⭐', label: 'Write Review', points: 20, color: '#F59E0B' },
  { icon: '📸', label: 'Upload Photo', points: 10, color: '#3B82F6' },
  { icon: '🎥', label: 'Upload Video', points: 15, color: '#8B5CF6' },
  { icon: '📍', label: 'Check In', points: 5, color: '#10B981' },
  { icon: '🏢', label: 'Verify Business', points: 50, color: '#FAA330' },
  { icon: '👥', label: 'Refer Friend', points: 100, color: '#EF4444' },
];

const DAILY_CHALLENGES = [
  { task: 'Review 1 Place', reward: '+20', progress: 2, total: 3 },
  { task: 'Upload 2 Photos', reward: '+20', progress: 1, total: 2 },
  { task: 'Visit New Place', reward: '+10', progress: 0, total: 1 },
];

const REDEEM_OPTIONS = [
  { icon: '📡', label: 'Airtime', points: 1000, value: '100 ETB', desc: 'Mobile airtime top-up' },
  { icon: '📱', label: 'Telebirr', points: 2000, value: '200 ETB', desc: 'Telebirr transfer' },
  { icon: '🍽️', label: 'Restaurant Coupon', points: 5000, value: 'Voucher', desc: 'Dine at partner restaurants' },
  { icon: '🏆', label: 'Premium Rewards', points: 10000, value: 'Exclusive', desc: 'Premium gifts & experiences' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Hana K.', points: 12500, avatar: '👩' },
  { rank: 2, name: 'Dawit T.', points: 11900, avatar: '👨' },
  { rank: 3, name: 'Jonas A.', points: 10400, avatar: '🧑' },
];

const ACHIEVEMENTS = [
  { icon: '⭐', label: 'First Review', earned: true },
  { icon: '🏅', label: 'Top Reviewer', earned: true },
  { icon: '📸', label: 'Top Photographer', earned: false },
  { icon: '🌍', label: 'City Explorer', earned: true },
  { icon: '✅', label: 'Business Verifier', earned: false },
  { icon: '🤝', label: 'Community Hero', earned: false },
];

const MONTHLY_REWARDS = [
  { label: '500 ETB Airtime', icon: '📡' },
  { label: 'Business Coupons', icon: '🎟️' },
  { label: 'Premium Badges', icon: '🏅' },
];

const RECENT_ACTIVITY = [
  { icon: '⭐', label: 'Review Submitted', points: '+20', time: '2h ago', color: '#10B981' },
  { icon: '📸', label: 'Photo Uploaded', points: '+10', time: '5h ago', color: '#3B82F6' },
  { icon: '✅', label: 'Business Verified', points: '+50', time: '1d ago', color: '#F59E0B' },
  { icon: '📡', label: 'Airtime Redeemed', points: '-1000', time: '2d ago', color: '#EF4444' },
  { icon: '📍', label: 'Checked In', points: '+5', time: '3d ago', color: '#8B5CF6' },
];

const CONTRIBUTION_STATS = [
  { label: 'Reviews', value: 28, icon: '⭐' },
  { label: 'Photos', value: 75, icon: '📸' },
  { label: 'Places Saved', value: 120, icon: '❤️' },
  { label: 'Businesses Verified', value: 3, icon: '✅' },
];

// ── Component ────────────────────────────────────────────────────────────

export const RewardsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const pointsBalance = user?.points || 0;
  const totalEarned = user?.totalEarned || 0;
  const redeemed = totalEarned - pointsBalance;
  const level = user?.level || 1;
  const nextLevelPoints = (level + 1) * 500;
  const levelProgress = Math.min((pointsBalance / nextLevelPoints) * 100, 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.bgGlow, { backgroundColor: colors.goldGlow }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary, colors.accent, colors.violet]}
            progressBackgroundColor={colors.card}
          />
        }
      >
        {/* ──────────────── 1. HEADER ──────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerEmoji}>🎁</Text>
            <Text style={[styles.headerLabel, { color: colors.textSub }]}>Nexi Rewards</Text>
          </View>
          <Text style={[styles.balanceNumber, { color: colors.text }]}>
            {pointsBalance.toLocaleString()}
          </Text>
          <Text style={[styles.balanceValue, { color: colors.primary }]}>
            ≈ {Math.round(pointsBalance / 10)} ETB Value
          </Text>

          {/* Level Row */}
          <View style={styles.levelRow}>
            <Text style={styles.trophyEmoji}>🏆</Text>
            <Text style={[styles.levelText, { color: colors.text }]}>
              Explorer Level {level}
            </Text>
          </View>
          <View style={styles.levelMetaRow}>
            <Text style={[styles.levelSub, { color: colors.textMuted }]}>
              {nextLevelPoints - pointsBalance} Points to Level {level + 1}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.gold, width: `${levelProgress}%` },
              ]}
            />
          </View>
        </View>

        {/* ──────────────── 2. POINTS SUMMARY ──────────────── */}
        <View style={[styles.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: colors.accent }]}>
              {totalEarned.toLocaleString()}
            </Text>
            <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Total Earned</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: colors.danger }]}>
              {redeemed.toLocaleString()}
            </Text>
            <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Redeemed</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: colors.primary }]}>
              {pointsBalance.toLocaleString()}
            </Text>
            <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Balance</Text>
          </View>
        </View>

        {/* ──────────────── 3. EARN POINTS ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>💰 Earn More Points</Text>
          </View>
          <View style={styles.tasksGrid}>
            {EARN_TASKS.map((task, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.taskIconWrap, { backgroundColor: task.color + '22' }]}>
                  <Text style={styles.taskIcon}>{task.icon}</Text>
                </View>
                <Text style={[styles.taskLabel, { color: colors.text }]}>{task.label}</Text>
                <Text style={[styles.taskPoints, { color: colors.accent }]}>+{task.points}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Start Earning', 'Complete the tasks above to earn Nexi Points!')}
          >
            <Text style={styles.startBtnText}>Start Earning</Text>
          </TouchableOpacity>
        </View>

        {/* ──────────────── 4. DAILY CHALLENGES ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Today's Challenges</Text>
          </View>
          {DAILY_CHALLENGES.map((ch, i) => {
            const pct = Math.round((ch.progress / ch.total) * 100);
            return (
              <View
                key={i}
                style={[styles.challengeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.challengeTop}>
                  <Text style={[styles.challengeTask, { color: colors.text }]}>{ch.task}</Text>
                  <Text style={[styles.challengeReward, { color: colors.accent }]}>
                    Reward: {ch.reward}
                  </Text>
                </View>
                <View style={styles.challengeProgressRow}>
                  <View style={[styles.challengeTrack, { backgroundColor: colors.surfaceAlt }]}>
                    <View
                      style={[
                        styles.challengeFill,
                        { backgroundColor: colors.gold, width: `${pct}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.challengePct, { color: colors.textMuted }]}>
                    {ch.progress}/{ch.total}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ──────────────── 5. REDEEM REWARDS ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎁 Redeem Points</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.redeemRow}>
            {REDEEM_OPTIONS.map((opt, i) => {
              const canAfford = pointsBalance >= opt.points;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.redeemCard,
                    { backgroundColor: colors.card, borderColor: canAfford ? colors.primaryGlow : colors.border },
                    !canAfford && styles.redeemLocked,
                  ]}
                  activeOpacity={canAfford ? 0.7 : 1}
                  onPress={() => {
                    if (canAfford) {
                      Alert.alert('Redeem', `You are about to redeem ${opt.label} for ${opt.points.toLocaleString()} points.`);
                    }
                  }}
                >
                  <Text style={styles.redeemIcon}>{opt.icon}</Text>
                  <Text style={[styles.redeemLabel, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.redeemValue, { color: colors.primary }]}>{opt.value}</Text>
                  <Text style={[styles.redeemDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                  <Text style={[styles.redeemPoints, { color: colors.textSub }]}>
                    {opt.points.toLocaleString()} pts
                  </Text>
                  <View
                    style={[
                      styles.redeemBtn,
                      { backgroundColor: canAfford ? colors.accent : colors.surfaceAlt },
                    ]}
                  >
                    <Text
                      style={[
                        styles.redeemBtnText,
                        { color: canAfford ? '#FFF' : colors.textMuted },
                      ]}
                    >
                      {canAfford ? 'Redeem Now' : 'Locked'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ──────────────── 6. LEADERBOARD ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🏆 Top Explorers</Text>
          </View>
          <View style={[styles.leaderboardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {LEADERBOARD.map((entry, i) => (
              <View
                key={i}
                style={[
                  styles.leaderRow,
                  i < LEADERBOARD.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.leaderRank}>
                  {i === 0 ? (
                    <Text style={styles.medalIcon}>🥇</Text>
                  ) : i === 1 ? (
                    <Text style={styles.medalIcon}>🥈</Text>
                  ) : (
                    <Text style={styles.medalIcon}>🥉</Text>
                  )}
                </View>
                <Text style={styles.leaderAvatar}>{entry.avatar}</Text>
                <Text style={[styles.leaderName, { color: colors.text }]}>{entry.name}</Text>
                <Text style={[styles.leaderPoints, { color: colors.gold }]}>
                  {entry.points.toLocaleString()}
                </Text>
              </View>
            ))}
            <View style={[styles.leaderFooter, { borderTopColor: colors.border }]}>
              <Ionicons name="location" size={14} color={colors.textMuted} />
              <Text style={[styles.leaderPosition, { color: colors.textSub }]}>
                You are #42 in Addis Ababa
              </Text>
            </View>
          </View>
        </View>

        {/* ──────────────── 7. ACHIEVEMENT BADGES ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🏅 Achievements</Text>
          </View>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((ach, i) => (
              <View
                key={i}
                style={[
                  styles.achCard,
                  {
                    backgroundColor: ach.earned ? colors.card : colors.surfaceAlt,
                    borderColor: ach.earned ? colors.border : 'transparent',
                    opacity: ach.earned ? 1 : 0.5,
                  },
                ]}
              >
                <Text style={styles.achIcon}>{ach.icon}</Text>
                <Text
                  style={[
                    styles.achLabel,
                    { color: ach.earned ? colors.text : colors.textMuted },
                  ]}
                >
                  {ach.label}
                </Text>
                {ach.earned && <Text style={[styles.achCheck, { color: colors.accent }]}>✓</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* ──────────────── 8. RECENT ACTIVITY ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📜 Reward History</Text>
            <TouchableOpacity onPress={() => Alert.alert('Reward History', 'Full transaction history coming in Phase 2.')}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {RECENT_ACTIVITY.map((act, i) => {
              const isPositive = act.points.startsWith('+');
              return (
                <View
                  key={i}
                  style={[
                    styles.activityRow,
                    i < RECENT_ACTIVITY.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.activityIconWrap, { backgroundColor: act.color + '22' }]}>
                    <Text style={styles.activityIcon}>{act.icon}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityLabel, { color: colors.text }]}>{act.label}</Text>
                    <Text style={[styles.activityTime, { color: colors.textMuted }]}>{act.time}</Text>
                  </View>
                  <Text
                    style={[
                      styles.activityPoints,
                      { color: isPositive ? colors.accent : colors.danger },
                    ]}
                  >
                    {act.points}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ──────────────── 9. MONTHLY REWARDS EVENT ──────────────── */}
        <View style={[styles.monthlyCard, { backgroundColor: colors.violetGlow, borderColor: colors.violet + '44' }]}>
          <View style={styles.monthlyHeader}>
            <Text style={styles.monthlyEmoji}>🎉</Text>
            <Text style={[styles.monthlyTitle, { color: colors.text }]}>Monthly Challenge</Text>
          </View>
          <Text style={[styles.monthlySub, { color: colors.textSub }]}>
            Top 100 Contributors win exclusive prizes.
          </Text>
          <View style={styles.monthlyPrizes}>
            {MONTHLY_REWARDS.map((prize, i) => (
              <View key={i} style={[styles.monthlyPrize, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.monthlyPrizeIcon}>{prize.icon}</Text>
                <Text style={[styles.monthlyPrizeLabel, { color: colors.text }]}>{prize.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.monthlyBtn, { backgroundColor: colors.violet }]}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Monthly Challenge', 'You have joined the challenge! Complete contributions to win prizes.')}
          >
            <Text style={styles.monthlyBtnText}>Join Challenge</Text>
          </TouchableOpacity>
        </View>

        {/* ──────────────── 10. REFERRAL PROGRAM ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>👥 Invite Friends</Text>
          </View>
          <View style={[styles.referralCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.referralContent}>
              <Ionicons name="gift" size={28} color={colors.primary} />
              <View style={styles.referralInfo}>
                <Text style={[styles.referralTitle, { color: colors.text }]}>
                  Earn 100 Points per Referral
                </Text>
                <Text style={[styles.referralSub, { color: colors.textSub }]}>
                  Share your code: <Text style={[styles.referralCode, { color: colors.primary }]}>JONAS100</Text>
                </Text>
              </View>
            </View>
            <View style={styles.referralActions}>
              <TouchableOpacity
                style={[styles.referralBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => Alert.alert('Referral', 'Share your referral code JONAS100 with friends to earn 100 points each!')}
              >
                <Ionicons name="share-social" size={16} color="#FFF" />
                <Text style={styles.referralBtnText}>Share Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ──────────────── 11. REWARDS ANALYTICS ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Your Contribution</Text>
          </View>
          <View style={[styles.analyticsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.analyticsGrid}>
              {CONTRIBUTION_STATS.map((stat, i) => (
                <View key={i} style={styles.analyticsItem}>
                  <Text style={styles.analyticsIcon}>{stat.icon}</Text>
                  <Text style={[styles.analyticsVal, { color: colors.text }]}>{stat.value}</Text>
                  <Text style={[styles.analyticsLbl, { color: colors.textMuted }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.analyticsFooter, { borderTopColor: colors.border }]}>
              <Ionicons name="eye" size={16} color={colors.textMuted} />
              <Text style={[styles.analyticsFooterText, { color: colors.textSub }]}>
                Total Views Generated: <Text style={[styles.analyticsBold, { color: colors.primary }]}>12,500</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGlow: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.3,
    transform: [{ scale: 1.5 }],
  },
  scrollContent: { paddingHorizontal: SPACING.xl },

  // ── Header ──
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  headerEmoji: { fontSize: 24 },
  headerLabel: { fontSize: 16, fontWeight: '700' },
  balanceNumber: { fontSize: 48, fontWeight: '900', letterSpacing: -2, marginBottom: SPACING.xs },
  balanceValue: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.md },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  trophyEmoji: { fontSize: 20 },
  levelText: { fontSize: 16, fontWeight: '800' },
  levelMetaRow: { marginBottom: SPACING.md },
  levelSub: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 3, width: '100%', maxWidth: 240 },
  progressFill: { height: 6, borderRadius: 3 },

  // ── Points Summary ──
  summaryRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 20, fontWeight: '900' },
  summaryLbl: { fontSize: 11, fontWeight: '600', marginTop: SPACING.xs },
  summaryDivider: { width: 1, marginVertical: SPACING.xs },

  // ── Section ──
  section: { marginBottom: SPACING.xxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  viewAll: { fontSize: 13, fontWeight: '700' },

  // ── Earn Tasks ──
  tasksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  taskCard: {
    width: '47%',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  taskIconWrap: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  taskIcon: { fontSize: 22 },
  taskLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  taskPoints: { fontSize: 16, fontWeight: '900' },
  startBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  startBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  // ── Daily Challenges ──
  challengeCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  challengeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  challengeTask: { fontSize: 14, fontWeight: '700' },
  challengeReward: { fontSize: 12, fontWeight: '800' },
  challengeProgressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  challengeTrack: { flex: 1, height: 6, borderRadius: 3 },
  challengeFill: { height: 6, borderRadius: 3 },
  challengePct: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },

  // ── Redeem Rewards ──
  redeemRow: { gap: SPACING.md, paddingBottom: SPACING.xs },
  redeemCard: {
    width: 190,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  redeemLocked: { opacity: 0.6 },
  redeemIcon: { fontSize: 36, textAlign: 'center', marginBottom: SPACING.xs },
  redeemLabel: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  redeemValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  redeemDesc: { fontSize: 11, fontWeight: '500', textAlign: 'center', lineHeight: 16 },
  redeemPoints: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  redeemBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  redeemBtnText: { fontSize: 12, fontWeight: '800' },

  // ── Leaderboard ──
  leaderboardCard: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  leaderRank: { width: 32 },
  medalIcon: { fontSize: 20 },
  leaderAvatar: { fontSize: 24 },
  leaderName: { flex: 1, fontSize: 15, fontWeight: '700' },
  leaderPoints: { fontSize: 15, fontWeight: '900' },
  leaderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  leaderPosition: { fontSize: 12, fontWeight: '600' },

  // ── Achievements ──
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  achCard: {
    width: '30%',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  achIcon: { fontSize: 28 },
  achLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  achCheck: { fontSize: 14, fontWeight: '900', position: 'absolute', top: 8, right: 8 },

  // ── Activity ──
  activityCard: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  activityIconWrap: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  activityIcon: { fontSize: 16 },
  activityInfo: { flex: 1 },
  activityLabel: { fontSize: 13, fontWeight: '700' },
  activityTime: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  activityPoints: { fontSize: 14, fontWeight: '800' },

  // ── Monthly Event ──
  monthlyCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  monthlyHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  monthlyEmoji: { fontSize: 28 },
  monthlyTitle: { fontSize: 18, fontWeight: '800' },
  monthlySub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  monthlyPrizes: { flexDirection: 'row', gap: SPACING.md, marginVertical: SPACING.sm },
  monthlyPrize: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: SPACING.xs,
    width: 100,
  },
  monthlyPrizeIcon: { fontSize: 24 },
  monthlyPrizeLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  monthlyBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
  },
  monthlyBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // ── Referral ──
  referralCard: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.xl },
  referralContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.lg },
  referralInfo: { flex: 1 },
  referralTitle: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.xs },
  referralSub: { fontSize: 13, fontWeight: '500' },
  referralCode: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  referralActions: { alignItems: 'center' },
  referralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  referralBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // ── Analytics ──
  analyticsCard: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  analyticsItem: { width: '45%', alignItems: 'center', gap: SPACING.xs },
  analyticsIcon: { fontSize: 24 },
  analyticsVal: { fontSize: 22, fontWeight: '900' },
  analyticsLbl: { fontSize: 11, fontWeight: '600' },
  analyticsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  analyticsFooterText: { fontSize: 12, fontWeight: '600' },
  analyticsBold: { fontSize: 13, fontWeight: '800' },
});
