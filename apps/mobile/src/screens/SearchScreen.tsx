import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  RefreshControl,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../components/Card';
import { BusinessCard } from '../components/BusinessCard';
import { Button } from '../components/Button';
import { useAppStore, Business } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';



// ── Search Categories (user-specified) ───────────────────────────────────
const SEARCH_CATEGORIES: { icon: string; name: string; categoryId: string }[] = [
  { icon: '🍽️', name: 'Restaurants', categoryId: 'food' },
  { icon: '☕', name: 'Cafes', categoryId: 'cafe' },
  { icon: '🏨', name: 'Hotels', categoryId: 'hotel' },
  { icon: '🏥', name: 'Clinics', categoryId: 'health' },
  { icon: '💊', name: 'Pharmacies', categoryId: 'health' },
  { icon: '🏦', name: 'Banks', categoryId: 'finance' },
  { icon: '⛽', name: 'Fuel Stations', categoryId: 'fuel' },
  { icon: '🛍️', name: 'Shopping', categoryId: 'shop' },
  { icon: '🏫', name: 'Schools', categoryId: 'edu' },
];

// ── Example Search Suggestions ───────────────────────────────────────────
const EXAMPLE_SEARCHES = [
  'Coffee in Bole',
  'Hotels near Airport',
  'Pharmacy near me',
  'Traditional Ethiopian food',
  'Best breakfast in Addis',
];

// ── Trending Searches ────────────────────────────────────────────────────
const TRENDING_SEARCHES = [
  { label: 'Best Coffee Shops', icon: '☕' },
  { label: 'Top Restaurants', icon: '🍽️' },
  { label: 'Family Hotels', icon: '🏨' },
  { label: 'Popular Attractions', icon: '🎯' },
  { label: 'Weekend Destinations', icon: '🌴' },
];

// ── Filter Options ───────────────────────────────────────────────────────
type FilterKey = 'distance' | 'rating' | 'openNow' | 'verifiedOnly';
interface FilterState {
  distance: boolean;
  rating: boolean;
  openNow: boolean;
  verifiedOnly: boolean;
}

// ── Result Tabs ──────────────────────────────────────────────────────────
const RESULT_TABS = ['All', 'Places', 'Restaurants', 'Hotels', 'Services', 'Photos'];

// ── Skeleton Card ────────────────────────────────────────────────────────
const SkeletonCard: React.FC<{ colors: ReturnType<typeof useTheme>['colors'] }> = ({ colors }) => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <View style={{ marginBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
        <Animated.View style={{ width: 80, height: 80, borderRadius: RADIUS.md, backgroundColor: colors.cardElevated, opacity: shimmerAnim }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Animated.View style={{ width: '70%', height: 14, borderRadius: 4, backgroundColor: colors.cardElevated, opacity: shimmerAnim }} />
          <Animated.View style={{ width: '45%', height: 11, borderRadius: 4, backgroundColor: colors.cardElevated, opacity: shimmerAnim }} />
          <Animated.View style={{ width: '30%', height: 11, borderRadius: 4, backgroundColor: colors.cardElevated, opacity: shimmerAnim }} />
        </View>
      </View>
    </View>
  );
};

export const SearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { searchQuery, setSearchQuery, searchCategoryFilter, setSearchCategoryFilter, businesses, savedPlaces, toggleSavedPlace } = useAppStore();
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Coffee in Bole',
    'Hotels near Airport',
    'Traditional Food',
    'Open Pharmacy',
  ]);
  const [activeResultTab, setActiveResultTab] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState<FilterState>({ distance: false, rating: false, openNow: false, verifiedOnly: false });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  // ── Filtered Results ────────────────────────────────────────────────────
  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const categoryFilter = searchCategoryFilter;

    let results = businesses;

    if (categoryFilter) {
      results = results.filter((biz) => biz.categoryId === categoryFilter);
    }

    if (query) {
      results = results.filter(
        (biz) =>
          biz.name.toLowerCase().includes(query) ||
          biz.category.toLowerCase().includes(query) ||
          biz.address?.toLowerCase().includes(query),
      );
    }

    // Apply filters
    if (filters.openNow) {
      results = results.filter((b) => b.hours === '24 hours' || (b.hours?.includes('AM') && b.hours?.includes('PM')) || false);
    }
    if (filters.verifiedOnly) {
      results = results.filter((b) => b.verified);
    }
    if (filters.rating) {
      results = [...results].sort((a, b) => b.rating - a.rating);
    }
    if (filters.distance) {
      results = [...results].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }

    return results;
  }, [searchQuery, searchCategoryFilter, filters, businesses]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (query: string) => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

      const category = SEARCH_CATEGORIES.find((c) => c.name === query);
      if (category) {
        // Special case: Pharmacies set searchQuery='pharmacy' (store clears categoryFilter)
        if (category.categoryId === 'health' && category.name === 'Pharmacies') {
          setSearchQuery('pharmacy');
        } else {
          setSearchCategoryFilter(category.categoryId);
        }
        setLoading(true);
        loadingTimeoutRef.current = setTimeout(() => setLoading(false), 300);
        return;
      }

      setSearchQuery(query);
      setLoading(true);
      loadingTimeoutRef.current = setTimeout(() => setLoading(false), 300);

      if (query.trim() && !recentSearches.includes(query.trim())) {
        setRecentSearches((prev) => [query.trim(), ...prev.slice(0, 4)]);
      }
    },
    [setSearchQuery, setSearchCategoryFilter, recentSearches],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchCategoryFilter('');
    setFilters({ distance: false, rating: false, openNow: false, verifiedOnly: false });
    inputRef.current?.focus();
  }, [setSearchQuery, setSearchCategoryFilter]);

  const toggleFilter = useCallback((key: FilterKey) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const hasQuery = searchQuery.trim().length > 0 || searchCategoryFilter.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ════════════════════════════════════════════════════════════════
          SEARCH BAR (Always Fixed at Top)
         ════════════════════════════════════════════════════════════════ */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg, backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search places, restaurants, hotels..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              if (!text) {
                setSearchCategoryFilter('');
                setFilters({ distance: false, rating: false, openNow: false, verifiedOnly: false });
              }
              handleSearch(text);
            }}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {hasQuery && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {!hasQuery && (
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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
        {!hasQuery ? (
          // ════════════════════════════════════════════════════════════════
          // EMPTY STATE — Show examples, recent, trending, categories
          // ════════════════════════════════════════════════════════════════
          <View>
            {/* Example Search Chips */}
            <View style={styles.section}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examplesRow}>
                {EXAMPLE_SEARCHES.map((ex, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSearch(ex)}
                    style={[styles.exampleChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  >
                    <Text style={[styles.exampleText, { color: colors.textSub }]}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Recent Searches */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text style={[styles.clearLink, { color: colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSearch(search)}
                  style={[styles.recentItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.recentIconWrap, { backgroundColor: colors.primaryGlow }]}>
                    <Text style={styles.recentIcon}>
                      {search.toLowerCase().includes('coffee') ? '☕' :
                       search.toLowerCase().includes('hotel') ? '🏨' :
                       search.toLowerCase().includes('food') ? '🍽️' :
                       search.toLowerCase().includes('pharmacy') ? '💊' : '📍'}
                    </Text>
                  </View>
                  <Text style={[styles.recentText, { color: colors.text }]}>{search}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Trending Searches */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Trending Searches</Text>
              <View style={styles.trendGrid}>
                {TRENDING_SEARCHES.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSearch(item.label)}
                    style={[styles.trendItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.trendItemIcon}>{item.icon}</Text>
                    <Text style={[styles.trendItemLabel, { color: colors.textSub }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick Categories */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
              <View style={styles.catGrid}>
                {SEARCH_CATEGORIES.map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSearch(cat.name)}
                    style={[styles.catItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                    <Text style={[styles.catName, { color: colors.textSub }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          // ════════════════════════════════════════════════════════════════
          // RESULTS STATE
          // ════════════════════════════════════════════════════════════════
          <View>
            {/* Result Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
              {RESULT_TABS.map((tab) => {
                const isActive = activeResultTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveResultTab(tab)}
                    style={[styles.tabItem, isActive && { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '44' }]}
                  >
                    <Text style={[styles.tabText, { color: isActive ? colors.primary : colors.textMuted },
                      isActive && { fontWeight: '800' },
                    ]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Filter Chips + View Switcher */}
            {!loading && (
              <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                  {[
                    { key: 'distance' as FilterKey, label: '📍 Distance' },
                    { key: 'rating' as FilterKey, label: '⭐ Rating' },
                    { key: 'openNow' as FilterKey, label: '🟢 Open Now' },
                    { key: 'verifiedOnly' as FilterKey, label: '✓ Verified Only' },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.key}
                      onPress={() => toggleFilter(f.key)}
                      style={[
                        styles.filterChip,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        filters[f.key] && { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '66' },
                      ]}
                    >
                      <Text style={[
                        styles.filterChipText,
                        { color: colors.textSub },
                        filters[f.key] && { color: colors.primary, fontWeight: '700' },
                      ]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* View Switcher */}
                <View style={[styles.viewSwitcher, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => setViewMode('list')}
                    style={[styles.viewBtn, viewMode === 'list' && { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="list" size={16} color={viewMode === 'list' ? '#FFF' : colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setViewMode('map')}
                    style={[styles.viewBtn, viewMode === 'map' && { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="map" size={16} color={viewMode === 'map' ? '#FFF' : colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Results Header */}
            {!loading && (
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: colors.textSub }]}>
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* Loading / Results / Empty */}
            {loading ? (
              <View style={styles.skeletonWrap}>
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} colors={colors} />
                ))}
              </View>
            ) : viewMode === 'list' && filteredResults.length > 0 ? (
              filteredResults.map((business) => (
                <View key={business.id} style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => router.push(`/business/${business.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.resultCardInner}>
                      <Image source={{ uri: business.image }} style={styles.resultImg} resizeMode="cover" />
                      <View style={styles.resultInfo}>
                        <View style={styles.resultTop}>
                          <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
                            {business.name}
                          </Text>
                          {business.verified && (
                            <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                          )}
                        </View>
                        <Text style={[styles.resultCategory, { color: colors.textMuted }]}>{business.category}</Text>
                        <View style={styles.resultMeta}>
                          <View style={styles.resultRating}>
                            <Ionicons name="star" size={12} color={colors.gold} />
                            <Text style={[styles.resultScore, { color: colors.text }]}>{business.rating.toFixed(1)}</Text>
                            <Text style={[styles.resultReviews, { color: colors.textMuted }]}>
                              ({business.reviews})
                            </Text>
                          </View>
                          <Text style={[styles.resultDot, { color: colors.textMuted }]}> • </Text>
                          <Ionicons name="location" size={11} color={colors.textMuted} />
                          <Text style={[styles.resultDist, { color: colors.textMuted }]}>{business.distance}</Text>
                        </View>
                        {business.hours?.includes('24') || business.hours?.includes('AM') ? (
                          <View style={[styles.openBadge, { backgroundColor: colors.accentGlow }]}>
                            <View style={[styles.openDot, { backgroundColor: colors.accent }]} />
                            <Text style={[styles.openText, { color: colors.accent }]}>Open now</Text>
                            <Text style={[styles.openHours, { color: colors.textMuted }]}>
                              {business.hours?.includes('24') ? 'Open 24 hours' : business.hours?.split(',').slice(0, 1).join('')}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Action Buttons */}
                  <View style={[styles.resultActions, { borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>Directions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Ionicons name="call-outline" size={16} color={colors.accent} />
                      <Text style={[styles.actionText, { color: colors.accent }]}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleSavedPlace(business.id)}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name={savedPlaces.includes(business.id) ? 'heart' : 'heart-outline'}
                        size={16}
                        color={savedPlaces.includes(business.id) ? colors.danger : colors.textMuted}
                      />
                      <Text style={[styles.actionText, { color: savedPlaces.includes(business.id) ? colors.danger : colors.textMuted }]}>
                        {savedPlaces.includes(business.id) ? 'Saved' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : viewMode === 'map' ? (
              <View style={[styles.mapPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.mapGrid}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <View key={i} style={[styles.mapGridLineH, { backgroundColor: colors.primaryGlow, top: `${((i + 1) / 13) * 100}%` }]} />
                  ))}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <View key={i} style={[styles.mapGridLineV, { backgroundColor: colors.primaryGlow, left: `${((i + 1) / 9) * 100}%` }]} />
                  ))}
                </View>
                <Ionicons name="map" size={48} color={colors.textMuted} />
                <Text style={[styles.mapPlaceholderText, { color: colors.textSub }]}>Map View</Text>
                <Text style={[styles.mapPlaceholderSub, { color: colors.textMuted }]}>
                  {filteredResults.length} places on map
                </Text>
              </View>
            ) : (
              /* Empty State */
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryGlow }]}>
                  <Ionicons name="search-outline" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Try different keywords or browse categories
                </Text>
                <View style={styles.emptyTips}>
                  {['Different keywords', 'Nearby areas', 'Broader categories'].map((tip, i) => (
                    <View key={i} style={styles.emptyTipRow}>
                      <Text style={{ color: colors.primary }}>• </Text>
                      <Text style={[styles.emptyTipText, { color: colors.textSub }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={clearSearch}
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="add" size={18} color="#FFF" />
                  <Text style={styles.emptyBtnText}>Suggest New Place</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* AI Search Section (Phase 2 Placeholder) */}
            {!loading && filteredResults.length > 0 && (
              <View style={[styles.aiSection, { backgroundColor: colors.violetGlow, borderColor: colors.violet + '33' }]}>
                <View style={styles.aiSectionHeader}>
                  <Ionicons name="sparkles" size={20} color={colors.violet} />
                  <Text style={[styles.aiSectionTitle, { color: colors.text }]}>AI Search</Text>
                  <View style={[styles.aiPhaseBadge, { backgroundColor: colors.violet }]}>
                    <Text style={styles.aiPhaseText}>Phase 2</Text>
                  </View>
                </View>
                <Text style={[styles.aiSectionDesc, { color: colors.textSub }]}>
                  Search naturally — "Quiet coffee shop with WiFi near Bole" — and get smart recommendations.
                </Text>
                <View style={styles.aiExample}>
                  <View style={[styles.aiExampleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.aiExampleTitle, { color: colors.violet }]}>✨ Coming Soon</Text>
                    <Text style={[styles.aiExampleText, { color: colors.textMuted }]}>
                      Type any request and Nexi AI will find the best match
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg, borderBottomWidth: 1,
  },
  searchInputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, borderWidth: 1, gap: SPACING.sm,
  },
  searchInput: { flex: 1, paddingVertical: SPACING.md + 2, fontSize: 15, fontWeight: '500' },
  clearBtn: { padding: SPACING.xs },
  cancelBtn: { paddingVertical: SPACING.sm },
  cancelText: { fontSize: 14, fontWeight: '700' },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: SPACING.xxxl },

  // ── Sections ─────────────────────────────────────────────────────────
  section: { marginBottom: SPACING.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: SPACING.lg },
  clearLink: { fontSize: 13, fontWeight: '700', marginBottom: SPACING.lg },

  // ── Example Chips ───────────────────────────────────────────────────
  examplesRow: { gap: SPACING.sm, paddingBottom: SPACING.sm },
  exampleChip: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderWidth: 1 },
  exampleText: { fontSize: 13, fontWeight: '500' },

  // ── Recent Searches ─────────────────────────────────────────────────
  recentItem: {
    flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    marginBottom: SPACING.sm, gap: SPACING.md, borderWidth: 1,
  },
  recentIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  recentIcon: { fontSize: 16 },
  recentText: { flex: 1, fontSize: 14, fontWeight: '500' },

  // ── Trending Searches ───────────────────────────────────────────────
  trendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  trendItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderWidth: 1, minWidth: '46%', flexGrow: 1,
  },
  trendItemIcon: { fontSize: 18 },
  trendItemLabel: { fontSize: 13, fontWeight: '600' },

  // ── Categories ──────────────────────────────────────────────────────
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  catItem: {
    width: '46%', flexGrow: 1, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg + 2, alignItems: 'center', borderWidth: 1, gap: SPACING.sm,
  },
  catIcon: { fontSize: 28 },
  catName: { fontSize: 12, fontWeight: '600' },

  // ── Result Tabs ─────────────────────────────────────────────────────
  tabRow: { gap: SPACING.sm, marginBottom: SPACING.lg },
  tabItem: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '600' },

  // ── Filters + View Switcher ─────────────────────────────────────────
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
  filterChipsRow: { gap: SPACING.sm },
  filterChip: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontWeight: '600' },
  viewSwitcher: { flexDirection: 'row', borderRadius: RADIUS.md, borderWidth: 1, overflow: 'hidden' },
  viewBtn: { paddingHorizontal: SPACING.md, paddingVertical: 6 },

  // ── Results Header ──────────────────────────────────────────────────
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  resultsCount: { fontSize: 13, fontWeight: '600' },

  // ── Result Cards ────────────────────────────────────────────────────
  resultCard: { borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.md, overflow: 'hidden' },
  resultCardInner: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.md },
  resultImg: { width: 80, height: 80, borderRadius: RADIUS.md },
  resultInfo: { flex: 1, gap: 3 },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultName: { fontSize: 15, fontWeight: '700', flex: 1 },
  resultCategory: { fontSize: 11, fontWeight: '500' },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  resultRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  resultScore: { fontSize: 12, fontWeight: '700' },
  resultReviews: { fontSize: 11, fontWeight: '500' },
  resultDot: { fontSize: 14 },
  resultDist: { fontSize: 11, fontWeight: '500' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 10, fontWeight: '700' },
  openHours: { fontSize: 10, fontWeight: '500' },
  resultActions: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  actionText: { fontSize: 11, fontWeight: '700' },

  // ── Map View ────────────────────────────────────────────────────────
  mapPlaceholder: { borderRadius: RADIUS.xl, height: 280, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', marginBottom: SPACING.lg },
  mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mapGridLineH: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.4 },
  mapGridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, opacity: 0.4 },
  mapPlaceholderText: { fontSize: 18, fontWeight: '700', marginTop: SPACING.md },
  mapPlaceholderSub: { fontSize: 13, fontWeight: '500', marginTop: 4 },

  // ── Empty State ─────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: SPACING.sm },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: SPACING.lg },
  emptyTips: { gap: 6, marginBottom: SPACING.xl, alignItems: 'flex-start' },
  emptyTipRow: { flexDirection: 'row', alignItems: 'center' },
  emptyTipText: { fontSize: 13, fontWeight: '500' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md + 2 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // ── AI Section ──────────────────────────────────────────────────────
  aiSection: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, marginTop: SPACING.lg, marginBottom: SPACING.lg },
  aiSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  aiSectionTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  aiPhaseBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2 },
  aiPhaseText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  aiSectionDesc: { fontSize: 13, fontWeight: '500', lineHeight: 19, marginBottom: SPACING.md },
  aiExample: { gap: SPACING.sm },
  aiExampleCard: { borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, gap: 4 },
  aiExampleTitle: { fontSize: 13, fontWeight: '700' },
  aiExampleText: { fontSize: 12, fontWeight: '500' },

  // ── Skeleton ────────────────────────────────────────────────────────
  skeletonWrap: { gap: SPACING.md },
});
