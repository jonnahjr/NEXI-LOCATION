import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../components/Card';
import { BusinessCard } from '../components/BusinessCard';
import { Button } from '../components/Button';
import { useAppStore, MOCK_REVIEWS_DATA, MOCK_GALLERY, EARN_OPTIONS } from '../store/appStore';
import { useTheme, SPACING, RADIUS, TYPOGRAPHY } from '../theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;
const PHOTO_SIZE = (width - SPACING.xl * 2 - SPACING.md * 3) / 4;

// ── Home Categories (user-specified) ──────────────────────────────────────
const HOME_CATEGORIES = [
  { id: 'food', icon: '🍽️', label: 'Restaurants' },
  { id: 'cafe', icon: '☕', label: 'Cafes' },
  { id: 'hotel', icon: '🏨', label: 'Hotels' },
  { id: 'health', icon: '🏥', label: 'Clinics' },
  { id: 'health', icon: '💊', label: 'Pharmacies', searchQuery: 'pharmacy' },
  { id: 'shop', icon: '🛍️', label: 'Shopping' },
  { id: 'edu', icon: '🏫', label: 'Schools' },
  { id: 'fuel', icon: '⛽', label: 'Fuel Stn' },
  { id: 'finance', icon: '🏦', label: 'Banks' },
];

// ── Featured / Sponsored Businesses ───────────────────────────────────────
const FEATURED = [
  { id: 'f1', name: 'Sheraton Addis Hotel', desc: 'Luxury stay • Pool & Spa', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', rating: 4.8, label: 'Sponsored' },
  { id: 'f2', name: 'Yod Abyssinia Restaurant', desc: 'Traditional cuisine • Live music', image: 'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400', rating: 4.8, label: 'Popular' },
  { id: 'f3', name: 'Hyatt Regency', desc: '5-star • City views', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', rating: 4.7, label: 'Sponsored' },
];

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, businesses, savedPlaces, toggleSavedPlace, setSearchQuery, setSearchCategoryFilter } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  // ── Computed Data ──────────────────────────────────────────────────────
  const nearbyPlaces = useMemo(() =>
    [...businesses].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)).slice(0, 8),
  [businesses]);

  const trendingPlaces = useMemo(() =>
    [...businesses].sort((a, b) => b.reviews - a.reviews).slice(0, 8),
  [businesses]);

  const latestReviews = useMemo(() =>
    [...MOCK_REVIEWS_DATA].sort((a, b) => {
      const order = ['1 day ago', '2 days ago', '3 days ago', '5 days ago', '1 week ago', '2 weeks ago'];
      return order.indexOf(a.createdAt) - order.indexOf(b.createdAt);
    }).slice(0, 5),
  []);

  const reviewsWithBusiness = useMemo(() =>
    latestReviews.map(rev => {
      const biz = businesses.find(b => b.id === rev.businessId);
      return { ...rev, businessName: biz?.name || 'Unknown', businessImage: biz?.image || '' };
    }),
  [latestReviews, businesses]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCategoryPress = useCallback((cat: typeof HOME_CATEGORIES[0]) => {
    if (cat.searchQuery) {
      setSearchQuery(cat.searchQuery);
    } else {
      setSearchCategoryFilter(cat.id);
    }
    router.push('/search');
  }, [setSearchQuery, setSearchCategoryFilter, router]);

  const handleSearchPress = useCallback(() => {
    router.push('/search');
  }, [router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Ambient glow */}
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
            SECTION 1: HEADER
           ════════════════════════════════════════════════════════════════ */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
          <View style={styles.headerLeft}>
            {/* Location */}
            <View style={styles.locationRow}>
              <Ionicons name="location" size={13} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.textSub }]}>
                Addis Ababa, Ethiopia
              </Text>
            </View>
            {/* Greeting + Name */}
            <View style={styles.greetingRow}>
              <Text style={styles.greetingEmoji}>👋</Text>
              <Text style={[styles.greetingText, { color: colors.text }]}>
                {greeting()}, {user?.name || 'there'}
              </Text>
            </View>
          </View>
          {/* Right actions */}
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSub} />
              <View style={[styles.notifDot, { backgroundColor: colors.danger }]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={[styles.avatarBtn, { borderColor: colors.primary }]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user?.name?.charAt(0) || 'J'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2: SEARCH BAR
           ════════════════════════════════════════════════════════════════ */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            onPress={handleSearchPress}
            style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>
              Search places, restaurants, hotels...
            </Text>
            <View style={[styles.aiTag, { backgroundColor: colors.violetGlow }]}>
              <Ionicons name="sparkles" size={12} color={colors.violet} />
              <Text style={[styles.aiTagText, { color: colors.violet }]}>AI</Text>
            </View>
          </TouchableOpacity>

          {/* Example search suggestions */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examplesRow}>
            {['Best coffee in Bole', 'Hotels near airport', 'Open pharmacy', 'Traditional food'].map((ex, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { setSearchQuery(ex); router.push('/search'); }}
                style={[styles.exampleChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              >
                <Text style={[styles.exampleText, { color: colors.textMuted }]}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3: QUICK CATEGORIES
           ════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {HOME_CATEGORIES.map((cat, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleCategoryPress(cat)}
                style={[styles.catItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catLabel, { color: colors.textSub }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4: INTERACTIVE MAP PREVIEW
           ════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 Nearby Places</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Open Full Map</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/search')}
            style={[styles.mapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.9}
          >
            {/* Grid overlay to look like a map */}
            <View style={styles.mapGrid}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.mapGridLineH,
                    { backgroundColor: colors.primaryGlow, top: `${((i + 1) / 21) * 100}%` },
                  ]}
                />
              ))}
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.mapGridLineV,
                    { backgroundColor: colors.primaryGlow, left: `${((i + 1) / 13) * 100}%` },
                  ]}
                />
              ))}
            </View>

            {/* Map pins */}
            <View style={[styles.mapPin, { top: '25%', left: '30%' }]}>
              <Ionicons name="location" size={22} color={colors.danger} />
            </View>
            <View style={[styles.mapPin, { top: '55%', left: '60%' }]}>
              <Ionicons name="location" size={18} color={colors.primary} />
            </View>
            <View style={[styles.mapPin, { top: '40%', left: '20%' }]}>
              <Ionicons name="location" size={16} color={colors.accent} />
            </View>
            <View style={[styles.mapPin, { top: '70%', left: '45%' }]}>
              <Ionicons name="location" size={20} color={colors.violet} />
            </View>
            <View style={[styles.mapPin, { top: '30%', left: '75%' }]}>
              <Ionicons name="location" size={14} color={colors.gold} />
            </View>

            {/* Center pin */}
            <View style={[styles.mapCenterPin, { backgroundColor: colors.primary }]}>
              <Ionicons name="navigate" size={20} color="#FFF" />
            </View>

            {/* Bottom overlay */}
            <View style={[styles.mapOverlay, { backgroundColor: colors.glassBg }]}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={[styles.mapOverlayText, { color: colors.text }]}>
                {nearbyPlaces.length} places near you
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 5: NEARBY PLACES
           ════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Near You</Text>
            <TouchableOpacity onPress={handleSearchPress}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizScroll}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + SPACING.lg}
          >
            {nearbyPlaces.map((biz) => (
              <TouchableOpacity
                key={biz.id}
                onPress={() => router.push(`/business/${biz.id}`)}
                style={[styles.horizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.85}
              >
                <Image source={{ uri: biz.image }} style={styles.horizCardImg} resizeMode="cover" />
                <View style={styles.horizCardInfo}>
                  <View style={styles.horizCardTop}>
                    <Text style={[styles.horizCardName, { color: colors.text }]} numberOfLines={1}>
                      {biz.name}
                    </Text>
                    {biz.verified && <Ionicons name="checkmark-circle" size={14} color={colors.accent} />}
                  </View>
                  <View style={styles.horizCardMeta}>
                    <Text style={[styles.horizCardCat, { color: colors.textMuted }]} numberOfLines={1}>
                      {biz.category}
                    </Text>
                    <Text style={[styles.horizCardDot, { color: colors.textMuted }]}> • </Text>
                    <Ionicons name="location" size={11} color={colors.textMuted} />
                    <Text style={[styles.horizCardDist, { color: colors.textMuted }]}>{biz.distance}</Text>
                  </View>
                  <View style={styles.horizCardRating}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={[styles.horizCardScore, { color: colors.text }]}>{biz.rating.toFixed(1)}</Text>
                    <Text style={[styles.horizCardReviews, { color: colors.textMuted }]}>
                      ({biz.reviews})
                    </Text>
                    {biz.hours?.includes('24') && (
                      <View style={[styles.openBadge, { backgroundColor: colors.accentGlow }]}>
                        <Text style={[styles.openBadgeText, { color: colors.accent }]}>Open</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 6: TRENDING PLACES
           ════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Trending This Week</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Most reviewed places in Addis
              </Text>
            </View>
          </View>

          {trendingPlaces.slice(0, 4).map((biz) => (
            <TouchableOpacity
              key={biz.id}
              onPress={() => router.push(`/business/${biz.id}`)}
              style={[styles.trendRow, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Image source={{ uri: biz.image }} style={styles.trendImg} resizeMode="cover" />
              <View style={styles.trendInfo}>
                <Text style={[styles.trendName, { color: colors.text }]} numberOfLines={1}>{biz.name}</Text>
                <Text style={[styles.trendCat, { color: colors.textMuted }]}>{biz.category}</Text>
                <View style={styles.trendMeta}>
                  <Ionicons name="star" size={11} color={colors.gold} />
                  <Text style={[styles.trendRating, { color: colors.textSub }]}>{biz.rating.toFixed(1)}</Text>
                  <Text style={[styles.trendReviews, { color: colors.textMuted }]}>
                    ({biz.reviews} reviews)
                  </Text>
                  <Text style={[styles.trendDist, { color: colors.textMuted }]}>
                     • {biz.distance}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => { setSearchCategoryFilter(''); router.push('/search'); }}
            style={[styles.trendAllBtn, { backgroundColor: colors.primaryGlow }]}
          >
            <Text style={[styles.trendAllText, { color: colors.primary }]}>View all trending places</Text>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 7: RECOMMENDED FOR YOU (AI placeholder)
           ════════════════════════════════════════════════════════════════ */}
        <View style={[styles.recommendCard, { backgroundColor: colors.violetGlow, borderColor: colors.violet + '33' }]}>
          <View style={styles.recommendLeft}>
            <Text style={styles.recommendIcon}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recommendTitle, { color: colors.text }]}>Recommended For You</Text>
              <Text style={[styles.recommendSub, { color: colors.textSub }]}>
                AI-powered picks based on your taste
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleSearchPress}
            style={[styles.recommendBtn, { backgroundColor: colors.violet }]}
          >
            <Ionicons name="sparkles" size={16} color="#FFF" />
            <Text style={styles.recommendBtnText}>Explore</Text>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 8: COMMUNITY PHOTOS
           ════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📸 Explore Ethiopia</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                From our community
              </Text>
            </View>
            <TouchableOpacity onPress={handleSearchPress}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoGrid}>
            {MOCK_GALLERY.slice(0, 8).map((url, idx) => (
              <TouchableOpacity key={idx} style={styles.photoItem} activeOpacity={0.8}>
                <Image source={{ uri: url }} style={styles.photoImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 9: LATEST REVIEWS
           ════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⭐ Recent Reviews</Text>
          </View>

          {reviewsWithBusiness.map((rev) => (
            <TouchableOpacity
              key={rev.id}
              onPress={() => router.push(`/business/${rev.businessId}`)}
              style={[styles.reviewRow, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={[styles.reviewAvatar, { backgroundColor: colors.primaryGlow }]}>
                <Text style={[styles.reviewAvatarText, { color: colors.primary }]}>
                  {rev.userName.charAt(0)}
                </Text>
              </View>
              <View style={styles.reviewInfo}>
                <View style={styles.reviewTop}>
                  <Text style={[styles.reviewUser, { color: colors.text }]}>{rev.userName}</Text>
                  <View style={styles.reviewStars}>
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Ionicons key={i} name="star" size={11} color={colors.gold} />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewBiz, { color: colors.primary }]} numberOfLines={1}>
                  reviewed {rev.businessName}
                </Text>
                <Text style={[styles.reviewText, { color: colors.textSub }]} numberOfLines={2}>
                  {rev.text}
                </Text>
                <Text style={[styles.reviewTime, { color: colors.textMuted }]}>{rev.createdAt}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 10: EARN REWARDS
           ════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎁 Earn Nexi Points</Text>
            <TouchableOpacity onPress={() => router.push('/rewards')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.earnGrid}>
            {EARN_OPTIONS.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => router.push('/rewards')}
                style={[styles.earnCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={styles.earnIcon}>{option.icon}</Text>
                <Text style={[styles.earnTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.earnDesc, { color: colors.textMuted }]}>{option.description}</Text>
                <View style={[styles.earnPoints, { backgroundColor: colors.primaryGlow }]}>
                  <Text style={[styles.earnPointsText, { color: colors.primary }]}>+{option.points}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 11: FEATURED BUSINESSES (Sponsored)
           ════════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📢 Featured</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Premium businesses in Addis
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizScroll}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + SPACING.lg}
          >
            {FEATURED.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.featuredCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.85}
              >
                <Image source={{ uri: item.image }} style={styles.featuredImg} resizeMode="cover" />
                <View style={[styles.featuredLabel, { backgroundColor: colors.primary }]}>
                  <Text style={styles.featuredLabelText}>{item.label}</Text>
                </View>
                <View style={styles.featuredInfo}>
                  <View style={styles.featuredRating}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={[styles.featuredScore, { color: colors.text }]}>{item.rating}</Text>
                  </View>
                  <Text style={[styles.featuredName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.featuredDesc, { color: colors.textSub }]}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGlow: {
    position: 'absolute', top: -100, right: -80,
    width: 250, height: 250, borderRadius: 125, opacity: 0.3,
    transform: [{ scale: 2 }],
  },

  // ── Header ───────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
  },
  headerLeft: { gap: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, fontWeight: '500' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greetingEmoji: { fontSize: 18 },
  greetingText: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
  },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: 16, fontWeight: '800' },

  // ── Search ───────────────────────────────────────────────────────────
  searchSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2, borderWidth: 1, gap: SPACING.md,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, fontWeight: '500' },
  aiTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
  },
  aiTagText: { fontSize: 10, fontWeight: '800' },
  examplesRow: { marginTop: SPACING.sm, gap: SPACING.sm },
  exampleChip: {
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
    marginRight: SPACING.sm, borderWidth: 1,
  },
  exampleText: { fontSize: 12, fontWeight: '500' },

  // ── Section Common ──────────────────────────────────────────────────
  section: { marginBottom: SPACING.xxl, paddingHorizontal: SPACING.xl },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  seeAllText: { fontSize: 13, fontWeight: '700' },

  // ── Categories ──────────────────────────────────────────────────────
  catScroll: { gap: SPACING.md },
  catItem: {
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, alignItems: 'center',
    borderWidth: 1, minWidth: 76,
  },
  catIcon: { fontSize: 24, marginBottom: 4 },
  catLabel: { fontSize: 11, fontWeight: '600' },

  // ── Map ─────────────────────────────────────────────────────────────
  mapCard: {
    borderRadius: RADIUS.xl, height: 180, overflow: 'hidden',
    borderWidth: 1, position: 'relative', justifyContent: 'center', alignItems: 'center',
  },
  mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mapGridLineH: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.4 },
  mapGridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, opacity: 0.4 },
  mapPin: { position: 'absolute' },
  mapCenterPin: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  mapOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
  },
  mapOverlayText: { flex: 1, fontSize: 13, fontWeight: '600' },

  // ── Horizontal Card ─────────────────────────────────────────────────
  horizScroll: { gap: SPACING.lg, paddingHorizontal: SPACING.xl },
  horizCard: {
    width: CARD_WIDTH, borderRadius: RADIUS.xl,
    borderWidth: 1, overflow: 'hidden',
  },
  horizCardImg: { width: '100%', height: 120 },
  horizCardInfo: { padding: SPACING.md, gap: 4 },
  horizCardTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  horizCardName: { fontSize: 15, fontWeight: '700', flex: 1 },
  horizCardMeta: { flexDirection: 'row', alignItems: 'center' },
  horizCardCat: { fontSize: 12, fontWeight: '500', flex: 1 },
  horizCardDot: { fontSize: 12, fontWeight: '500' },
  horizCardDist: { fontSize: 11, fontWeight: '500' },
  horizCardRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  horizCardScore: { fontSize: 12, fontWeight: '700' },
  horizCardReviews: { fontSize: 11, fontWeight: '500' },
  openBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 6 },
  openBadgeText: { fontSize: 10, fontWeight: '700' },

  // ── Trending List ───────────────────────────────────────────────────
  trendRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md, borderBottomWidth: 1, gap: SPACING.md,
  },
  trendImg: { width: 56, height: 56, borderRadius: RADIUS.md },
  trendInfo: { flex: 1, gap: 2 },
  trendName: { fontSize: 14, fontWeight: '700' },
  trendCat: { fontSize: 12, fontWeight: '500' },
  trendMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  trendRating: { fontSize: 12, fontWeight: '700' },
  trendReviews: { fontSize: 11, fontWeight: '500' },
  trendDist: { fontSize: 11, fontWeight: '500' },
  trendAllBtn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  trendAllText: { fontSize: 13, fontWeight: '700' },

  // ── AI Recommend ────────────────────────────────────────────────────
  recommendCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: SPACING.xl, marginBottom: SPACING.xxl,
    borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, gap: SPACING.md,
  },
  recommendLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  recommendIcon: { fontSize: 28 },
  recommendTitle: { fontSize: 15, fontWeight: '700' },
  recommendSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  recommendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  recommendBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  // ── Photo Grid ──────────────────────────────────────────────────────
  photoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md,
  },
  photoItem: {
    width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: RADIUS.md, overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },

  // ── Reviews ─────────────────────────────────────────────────────────
  reviewRow: {
    flexDirection: 'row', paddingVertical: SPACING.md,
    borderBottomWidth: 1, gap: SPACING.md,
  },
  reviewAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 16, fontWeight: '700' },
  reviewInfo: { flex: 1, gap: 2 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  reviewUser: { fontSize: 13, fontWeight: '700' },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewBiz: { fontSize: 12, fontWeight: '600' },
  reviewText: { fontSize: 13, fontWeight: '400', lineHeight: 18, marginTop: 2 },
  reviewTime: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  // ── Earn Points ─────────────────────────────────────────────────────
  earnGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  earnCard: {
    width: (width - SPACING.xl * 2 - SPACING.md) / 2,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, gap: 4,
  },
  earnIcon: { fontSize: 24 },
  earnTitle: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  earnDesc: { fontSize: 11, fontWeight: '500' },
  earnPoints: { borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  earnPointsText: { fontSize: 11, fontWeight: '800' },

  // ── Featured / Sponsored ────────────────────────────────────────────
  featuredCard: {
    width: CARD_WIDTH, borderRadius: RADIUS.xl,
    borderWidth: 1, overflow: 'hidden', position: 'relative',
  },
  featuredImg: { width: '100%', height: 130 },
  featuredLabel: {
    position: 'absolute', top: SPACING.md, left: SPACING.md,
    borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  featuredLabelText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  featuredInfo: { padding: SPACING.md, gap: 2 },
  featuredRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featuredScore: { fontSize: 13, fontWeight: '800' },
  featuredName: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  featuredDesc: { fontSize: 12, fontWeight: '500' },
});
