import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

const LEADERBOARD_DATA = {
  topExplorers: [
    { rank: 1, name: 'Hana K.', points: 12500, level: 12, avatar: '👩', badges: 8 },
    { rank: 2, name: 'Dawit T.', points: 11900, level: 11, avatar: '👨', badges: 7 },
    { rank: 3, name: 'Jonas A.', points: 10400, level: 10, avatar: '🧑', badges: 6 },
    { rank: 4, name: 'Meron K.', points: 9800, level: 10, avatar: '👩', badges: 6 },
    { rank: 5, name: 'Abebe B.', points: 9200, level: 9, avatar: '👨', badges: 5 },
    { rank: 6, name: 'Sarah M.', points: 8700, level: 9, avatar: '👩', badges: 5 },
    { rank: 7, name: 'Tewodros A.', points: 8100, level: 8, avatar: '👨', badges: 4 },
    { rank: 8, name: 'John D.', points: 7600, level: 8, avatar: '👨', badges: 4 },
    { rank: 9, name: 'Selam W.', points: 7200, level: 7, avatar: '👩', badges: 3 },
    { rank: 10, name: 'Henok G.', points: 6800, level: 7, avatar: '👨', badges: 3 },
  ],
  topReviewers: [
    { rank: 1, name: 'Meron K.', count: 150 },
    { rank: 2, name: 'Sarah M.', count: 128 },
    { rank: 3, name: 'Tewodros A.', count: 112 },
  ],
  topPhotographers: [
    { rank: 1, name: 'Hana K.', count: 500 },
    { rank: 2, name: 'Dawit T.', count: 375 },
    { rank: 3, name: 'Jonas A.', count: 290 },
  ],
};

type TabType = 'explorers' | 'reviewers' | 'photographers';

export const LeaderboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('explorers');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const currentData = activeTab === 'explorers'
    ? LEADERBOARD_DATA.topExplorers
    : activeTab === 'reviewers'
    ? LEADERBOARD_DATA.topReviewers
    : LEADERBOARD_DATA.topPhotographers;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.bgGlow, { backgroundColor: colors.goldGlow }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor={colors.card} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>🏆 Leaderboard</Text>
        </View>

        {/* User Position */}
        <View style={[styles.positionCard, { backgroundColor: colors.goldGlow, borderColor: colors.gold + '44' }]}>
          <View style={styles.positionLeft}>
            <Text style={styles.positionIcon}>👤</Text>
            <View>
              <Text style={[styles.positionLabel, { color: colors.text }]}>Your Position</Text>
              <View style={styles.positionPills}>
                <View style={[styles.positionPill, { backgroundColor: colors.card }]}>
                  <Text style={[styles.positionPillText, { color: colors.gold }]}>#42 Addis Ababa</Text>
                </View>
                <View style={[styles.positionPill, { backgroundColor: colors.card }]}>
                  <Text style={[styles.positionPillText, { color: colors.violet }]}>#380 Nationwide</Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={[styles.positionPoints, { color: colors.gold }]}>2,450 pts</Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { id: 'explorers' as TabType, label: '🏆 Explorers' },
            { id: 'reviewers' as TabType, label: '⭐ Reviewers' },
            { id: 'photographers' as TabType, label: '📸 Photographers' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tab, isActive && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.tabText, { color: isActive ? '#FFF' : colors.textSub }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Leaderboard List */}
        <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {currentData.map((entry, i) => {
            const isUser = entry.name === 'Jonas A.' || entry.name === 'Jonas';
            return (
              <View
                key={i}
                style={[
                  styles.listRow,
                  i < currentData.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  isUser && { backgroundColor: colors.primaryGlow },
                ]}
              >
                <View style={styles.listRank}>
                  {i === 0 ? <Text style={styles.medal}>🥇</Text> :
                   i === 1 ? <Text style={styles.medal}>🥈</Text> :
                   i === 2 ? <Text style={styles.medal}>🥉</Text> :
                   <Text style={[styles.rankNum, { color: colors.textMuted }]}>{entry.rank}</Text>}
                </View>
                <Text style={styles.listAvatar}>
                  {'avatar' in entry ? entry.avatar : '👤'}
                </Text>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: isUser ? colors.primary : colors.text }]}>
                    {entry.name}
                  </Text>
                  {'level' in entry ? (
                    <Text style={[styles.listDetail, { color: colors.textMuted }]}>
                      Level {entry.level} · {entry.badges} badges
                    </Text>
                  ) : (
                    <Text style={[styles.listDetail, { color: colors.textMuted }]}>
                      {'count' in entry ? `${entry.count} contributions` : ''}
                    </Text>
                  )}
                </View>
                <Text style={[styles.listPoints, { color: colors.gold }]}>
                  {'points' in entry ? entry.points.toLocaleString() : `${entry.count}`}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGlow: { position: 'absolute', top: -60, left: -60, width: 180, height: 180, borderRadius: 90, opacity: 0.3, transform: [{ scale: 1.5 }] },
  content: { paddingHorizontal: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xxl },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  positionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.xxl },
  positionLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  positionIcon: { fontSize: 32 },
  positionLabel: { fontSize: 14, fontWeight: '700', marginBottom: SPACING.xs },
  positionPills: { flexDirection: 'row', gap: SPACING.sm },
  positionPill: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 2 },
  positionPillText: { fontSize: 10, fontWeight: '700' },
  positionPoints: { fontSize: 18, fontWeight: '900' },
  tabs: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: SPACING.xs, borderWidth: 1, marginBottom: SPACING.xxl },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center', borderRadius: RADIUS.md },
  tabText: { fontSize: 12, fontWeight: '700' },
  listCard: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  listRank: { width: 32 },
  medal: { fontSize: 20 },
  rankNum: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  listAvatar: { fontSize: 24 },
  listInfo: { flex: 1, gap: 2 },
  listName: { fontSize: 14, fontWeight: '700' },
  listDetail: { fontSize: 11, fontWeight: '500' },
  listPoints: { fontSize: 14, fontWeight: '800' },
});
