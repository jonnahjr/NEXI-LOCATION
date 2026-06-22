import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Platform,
  Share,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppStore, MOCK_REVIEWS_DATA, MOCK_GALLERY } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

const { width } = Dimensions.get('window');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const isOpenNow = (hours?: string): { open: boolean; text: string } => {
  if (!hours) return { open: false, text: 'Hours not available' };
  if (hours === '24 hours') return { open: true, text: 'Open 24 hours' };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTotal = currentHour * 60 + currentMin;

  if (hours.includes('AM') || hours.includes('PM')) {
    const parts = hours.split(' - ');
    if (parts.length === 2) {
      const parseTime = (t: string) => {
        t = t.trim();
        const isPM = t.includes('PM');
        const isAM = t.includes('AM');
        const [h, m = 0] = t.replace(/\s*[AP]M\s*/i, '').split(':').map(Number);
        let hour = h;
        if (isPM && hour !== 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
        return hour * 60 + (m || 0);
      };

      const start = parseTime(parts[0]);
      const end = parseTime(parts[1]);

      if (currentTotal >= start && currentTotal < end) {
        const minsLeft = end - currentTotal;
        if (minsLeft < 60) return { open: true, text: `Closes in ${minsLeft} min` };
        return { open: true, text: `Open until ${parts[1].trim()}` };
      }
      return { open: false, text: `Opens at ${parts[0].trim()}` };
    }
  }
  return { open: false, text: hours };
};

const parseHours = (hours?: string): { is24: boolean; ranges: string[] } => {
  if (!hours || hours === '24 hours') return { is24: true, ranges: [] };
  const parts = hours.split(' - ');
  if (parts.length === 2) return { is24: false, ranges: [parts[0].trim(), parts[1].trim()] };
  return { is24: false, ranges: [hours] };
};

export const BusinessDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { id, data: encodedData } = useLocalSearchParams<{ id: string; data?: string }>();
  const { businesses, savedPlaces, toggleSavedPlace } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const business = useMemo(() => {
    // First try local store
    const found = businesses.find((b) => b.id === id);
    if (found) return found;
    // Fallback: decode business data from route params (API search results)
    if (encodedData) {
      try {
        return JSON.parse(decodeURIComponent(encodedData));
      } catch {}
    }
    return null;
  }, [id, businesses, encodedData]);
  const isSaved = id ? savedPlaces.includes(id) : false;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  // Reviews for this business
  const businessReviews = useMemo(
    () => MOCK_REVIEWS_DATA.filter((r) => r.businessId === id),
    [id],
  );

  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const total = business?.reviews || businessReviews.length || 1;
    businessReviews.forEach((r) => {
      const star = Math.floor(r.rating) as keyof typeof counts;
      if (star in counts) counts[star]++;
    });
    // If no reviews from mock data, estimate from rating
    if (businessReviews.length === 0 && business) {
      const est = Math.round(business.rating);
      counts[5] = Math.round(total * 0.6);
      counts[4] = Math.round(total * 0.25);
      counts[3] = Math.round(total * 0.1);
      counts[2] = Math.round(total * 0.03);
      counts[1] = Math.round(total * 0.02);
    }
    return { counts, total };
  }, [businessReviews, business]);

  if (!business) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted, fontSize: 16 }}>Business not found</Text>
        <Button label="Go back" onPress={() => router.back()} variant="outline" style={{ marginTop: SPACING.lg }} />
      </View>
    );
  }

  const hoursInfo = parseHours(business.hours);
  const openStatus = isOpenNow(business.hours);

  const handleCall = () => {
    if (business.phone) {
      Linking.openURL(`tel:${business.phone}`);
    } else {
      Alert.alert('No phone number available');
    }
  };

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
    Linking.openURL(url);
  };

  const handleWebsite = () => {
    if (business.website) {
      Linking.openURL(business.website);
    } else {
      Alert.alert('No website available');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${business.name} on Nexi Locate!\n${business.address}`,
      });
    } catch {}
  };

  const galleryPhotos = [business.image, ...MOCK_GALLERY];

  const displayedReviews = businessReviews;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
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
        {/* ── COVER IMAGE ── */}
        <View style={styles.coverWrap}>
          <Image
            source={{ uri: business.image }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay} />
          <View style={[styles.coverActions, { paddingTop: insets.top + SPACING.md }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.coverBtn, { backgroundColor: colors.shadow }]}
            >
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.coverBtn, { backgroundColor: colors.shadow }]}
            >
              <Ionicons name="share-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── BUSINESS HEADER ── */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={[styles.businessName, { color: colors.text }]}>{business.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={colors.gold} />
                <Text style={[styles.ratingText, { color: colors.text }]}>{business.rating.toFixed(1)}</Text>
                <Text style={[styles.reviewCount, { color: colors.textMuted }]}>({business.reviews} Reviews)</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => id && toggleSavedPlace(id)}
              style={[styles.saveBtn, { backgroundColor: isSaved ? colors.dangerGlow : colors.cardElevated, borderColor: isSaved ? colors.danger + '44' : colors.border }]}
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={20}
                color={isSaved ? colors.danger : colors.textSub}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.badgesRow}>
            {business.verified && (
              <View style={[styles.badge, { backgroundColor: colors.accentGlow }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
                <Text style={[styles.badgeText, { color: colors.accent }]}>Verified Business</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: openStatus.open ? colors.accentGlow : colors.dangerGlow }]}>
              <View style={[styles.dot, { backgroundColor: openStatus.open ? colors.accent : colors.danger }]} />
              <Text style={[styles.badgeText, { color: openStatus.open ? colors.accent : colors.danger }]}>
                {openStatus.text}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.violetGlow }]}>
              <Text style={[styles.badgeText, { color: colors.violet }]}>{business.category}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.locationText, { color: colors.textSub }]}>{business.address}</Text>
            <Text style={[styles.distanceText, { color: colors.textMuted }]}> · {business.distance}</Text>
          </View>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={[styles.quickActions, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.quickAction} onPress={handleDirections}>
            <View style={[styles.qaIcon, { backgroundColor: colors.primaryGlow }]}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.qaLabel, { color: colors.textSub }]}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
            <View style={[styles.qaIcon, { backgroundColor: colors.accentGlow }]}>
              <Ionicons name="call" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.qaLabel, { color: colors.textSub }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleWebsite}>
            <View style={[styles.qaIcon, { backgroundColor: colors.violetGlow }]}>
              <Ionicons name="globe" size={20} color={colors.violet} />
            </View>
            <Text style={[styles.qaLabel, { color: colors.textSub }]}>Website</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleShare}>
            <View style={[styles.qaIcon, { backgroundColor: colors.goldGlow }]}>
              <Ionicons name="share" size={20} color={colors.gold} />
            </View>
            <Text style={[styles.qaLabel, { color: colors.textSub }]}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* ── PHOTO GALLERY ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos</Text>
            <TouchableOpacity onPress={() => Alert.alert('Photo Gallery', 'Full gallery coming soon.')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See all 12+</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
            {[business.image, ...MOCK_GALLERY.slice(0, 5)].map((photo, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedPhotoIndex(idx)}
                style={[styles.galleryItem, { borderColor: colors.border }]}
              >
                <Image source={{ uri: photo }} style={styles.galleryImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── ABOUT ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.aboutText, { color: colors.textSub }]}>{business.description}</Text>

          <View style={[styles.infoGrid, { borderColor: colors.border }]}>
            {business.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Address</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{business.address}</Text>
                </View>
              </View>
            )}
            {business.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={colors.textMuted} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{business.phone}</Text>
                </View>
              </View>
            )}
            {business.website && (
              <View style={styles.infoRow}>
                <Ionicons name="globe-outline" size={16} color={colors.textMuted} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Website</Text>
                  <Text style={[styles.infoValue, { color: colors.primary }]}>{business.website}</Text>
                </View>
              </View>
            )}
            {business.distance && (
              <View style={styles.infoRow}>
                <Ionicons name="navigate-outline" size={16} color={colors.textMuted} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Distance</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{business.distance} away</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── OPENING HOURS ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: RADIUS.lg, padding: SPACING.lg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Opening Hours</Text>
            <View style={[styles.openStatusBadge, { backgroundColor: openStatus.open ? colors.accentGlow : colors.dangerGlow }]}>
              <View style={[styles.dot, { backgroundColor: openStatus.open ? colors.accent : colors.danger }]} />
              <Text style={[styles.openStatusText, { color: openStatus.open ? colors.accent : colors.danger }]}>
                {openStatus.open ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>

          {hoursInfo.is24 ? (
            <Text style={[styles.hoursValue, { color: colors.text }]}>Open 24 hours</Text>
          ) : (
            <View style={styles.hoursGrid}>
              {DAYS.map((day, idx) => {
                const isToday = idx === new Date().getDay() - 1;
                return (
                  <View key={day} style={[styles.hoursRow, isToday && { backgroundColor: colors.primaryGlow, borderRadius: RADIUS.sm, marginHorizontal: -SPACING.sm, paddingHorizontal: SPACING.sm }]}>
                    <Text style={[styles.hoursDay, { color: isToday ? colors.primary : colors.textSub, fontWeight: isToday ? '700' : '500' }]}>
                      {day}
                    </Text>
                    <Text style={[styles.hoursTime, { color: isToday ? colors.text : colors.textSub, fontWeight: isToday ? '700' : '500' }]}>
                      {hoursInfo.ranges[0]} - {hoursInfo.ranges[1]}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── MAP ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
          <TouchableOpacity
            onPress={handleDirections}
            style={[styles.mapPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.mapContent}>
              <Ionicons name="map-outline" size={48} color={colors.primary} />
              <Text style={[styles.mapAddress, { color: colors.text }]}>{business.address}</Text>
              <Text style={[styles.mapSub, { color: colors.textMuted }]}>Tap to open in Google Maps</Text>
              <View style={[styles.mapBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="navigate" size={16} color="#FFF" />
                <Text style={styles.mapBtnText}>Get Directions</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── REVIEWS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
            <TouchableOpacity onPress={() => Alert.alert('Write a Review', `Share your experience at ${business?.name || 'this place'} and earn +20 points!`)}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Write a review</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Summary */}
          <View style={[styles.ratingSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.ratingMain}>
              <Text style={[styles.ratingBig, { color: colors.text }]}>{business.rating.toFixed(1)}</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={14} color={s <= Math.round(business.rating) ? colors.gold : colors.border} />
                ))}
              </View>
              <Text style={[styles.ratingTotal, { color: colors.textMuted }]}>{business.reviews} reviews</Text>
            </View>
            <View style={styles.ratingBars}>
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = ratingBreakdown.counts[star];
                const pct = ratingBreakdown.total > 0 ? (count / ratingBreakdown.total) * 100 : 0;
                return (
                  <View key={star} style={styles.ratingBarRow}>
                    <Text style={[styles.ratingBarLabel, { color: colors.textMuted }]}>{star}★</Text>
                    <View style={[styles.ratingBarTrack, { backgroundColor: colors.surfaceAlt }]}>
                      <View style={[styles.ratingBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: colors.gold }]} />
                    </View>
                    <Text style={[styles.ratingBarCount, { color: colors.textMuted }]}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Review Cards */}
          {displayedReviews.map((review) => (
            <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reviewHeader}>
                <View style={[styles.reviewAvatar, { backgroundColor: colors.primaryGlow }]}>
                  <Text style={[styles.reviewAvatarText, { color: colors.primary }]}>
                    {review.userName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.reviewMeta}>
                  <Text style={[styles.reviewName, { color: colors.text }]}>{review.userName}</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={12} color={s <= review.rating ? colors.gold : colors.border} />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{review.createdAt}</Text>
              </View>
              <Text style={[styles.reviewText, { color: colors.textSub }]}>{review.text}</Text>
              {review.images && review.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewImages}>
                  {review.images.map((img, idx) => (
                    <Image key={idx} source={{ uri: img }} style={[styles.reviewImage, { borderColor: colors.border }]} />
                  ))}
                </ScrollView>
              )}
              <View style={styles.reviewFooter}>
                <TouchableOpacity style={styles.reviewAction}>
                  <Ionicons name="thumbs-up-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.reviewActionText, { color: colors.textMuted }]}>Helpful ({review.helpful})</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── REWARDS INTEGRATION ── */}
        <View style={[styles.rewardsSection, { backgroundColor: colors.goldGlow, borderColor: colors.gold + '33' }]}>
          <View style={styles.rewardsContent}>
            <Text style={styles.rewardsIcon}>⚡</Text>
            <View style={styles.rewardsInfo}>
              <Text style={[styles.rewardsTitle, { color: colors.text }]}>Earn Nexi Points</Text>
              <Text style={[styles.rewardsSub, { color: colors.textSub }]}>
                Check in: +10 pts · Review: +50 pts · Photo: +25 pts
              </Text>
            </View>
            <Button label="Check In" onPress={() => router.push('/rewards')} variant="primary" size="sm" />
          </View>
        </View>

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>

      {/* ── FULL-SCREEN PHOTO GALLERY ── */}
      <Modal
        visible={selectedPhotoIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhotoIndex(null)}
      >
        <Pressable style={styles.galleryOverlay} onPress={() => setSelectedPhotoIndex(null)}>
          {selectedPhotoIndex !== null && (
            <>
              <TouchableOpacity
                style={styles.galleryClose}
                onPress={() => setSelectedPhotoIndex(null)}
              >
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>

              <Pressable onPress={(e) => e.stopPropagation()}>
                <Image
                  source={{ uri: galleryPhotos[selectedPhotoIndex] }}
                  style={styles.galleryFullImage}
                  resizeMode="contain"
                />
              </Pressable>

              <View style={styles.galleryNav}>
                <TouchableOpacity
                  style={[styles.galleryNavBtn, selectedPhotoIndex === 0 && { opacity: 0.3 }]}
                  onPress={() => selectedPhotoIndex > 0 && setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                  disabled={selectedPhotoIndex === 0}
                >
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.galleryCounter}>
                  {selectedPhotoIndex + 1} / {galleryPhotos.length}
                </Text>

                <TouchableOpacity
                  style={[styles.galleryNavBtn, selectedPhotoIndex === galleryPhotos.length - 1 && { opacity: 0.3 }]}
                  onPress={() => selectedPhotoIndex < galleryPhotos.length - 1 && setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                  disabled={selectedPhotoIndex === galleryPhotos.length - 1}
                >
                  <Ionicons name="chevron-forward" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  coverWrap: { position: 'relative', height: 280 },
  coverImage: { width: '100%', height: '100%' },
  coverOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  coverActions: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  coverBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCard: {
    marginTop: -20, marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl, padding: SPACING.xl,
    borderWidth: 1,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerInfo: { flex: 1, marginRight: SPACING.lg, gap: SPACING.sm },
  businessName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 16, fontWeight: '700' },
  reviewCount: { fontSize: 13, fontWeight: '500' },
  saveBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.lg },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.md },
  locationText: { fontSize: 13, fontWeight: '500', flex: 1 },
  distanceText: { fontSize: 12, fontWeight: '500' },
  quickActions: {
    flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
    borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, gap: SPACING.lg,
  },
  quickAction: { flex: 1, alignItems: 'center', gap: SPACING.sm },
  qaIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 11, fontWeight: '600' },
  section: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  seeAllText: { fontSize: 13, fontWeight: '700' },
  galleryScroll: { gap: SPACING.md, paddingRight: SPACING.xl },
  galleryItem: {
    width: 100, height: 100, borderRadius: RADIUS.lg,
    overflow: 'hidden', borderWidth: 1,
  },
  galleryImage: { width: '100%', height: '100%' },
  aboutText: { fontSize: 15, fontWeight: '500', lineHeight: 24, color: '#9CA3AF', marginBottom: SPACING.xl },
  infoGrid: { borderTopWidth: 1, paddingTop: SPACING.lg, gap: SPACING.lg },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  openStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  openStatusText: { fontSize: 12, fontWeight: '700' },
  hoursGrid: { gap: SPACING.md },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  hoursDay: { fontSize: 14, fontWeight: '500' },
  hoursTime: { fontSize: 14, fontWeight: '500' },
  hoursValue: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: SPACING.lg },
  mapPlaceholder: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1 },
  mapContent: { padding: SPACING.xxl, alignItems: 'center', gap: SPACING.md },
  mapAddress: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  mapSub: { fontSize: 12, fontWeight: '500' },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  mapBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  ratingSummary: {
    borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1,
    flexDirection: 'row', gap: SPACING.xxl, marginBottom: SPACING.xl,
  },
  ratingMain: { alignItems: 'center', gap: SPACING.xs, minWidth: 80 },
  ratingBig: { fontSize: 40, fontWeight: '900', letterSpacing: -1 },
  ratingStars: { flexDirection: 'row', gap: 2 },
  ratingTotal: { fontSize: 11, fontWeight: '500' },
  ratingBars: { flex: 1, gap: 4 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ratingBarLabel: { fontSize: 11, fontWeight: '600', width: 24 },
  ratingBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: 6, borderRadius: 3 },
  ratingBarCount: { fontSize: 11, fontWeight: '600', width: 28, textAlign: 'right' },
  reviewCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.md },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontSize: 16, fontWeight: '700' },
  reviewMeta: { flex: 1, marginLeft: SPACING.md },
  reviewName: { fontSize: 14, fontWeight: '700' },
  reviewStars: { flexDirection: 'row', gap: 1, marginTop: 2 },
  reviewDate: { fontSize: 11, fontWeight: '500' },
  reviewText: { fontSize: 14, fontWeight: '500', lineHeight: 21, marginBottom: SPACING.md },
  reviewImages: { gap: SPACING.sm },
  reviewImage: { width: 64, height: 64, borderRadius: RADIUS.md, borderWidth: 1 },
  reviewFooter: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.xl },
  reviewAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewActionText: { fontSize: 12, fontWeight: '600' },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, marginTop: SPACING.sm,
  },
  showMoreText: { fontSize: 14, fontWeight: '700' },
  rewardsSection: {
    marginHorizontal: SPACING.xl, marginTop: SPACING.xxl,
    borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1,
  },
  rewardsContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  rewardsIcon: { fontSize: 36 },
  rewardsInfo: { flex: 1 },
  rewardsTitle: { fontSize: 15, fontWeight: '700' },
  rewardsSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  galleryOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  galleryClose: {
    position: 'absolute', top: 60, right: 20, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  galleryFullImage: {
    width: width, height: width,
  },
  galleryNav: {
    position: 'absolute', bottom: 80,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xl,
  },
  galleryNavBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  galleryCounter: {
    color: '#FFF', fontSize: 14, fontWeight: '600',
    minWidth: 60, textAlign: 'center',
  },
});
