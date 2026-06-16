import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/appStore';
import { RADIUS, SPACING, useTheme } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.65;
const SHEET_HEIGHT = height * 0.35;

const CATEGORY_FILTERS = [
  { id: 'all', icon: '📍', label: 'All', color: '#1F2937' },
  { id: 'food', icon: '🍽️', label: 'Food', color: '#EF4444' },
  { id: 'cafe', icon: '☕', label: 'Cafe', color: '#F59E0B' },
  { id: 'hotel', icon: '🏨', label: 'Hotel', color: '#3B82F6' },
  { id: 'health', icon: '🏥', label: 'Health', color: '#10B981' },
  { id: 'shop', icon: '🛍️', label: 'Shop', color: '#8B5CF6' },
  { id: 'club', icon: '🎵', label: 'Nightlife', color: '#EC4899' },
];

export const MapScreenV2: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { businesses, savedPlaces, toggleSavedPlace } = useAppStore();

  // State management
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [userLocation, setUserLocation] = useState({ x: '50%', y: '50%' });
  const [mapCenter, setMapCenter] = useState({ x: '50%', y: '50%' });

  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  // Filter businesses
  const filteredBusinesses = useMemo(() => {
    let results = businesses;
    if (activeFilter !== 'all') {
      results = results.filter((b) => b.categoryId === activeFilter);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q),
      );
    }
    return results;
  }, [businesses, activeFilter, searchText]);

  const selectedBiz = selectedBusiness
    ? businesses.find((b) => b.id === selectedBusiness)
    : null;

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));

  // Get color for business category
  const getCategoryColor = (categoryId: string) => {
    const cat = CATEGORY_FILTERS.find((c) => c.id === categoryId);
    return cat?.color || '#1F2937';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Map Area ── */}
      <View style={[styles.mapContainer, { height: MAP_HEIGHT }]}>
        {/* Google Maps-style Background */}
        <View style={[styles.mapBg, { backgroundColor: '#F5F5F5' }]}>
          {/* Decorative street grid */}
          <View style={styles.mapGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={`h-${i}`}
                style={[
                  styles.gridLineH,
                  { top: `${((i + 1) / 9) * 100}%` },
                ]}
              />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <View
                key={`v-${i}`}
                style={[
                  styles.gridLineV,
                  { left: `${((i + 1) / 6) * 100}%` },
                ]}
              />
            ))}
          </View>

          {/* Business Pins */}
          {filteredBusinesses.slice(0, 40).map((biz) => {
            const isSelected = selectedBusiness === biz.id;
            const pinSize = isSelected ? 44 : 32;
            const categoryColor = getCategoryColor(biz.categoryId);

            return (
              <TouchableOpacity
                key={biz.id}
                style={[
                  styles.pin,
                  {
                    left: `${((biz.longitude - 38.73) / 0.05) * 100}%`,
                    top: `${((9.05 - biz.latitude) / 0.06) * 100}%`,
                    transform: [{ scale: zoom }],
                  },
                ]}
                onPress={() => {
                  setSelectedBusiness(biz.id);
                  setShowDetails(true);
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.pinMarker,
                    {
                      backgroundColor: categoryColor,
                      width: pinSize,
                      height: pinSize,
                      borderRadius: pinSize / 2,
                      borderWidth: isSelected ? 3 : 2,
                      borderColor: isSelected ? '#FFF' : categoryColor,
                    },
                  ]}
                >
                  {isSelected && (
                    <View style={styles.pinPulse}>
                      <View
                        style={[styles.pulseRing1, { borderColor: categoryColor }]}
                      />
                      <View
                        style={[styles.pulseRing2, { borderColor: categoryColor }]}
                      />
                    </View>
                  )}
                  <Text style={styles.pinIcon}>{biz.categoryId === 'food' ? '🍽️' : biz.categoryId === 'cafe' ? '☕' : '📍'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* User Location Marker */}
          <View style={[styles.userMarker, { left: userLocation.x, top: userLocation.y }]}>
            <View style={styles.userDot} />
            <View style={styles.userRing} />
            <View style={styles.userRing2} />
          </View>

          {/* Search Overlay - Top */}
          <View style={[styles.searchOverlay, { paddingTop: insets.top + SPACING.sm }]}>
            <View style={[styles.searchBarContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search places, addresses"
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.card }]}
                onPress={() => setUserLocation({ x: '50%', y: '50%' })}
              >
                <Ionicons name="locate" size={18} color="#4285F4" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.card }]}
                onPress={handleZoomIn}
              >
                <Ionicons name="add" size={20} color="#4285F4" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.card }]}
                onPress={handleZoomOut}
              >
                <Ionicons name="remove" size={20} color="#4285F4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Filter - Bottom */}
          <View style={styles.filterOverlay}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {CATEGORY_FILTERS.map((cat) => {
                const isActive = activeFilter === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setActiveFilter(cat.id)}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor: isActive ? '#4285F4' : colors.card,
                        borderColor: isActive ? '#4285F4' : '#E0E0E0',
                      },
                    ]}
                  >
                    <Text style={styles.filterIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.filterLabel,
                        { color: isActive ? '#FFF' : colors.textSub },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Place Count Badge */}
          <View
            style={[styles.placeBadge, { backgroundColor: colors.card }]}
          >
            <Ionicons name="layers" size={14} color="#4285F4" />
            <Text style={[styles.placeCountText, { color: colors.text }]}>
              {filteredBusinesses.length} places
            </Text>
          </View>
        </View>
      </View>

      {/* ── Bottom Sheet ── */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

        {selectedBiz && showDetails ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetScrollContent}
          >
            {/* Business Header */}
            <View style={styles.bizHeader}>
              <Image
                source={{ uri: selectedBiz.image }}
                style={styles.bizImage}
              />
              <TouchableOpacity
                onPress={() => setShowDetails(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Business Info */}
            <View style={styles.bizContent}>
              <View style={styles.bizTitle}>
                <Text style={[styles.bizName, { color: colors.text }]}>
                  {selectedBiz.name}
                </Text>
                {selectedBiz.verified && (
                  <Ionicons name="checkmark-circle" size={18} color="#34A853" />
                )}
              </View>

              {/* Rating and Category */}
              <View style={styles.bizMeta}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FBBC04" />
                  <Text style={[styles.ratingText, { color: colors.text }]}>
                    {selectedBiz.rating.toFixed(1)}
                  </Text>
                  <Text style={[styles.reviewCount, { color: colors.textSub }]}>
                    (245 reviews)
                  </Text>
                </View>
                <Text style={[styles.category, { color: colors.textSub }]}>
                  {selectedBiz.category}
                </Text>
              </View>

              {/* Address */}
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color="#4285F4" />
                <Text style={[styles.infoText, { color: colors.textSub }]}>
                  {selectedBiz.address} · {selectedBiz.distance}
                </Text>
              </View>

              {/* Hours */}
              {selectedBiz.hours && (
                <View style={styles.infoRow}>
                  <Ionicons name="time" size={16} color="#4285F4" />
                  <Text
                    style={[
                      styles.infoText,
                      {
                        color: selectedBiz.hours.includes('24')
                          ? '#34A853'
                          : colors.textSub,
                      },
                    ]}
                  >
                    {selectedBiz.hours.includes('24')
                      ? 'Open 24/7'
                      : selectedBiz.hours}
                  </Text>
                </View>
              )}

              {/* Phone */}
              <TouchableOpacity style={styles.infoRow}>
                <Ionicons name="call" size={16} color="#4285F4" />
                <Text style={[styles.infoText, { color: '#4285F4' }]}>
                  +251 911 234 567
                </Text>
              </TouchableOpacity>

              {/* Website */}
              <TouchableOpacity style={styles.infoRow}>
                <Ionicons name="globe" size={16} color="#4285F4" />
                <Text style={[styles.infoText, { color: '#4285F4' }]}>
                  nexilocate.com
                </Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4285F4' }]}
                  onPress={() => router.push(`/business/${selectedBiz.id}`)}
                >
                  <Ionicons name="information-circle" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: savedPlaces.includes(selectedBiz.id)
                        ? '#EA4335'
                        : colors.cardElevated,
                      borderWidth: 1,
                      borderColor: savedPlaces.includes(selectedBiz.id)
                        ? '#EA4335'
                        : colors.border,
                    },
                  ]}
                  onPress={() => toggleSavedPlace(selectedBiz.id)}
                >
                  <Ionicons
                    name={
                      savedPlaces.includes(selectedBiz.id)
                        ? 'heart'
                        : 'heart-outline'
                    }
                    size={18}
                    color={
                      savedPlaces.includes(selectedBiz.id) ? '#FFF' : '#EA4335'
                    }
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      {
                        color: savedPlaces.includes(selectedBiz.id)
                          ? '#FFF'
                          : '#EA4335',
                      },
                    ]}
                  >
                    {savedPlaces.includes(selectedBiz.id) ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#FBBC04' }]}
                >
                  <Ionicons name="navigate" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>Navigate</Text>
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={styles.description}>
                <Text style={[styles.descriptionTitle, { color: colors.text }]}>
                  About this place
                </Text>
                <Text style={[styles.descriptionText, { color: colors.textSub }]}>
                  {selectedBiz.name} is a popular destination offering quality
                  {selectedBiz.category.toLowerCase()} services with excellent
                  customer reviews and a welcoming atmosphere.
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.nearbyHeader}>
              <Ionicons name="location" size={20} color="#4285F4" />
              <Text style={[styles.nearbyTitle, { color: colors.text }]}>
                Nearby Places
              </Text>
            </View>

            {filteredBusinesses.slice(0, 8).map((biz) => (
              <TouchableOpacity
                key={biz.id}
                onPress={() => {
                  setSelectedBusiness(biz.id);
                  setShowDetails(true);
                }}
                style={[
                  styles.nearbyItem,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Image
                  source={{ uri: biz.image }}
                  style={styles.nearbyImage}
                />
                <View style={styles.nearbyInfo}>
                  <View style={styles.nearbyTop}>
                    <Text
                      style={[styles.nearbyName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {biz.name}
                    </Text>
                    {biz.verified && (
                      <Ionicons name="checkmark-circle" size={14} color="#34A853" />
                    )}
                  </View>
                  <View style={styles.nearbyMeta}>
                    <Ionicons name="star" size={12} color="#FBBC04" />
                    <Text style={[styles.nearbyRating, { color: colors.text }]}>
                      {biz.rating.toFixed(1)}
                    </Text>
                    <Text
                      style={[
                        styles.nearbyCategory,
                        { color: colors.textSub },
                      ]}
                    >
                      · {biz.category}
                    </Text>
                  </View>
                  <Text style={[styles.nearbyDist, { color: colors.textSub }]}>
                    {biz.distance}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { position: 'relative', overflow: 'hidden' },
  mapBg: { flex: 1, position: 'relative' },
  mapGrid: { position: 'absolute', inset: 0 },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#E8EAED', opacity: 0.6 },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#E8EAED', opacity: 0.6 },

  // Pins
  pin: { position: 'absolute' },
  pinMarker: { alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  pinPulse: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  pulseRing1: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2, opacity: 0.3 },
  pulseRing2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, opacity: 0.15 },
  pinIcon: { fontSize: 16, fontWeight: 'bold' },

  // User location
  userMarker: { position: 'absolute', marginLeft: -12, marginTop: -12, zIndex: 100 },
  userDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4285F4', borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  userRing: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#4285F4', opacity: 0.3, top: -12, left: -12 },
  userRing2: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: '#4285F4', opacity: 0.15, top: -24, left: -24 },

  // Search overlay
  searchOverlay: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: SPACING.md, zIndex: 30, gap: SPACING.sm },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#E8EAED', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  quickActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },

  // Filter overlay
  filterOverlay: { position: 'absolute', bottom: 260, left: 0, right: 0, zIndex: 25, paddingLeft: SPACING.md },
  filterScroll: { gap: SPACING.sm, paddingRight: SPACING.md },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  filterIcon: { fontSize: 14 },
  filterLabel: { fontSize: 12, fontWeight: '700' },

  // Place badge
  placeBadge: { position: 'absolute', bottom: 90, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#E8EAED', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, zIndex: 15 },
  placeCountText: { fontSize: 12, fontWeight: '700' },

  // Bottom sheet
  bottomSheet: { flex: 1, borderTopWidth: 1, borderTopColor: '#E8EAED', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  sheetScrollContent: { paddingBottom: SPACING.lg },

  // Business details
  bizHeader: { position: 'relative', marginHorizontal: -SPACING.lg, marginTop: -SPACING.md, marginBottom: SPACING.lg },
  bizImage: { width: '100%', height: 200, resizeMode: 'cover' },
  closeBtn: { position: 'absolute', top: SPACING.md, right: SPACING.md, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  bizContent: { gap: SPACING.md, paddingBottom: SPACING.xl },
  bizTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bizName: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  bizMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#E8EAED' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '700' },
  reviewCount: { fontSize: 12 },
  category: { fontSize: 12, fontWeight: '500' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  infoText: { fontSize: 13, fontWeight: '500', flex: 1 },
  actionButtons: { flexDirection: 'row', gap: SPACING.sm },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  description: { gap: SPACING.sm, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: '#E8EAED' },
  descriptionTitle: { fontSize: 14, fontWeight: '700' },
  descriptionText: { fontSize: 13, lineHeight: 20 },

  // Nearby places
  nearbyHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#E8EAED' },
  nearbyTitle: { fontSize: 16, fontWeight: '700' },
  nearbyItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1 },
  nearbyImage: { width: 56, height: 56, borderRadius: RADIUS.md },
  nearbyInfo: { flex: 1, gap: 2 },
  nearbyTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nearbyName: { fontSize: 14, fontWeight: '700', flex: 1 },
  nearbyMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nearbyRating: { fontSize: 12, fontWeight: '700' },
  nearbyCategory: { fontSize: 11, fontWeight: '500' },
  nearbyDist: { fontSize: 12, fontWeight: '500' },
});
