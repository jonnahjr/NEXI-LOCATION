import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

const CATEGORY_META: Record<string, { icon: string; header: string; desc: string }> = {
  food: { icon: '🍽️', header: 'Restaurants', desc: 'Best places to eat in Addis Ababa' },
  cafe: { icon: '☕', header: 'Cafes & Coffee', desc: 'Coffee shops and cafes near you' },
  hotel: { icon: '🏨', header: 'Hotels', desc: 'Accommodation and lodging options' },
  health: { icon: '🏥', header: 'Health', desc: 'Hospitals, clinics, and pharmacies' },
  shop: { icon: '🛍️', header: 'Shopping', desc: 'Malls, markets, and stores' },
  edu: { icon: '🏫', header: 'Education', desc: 'Schools, universities, and colleges' },
  fuel: { icon: '⛽', header: 'Fuel Stations', desc: 'Gas stations and fuel services' },
  finance: { icon: '🏦', header: 'Banks & Finance', desc: 'Banks, ATMs, and financial services' },
  gym: { icon: '🏋️', header: 'Fitness', desc: 'Gyms, fitness centers, and studios' },
  club: { icon: '🎵', header: 'Nightlife', desc: 'Clubs, lounges, and live music' },
};

const SORT_OPTIONS = [
  { id: 'top', icon: '⭐', label: 'Top Rated' },
  { id: 'nearby', icon: '📍', label: 'Nearby' },
  { id: 'open', icon: '🟢', label: 'Open Now' },
  { id: 'trending', icon: '🔥', label: 'Trending' },
];

export const CategoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { businesses } = useAppStore();
  const [activeSort, setActiveSort] = React.useState('top');
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const meta = id ? CATEGORY_META[id] : null;

  const sortedBusinesses = useMemo(() => {
    let results = businesses.filter((b) => b.categoryId === id);
    switch (activeSort) {
      case 'top':
        results = [...results].sort((a, b) => b.rating - a.rating);
        break;
      case 'nearby':
        results = [...results].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        break;
      case 'open':
        results = results.filter((b) => b.hours?.includes('24') || b.hours?.includes('AM'));
        break;
      case 'trending':
        results = [...results].sort((a, b) => b.reviews - a.reviews);
        break;
    }
    return results;
  }, [businesses, id, activeSort]);

  if (!meta) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted, fontSize: 16 }}>Category not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerIcon}>{meta.icon}</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{meta.header}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor={colors.card} />}
      >
        <Text style={[styles.headerDesc, { color: colors.textSub }]}>{meta.desc}</Text>

        {/* Sort Options */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => {
            const isActive = activeSort === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setActiveSort(opt.id)}
                style={[styles.sortChip, { backgroundColor: isActive ? colors.primary : colors.card, borderColor: isActive ? colors.primary : colors.border }]}
              >
                <Text style={styles.sortIcon}>{opt.icon}</Text>
                <Text style={[styles.sortLabel, { color: isActive ? '#FFF' : colors.textSub }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
          {sortedBusinesses.length} {sortedBusinesses.length === 1 ? 'place' : 'places'}
        </Text>

        {/* Business List */}
        {sortedBusinesses.map((biz) => (
          <TouchableOpacity
            key={biz.id}
            onPress={() => router.push(`/business/${biz.id}`)}
            style={[styles.bizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.85}
          >
            <Image source={{ uri: biz.image }} style={styles.bizImg} resizeMode="cover" />
            <View style={styles.bizInfo}>
              <View style={styles.bizTop}>
                <Text style={[styles.bizName, { color: colors.text }]} numberOfLines={1}>{biz.name}</Text>
                {biz.verified && <Ionicons name="checkmark-circle" size={14} color={colors.accent} />}
              </View>
              <Text style={[styles.bizCategory, { color: colors.textMuted }]}>{biz.category}</Text>
              <View style={styles.bizMeta}>
                <Ionicons name="star" size={11} color={colors.gold} />
                <Text style={[styles.bizRating, { color: colors.text }]}>{biz.rating.toFixed(1)}</Text>
                <Text style={[styles.bizReviews, { color: colors.textMuted }]}> ({biz.reviews})</Text>
                <Text style={[styles.bizDot, { color: colors.textMuted }]}> · </Text>
                <Ionicons name="location" size={11} color={colors.textMuted} />
                <Text style={[styles.bizDist, { color: colors.textMuted }]}>{biz.distance}</Text>
              </View>
              {biz.hours?.includes('24') || biz.hours?.includes('AM') ? (
                <View style={[styles.openBadge, { backgroundColor: colors.accentGlow }]}>
                  <View style={[styles.openDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.openText, { color: colors.accent }]}>Open now</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerIcon: { fontSize: 24 },
  headerTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  headerDesc: { fontSize: 13, fontWeight: '500', paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  content: { paddingHorizontal: SPACING.xl },
  sortRow: { gap: SPACING.sm, marginBottom: SPACING.lg },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderWidth: 1 },
  sortIcon: { fontSize: 14 },
  sortLabel: { fontSize: 12, fontWeight: '700' },
  resultsCount: { fontSize: 12, fontWeight: '600', marginBottom: SPACING.md },
  bizCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, marginBottom: SPACING.sm },
  bizImg: { width: 64, height: 64, borderRadius: RADIUS.md },
  bizInfo: { flex: 1, gap: 2 },
  bizTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bizName: { fontSize: 14, fontWeight: '700', flex: 1 },
  bizCategory: { fontSize: 11, fontWeight: '500' },
  bizMeta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bizRating: { fontSize: 12, fontWeight: '700' },
  bizReviews: { fontSize: 11, fontWeight: '500' },
  bizDot: { fontSize: 12 },
  bizDist: { fontSize: 11, fontWeight: '500' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 },
  openDot: { width: 5, height: 5, borderRadius: 2.5 },
  openText: { fontSize: 10, fontWeight: '700' },
});
