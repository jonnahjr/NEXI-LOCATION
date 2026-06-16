import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

// ── Collections ──────────────────────────────────────────────────────────
const DEFAULT_COLLECTIONS = [
  { id: 'fav', icon: '⭐', name: 'Favorites', count: 4 },
  { id: 'wish', icon: '🔖', name: 'Want To Visit', count: 0 },
  { id: 'food', icon: '🍽️', name: 'Food Spots', count: 0 },
  { id: 'coffee', icon: '☕', name: 'Coffee Shops', count: 0 },
  { id: 'hotels', icon: '🏨', name: 'Hotels', count: 0 },
  { id: 'trips', icon: '🌴', name: 'Weekend Trips', count: 0 },
];

// ── Want To Visit suggestions ────────────────────────────────────────────
const WANT_TO_VISIT = [
  { id: 'w1', name: 'Kuriftu Resort', category: 'Resort', icon: '🏖️' },
  { id: 'w2', name: 'Unity Park', category: 'Attraction', icon: '🌳' },
  { id: 'w3', name: 'Tomoca Coffee', category: 'Coffee Shop', icon: '☕' },
  { id: 'w4', name: 'Addis Museum', category: 'Museum', icon: '🏛️' },
];

// ── Smart Suggestions ────────────────────────────────────────────────────
const SUGGESTED_PLACES = [
  { id: 's1', name: "Kaldi's Coffee", category: 'Coffee Shop', rating: 4.2, image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200' },
  { id: 's2', name: 'Garden of Coffee', category: 'Specialty Coffee', rating: 4.8, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200' },
  { id: 's3', name: 'Tomoca Piazza', category: 'Coffee Shop', rating: 4.6, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200' },
];

export const SavedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { businesses, savedPlaces, toggleSavedPlace } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const savedBusinesses = useMemo(
    () => businesses.filter((b) => savedPlaces.includes(b.id)),
    [businesses, savedPlaces],
  );

  const recentlySaved = useMemo(
    () => savedBusinesses.slice(0, 4),
    [savedBusinesses],
  );

  const totalSaved = savedPlaces.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background glow */}
      <View style={[styles.bgGlow, { backgroundColor: colors.primaryGlow }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
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
        {/* ════════════════════════════════════════════════════════════════
            HEADER
           ════════════════════════════════════════════════════════════════ */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.lg, paddingBottom: SPACING.lg }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>❤️ Saved Places</Text>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="settings-outline" size={18} color={colors.textSub} />
            </TouchableOpacity>
          </View>
          {totalSaved > 0 ? (
            <Text style={[styles.headerSub, { color: colors.textSub }]}>
              {totalSaved} Saved Place{totalSaved !== 1 ? 's' : ''}
            </Text>
          ) : null}

          {/* Top Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => router.push('/search')}
              style={[styles.actionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="search" size={14} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textSub }]}>Search Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="share-outline" size={14} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textSub }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              style={[styles.actionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list'} size={14} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textSub }]}>
                {viewMode === 'list' ? 'Map' : 'List'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {totalSaved === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.violetGlow }]}>
              <Ionicons name="heart-outline" size={40} color={colors.violet} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>❤️ No Saved Places Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Save places to build your personal collection
            </Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity
                onPress={() => router.push('/')}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="compass-outline" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>Explore Places</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/search')}
                style={[styles.emptyBtnOutline, { borderColor: colors.primary }]}
              >
                <Ionicons name="map-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>Open Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.collectionsSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Collections</Text>
                <TouchableOpacity onPress={() => Alert.alert('New Collection', 'Create custom collections to organize your saved places.')} style={[styles.newCollectionBtn, { backgroundColor: colors.primaryGlow }]}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={[styles.newCollectionText, { color: colors.primary }]}>New</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionsRow}>
                {DEFAULT_COLLECTIONS.map((col) => (
                  <TouchableOpacity
                    key={col.id}
                    style={[styles.collectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.collectionIcon}>{col.icon}</Text>
                    <Text style={[styles.collectionName, { color: colors.text }]}>{col.name}</Text>
                    <Text style={[styles.collectionCount, { color: colors.textMuted }]}>
                      {col.count} item{col.count !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Saved</Text>
              {recentlySaved.map((biz) => (
                <TouchableOpacity
                  key={biz.id}
                  onPress={() => router.push(`/business/${biz.id}`)}
                  style={[styles.recentItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: biz.image }} style={styles.recentImg} resizeMode="cover" />
                  <View style={styles.recentInfo}>
                    <View style={styles.recentTop}>
                      <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={1}>{biz.name}</Text>
                      {biz.verified && <Ionicons name="checkmark-circle" size={14} color={colors.accent} />}
                    </View>
                    <View style={styles.recentRating}>
                      <Ionicons name="star" size={12} color={colors.gold} />
                      <Text style={[styles.recentScore, { color: colors.text }]}>{biz.rating.toFixed(1)}</Text>
                      <Text style={[styles.recentDist, { color: colors.textMuted }]}> • {biz.distance}</Text>
                    </View>
                    {biz.hours?.includes('24') || biz.hours?.includes('AM') ? (
                      <View style={[styles.openBadgeSm, { backgroundColor: colors.accentGlow }]}>
                        <View style={[styles.openDotSm, { backgroundColor: colors.accent }]} />
                        <Text style={[styles.openTextSm, { color: colors.accent }]}>Open now</Text>
                      </View>
                    ) : null}
                    <Text style={[styles.savedTime, { color: colors.textMuted }]}>
                      Saved recently
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleSavedPlace(biz.id)}
                    style={styles.recentRemove}
                  >
                    <Ionicons name="heart" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>

            {viewMode === 'map' && (
              <View style={[styles.mapPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.mapGrid}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <View key={i} style={[styles.mapLineH, { backgroundColor: colors.primaryGlow, top: `${((i + 1) / 9) * 100}%` }]} />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View key={i} style={[styles.mapLineV, { backgroundColor: colors.primaryGlow, left: `${((i + 1) / 7) * 100}%` }]} />
                  ))}
                </View>
                <Ionicons name="map" size={36} color={colors.textMuted} />
                <Text style={[styles.mapText, { color: colors.textSub }]}>{totalSaved} saved places</Text>
              </View>
            )}

            {viewMode === 'list' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>All Saved Places</Text>
                {savedBusinesses.map((biz) => (
                  <View key={biz.id} style={[styles.savedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity
                      onPress={() => router.push(`/business/${biz.id}`)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.savedCardInner}>
                        <Image source={{ uri: biz.image }} style={styles.savedImg} resizeMode="cover" />
                        <View style={styles.savedInfo}>
                          <View style={styles.savedTop}>
                            <Text style={[styles.savedName, { color: colors.text }]} numberOfLines={1}>{biz.name}</Text>
                            {biz.verified && <Ionicons name="checkmark-circle" size={14} color={colors.accent} />}
                          </View>
                          <View style={styles.savedRating}>
                            <Ionicons name="star" size={11} color={colors.gold} />
                            <Text style={[styles.savedScore, { color: colors.text }]}>{biz.rating.toFixed(1)}</Text>
                            <Text style={[styles.savedDot, { color: colors.textMuted }]}> • </Text>
                            <Ionicons name="location" size={11} color={colors.textMuted} />
                            <Text style={[styles.savedDist, { color: colors.textMuted }]}>{biz.distance}</Text>
                          </View>
                          {biz.hours?.includes('24') || biz.hours?.includes('AM') ? (
                            <View style={[styles.openBadgeSm, { backgroundColor: colors.accentGlow }]}>
                              <View style={[styles.openDotSm, { backgroundColor: colors.accent }]} />
                              <Text style={[styles.openTextSm, { color: colors.accent }]}>Open now</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View style={[styles.savedActions, { borderTopColor: colors.border }]}>
                      <TouchableOpacity style={styles.savedActionBtn}>
                        <Ionicons name="navigate-outline" size={15} color={colors.primary} />
                        <Text style={[styles.savedActionText, { color: colors.primary }]}>Directions</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.savedActionBtn}>
                        <Ionicons name="share-outline" size={15} color={colors.accent} />
                        <Text style={[styles.savedActionText, { color: colors.accent }]}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => toggleSavedPlace(biz.id)}
                        style={styles.savedActionBtn}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.danger} />
                        <Text style={[styles.savedActionText, { color: colors.danger }]}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🔖 Want To Visit</Text>
                <TouchableOpacity>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wishScroll}>
                {WANT_TO_VISIT.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.wishCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.wishIcon}>{item.icon}</Text>
                    <Text style={[styles.wishName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.wishCat, { color: colors.textMuted }]}>{item.category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.visitedCard, { backgroundColor: colors.accentGlow, borderColor: colors.accent + '33' }]}>
              <View style={styles.visitedHeader}>
                <Text style={styles.visitedIcon}>✅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.visitedTitle, { color: colors.text }]}>Visited Places</Text>
                  <Text style={[styles.visitedSub, { color: colors.textSub }]}>
                    Review and earn +20 points each
                  </Text>
                </View>
              </View>
              <View style={styles.visitedActions}>
                {savedBusinesses.slice(0, 3).map((biz) => (
                  <TouchableOpacity
                    key={biz.id}
                    style={[styles.visitedBiz, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: biz.image }} style={styles.visitedBizImg} resizeMode="cover" />
                    <View style={styles.visitedBizInfo}>
                      <Text style={[styles.visitedBizName, { color: colors.text }]} numberOfLines={1}>{biz.name}</Text>
                      <View style={styles.visitedBizActions}>
                        <TouchableOpacity style={[styles.visitedBizBtn, { backgroundColor: colors.primaryGlow }]}>
                          <Ionicons name="star-outline" size={12} color={colors.primary} />
                          <Text style={[styles.visitedBizBtnText, { color: colors.primary }]}>Review</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.visitedBizBtn, { backgroundColor: colors.violetGlow }]}>
                          <Ionicons name="camera-outline" size={12} color={colors.violet} />
                          <Text style={[styles.visitedBizBtnText, { color: colors.violet }]}>Photo</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.offlineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.offlineContent}>
                <View style={styles.offlineLeft}>
                  <View style={[styles.offlineIconWrap, { backgroundColor: colors.primaryGlow }]}>
                    <Ionicons name="cloud-download-outline" size={24} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.offlineTitle, { color: colors.text }]}>📶 Available Offline</Text>
                    <Text style={[styles.offlineSub, { color: colors.textMuted }]}>
                      Business info, address, phone & maps
                    </Text>
                  </View>
                </View>
                <Text style={[styles.offlineStatus, { color: colors.accent }]}>Active</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>You May Also Like</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Because you saved coffee shops
              </Text>
              <View style={styles.suggestGrid}>
                {SUGGESTED_PLACES.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    onPress={() => router.push('/search')}
                    style={[styles.suggestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: place.image }} style={styles.suggestImg} resizeMode="cover" />
                    <View style={styles.suggestInfo}>
                      <Text style={[styles.suggestName, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
                      <Text style={[styles.suggestCat, { color: colors.textMuted }]}>{place.category}</Text>
                      <View style={styles.suggestRating}>
                        <Ionicons name="star" size={11} color={colors.gold} />
                        <Text style={[styles.suggestScore, { color: colors.textSub }]}>{place.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.aiCard, { backgroundColor: colors.violetGlow, borderColor: colors.violet + '33' }]}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={20} color={colors.violet} />
                <Text style={[styles.aiTitle, { color: colors.text }]}>AI Collections</Text>
                <View style={[styles.aiBadge, { backgroundColor: colors.violet }]}>
                  <Text style={styles.aiBadgeText}>Phase 2</Text>
                </View>
              </View>
              <Text style={[styles.aiDesc, { color: colors.textSub }]}>
                Collections generated automatically — Best Coffee Shops, Weekend Destinations, Romantic Restaurants, and more.
              </Text>
              <View style={styles.aiExamplesRow}>
                {['☕ Best Coffee', '🌴 Weekend Trips', '🍝 Romantic', '💰 Budget'].map((ex, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.aiExampleChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.aiExampleText, { color: colors.textSub }]}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGlow: {
    position: 'absolute', top: -100, right: -80,
    width: 250, height: 250, borderRadius: 125, opacity: 0.3,
    transform: [{ scale: 2 }],
  },

  // ── Header ───────────────────────────────────────────────────────────
  header: { paddingHorizontal: SPACING.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 4, marginBottom: SPACING.md },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderWidth: 1,
  },
  actionText: { fontSize: 12, fontWeight: '600' },

  // ── Empty State ──────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: SPACING.huge + SPACING.xxl, paddingHorizontal: SPACING.xl },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: SPACING.sm },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: SPACING.xxl },
  emptyActions: { gap: SPACING.md },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md },
  emptyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  emptyBtnOutline: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, borderWidth: 1.5 },

  // ── Section Common ──────────────────────────────────────────────────
  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: SPACING.md },
  sectionSub: { fontSize: 12, fontWeight: '500', marginTop: -SPACING.sm, marginBottom: SPACING.md },
  seeAllText: { fontSize: 13, fontWeight: '700' },

  // ── Collections ──────────────────────────────────────────────────────
  collectionsSection: { marginBottom: SPACING.xl, paddingLeft: SPACING.xl },
  newCollectionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  newCollectionText: { fontSize: 12, fontWeight: '700' },
  collectionsRow: { gap: SPACING.md, paddingRight: SPACING.xl },
  collectionCard: {
    width: 130, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, gap: 4,
  },
  collectionIcon: { fontSize: 24 },
  collectionName: { fontSize: 13, fontWeight: '700' },
  collectionCount: { fontSize: 11, fontWeight: '500' },

  // ── Recently Saved ───────────────────────────────────────────────────
  recentItem: {
    flexDirection: 'row', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, marginBottom: SPACING.sm, gap: SPACING.md,
  },
  recentImg: { width: 56, height: 56, borderRadius: RADIUS.sm },
  recentInfo: { flex: 1, gap: 2 },
  recentTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentName: { fontSize: 14, fontWeight: '700', flex: 1 },
  recentRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  recentScore: { fontSize: 12, fontWeight: '700' },
  recentDist: { fontSize: 11, fontWeight: '500' },
  openBadgeSm: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, alignSelf: 'flex-start' },
  openDotSm: { width: 5, height: 5, borderRadius: 2.5 },
  openTextSm: { fontSize: 10, fontWeight: '700' },
  savedTime: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  recentRemove: { justifyContent: 'center', paddingLeft: 4 },

  // ── Map View ─────────────────────────────────────────────────────────
  mapPreview: {
    marginHorizontal: SPACING.xl, borderRadius: RADIUS.xl, height: 200,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative', marginBottom: SPACING.xl,
  },
  mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mapLineH: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.4 },
  mapLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, opacity: 0.4 },
  mapText: { fontSize: 16, fontWeight: '700', marginTop: SPACING.sm },

  // ── Saved Card ───────────────────────────────────────────────────────
  savedCard: { borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.md, overflow: 'hidden', marginHorizontal: SPACING.xl },
  savedCardInner: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.md },
  savedImg: { width: 72, height: 72, borderRadius: RADIUS.md },
  savedInfo: { flex: 1, gap: 3 },
  savedTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savedName: { fontSize: 15, fontWeight: '700', flex: 1 },
  savedRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  savedScore: { fontSize: 12, fontWeight: '700' },
  savedDot: { fontSize: 12 },
  savedDist: { fontSize: 11, fontWeight: '500' },
  savedActions: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  savedActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  savedActionText: { fontSize: 11, fontWeight: '700' },

  // ── Want To Visit ────────────────────────────────────────────────────
  wishScroll: { gap: SPACING.md, paddingHorizontal: SPACING.xl },
  wishCard: {
    width: 130, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, gap: 4,
  },
  wishIcon: { fontSize: 24 },
  wishName: { fontSize: 13, fontWeight: '700' },
  wishCat: { fontSize: 11, fontWeight: '500' },

  // ── Visited Places ───────────────────────────────────────────────────
  visitedCard: { marginHorizontal: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.xl },
  visitedHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  visitedIcon: { fontSize: 28 },
  visitedTitle: { fontSize: 15, fontWeight: '700' },
  visitedSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  visitedActions: { gap: SPACING.sm },
  visitedBiz: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' },
  visitedBizImg: { width: 40, height: 40, borderRadius: 8 },
  visitedBizInfo: { flex: 1, gap: 4 },
  visitedBizName: { fontSize: 13, fontWeight: '700' },
  visitedBizActions: { flexDirection: 'row', gap: SPACING.sm },
  visitedBizBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  visitedBizBtnText: { fontSize: 10, fontWeight: '700' },

  // ── Offline ─────────────────────────────────────────────────────────
  offlineCard: { marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, marginBottom: SPACING.xl },
  offlineContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offlineLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  offlineIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  offlineTitle: { fontSize: 14, fontWeight: '700' },
  offlineSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  offlineStatus: { fontSize: 12, fontWeight: '700' },

  // ── Smart Suggestions ───────────────────────────────────────────────
  suggestGrid: { flexDirection: 'row', gap: SPACING.md },
  suggestCard: {
    flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1,
  },
  suggestImg: { width: '100%', height: 80 },
  suggestInfo: { padding: SPACING.sm, gap: 2 },
  suggestName: { fontSize: 12, fontWeight: '700' },
  suggestCat: { fontSize: 10, fontWeight: '500' },
  suggestRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  suggestScore: { fontSize: 11, fontWeight: '700' },

  // ── AI Collections ──────────────────────────────────────────────────
  aiCard: { marginHorizontal: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.xl },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  aiTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  aiBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2 },
  aiBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  aiDesc: { fontSize: 13, fontWeight: '500', lineHeight: 19, marginBottom: SPACING.md },
  aiExamplesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  aiExampleChip: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderWidth: 1 },
  aiExampleText: { fontSize: 12, fontWeight: '600' },
});
