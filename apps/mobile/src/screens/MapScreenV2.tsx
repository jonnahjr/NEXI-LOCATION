import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Vibration,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAppStore, Business } from '../store/appStore';
import { RADIUS, SPACING, useTheme } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height;
const SHEET_COLLAPSED = 140;
const COLLAPSED_EXTRA = 60;
const SHEET_EXPANDED = height * 0.45;
const SHEET_FULL = height * 0.78;

// ── Category Filters (Ethiopia-focused) ──────────────────────────────────
const CATEGORY_FILTERS = [
  { id: 'all', icon: '📍', label: 'All', color: '#1F2937' },
  { id: 'food', icon: '🍽️', label: 'Restaurants', color: '#EF4444' },
  { id: 'cafe', icon: '☕', label: 'Coffee', color: '#F59E0B' },
  { id: 'hotel', icon: '🏨', label: 'Hotels', color: '#3B82F6' },
  { id: 'health', icon: '🏥', label: 'Clinics', color: '#10B981' },
  { id: 'shop', icon: '🛍️', label: 'Shopping', color: '#8B5CF6' },
  { id: 'club', icon: '🎵', label: 'Nightlife', color: '#EC4899' },
  { id: 'fuel', icon: '⛽', label: 'Fuel', color: '#6366F1' },
  { id: 'finance', icon: '🏦', label: 'Banks', color: '#14B8A6' },
  { id: 'edu', icon: '🏫', label: 'Schools', color: '#F97316' },
];

// ── Discovery Layer Badges ────────────────────────────────────────────────
const DISCOVERY_BADGES = [
  { id: 'trending', icon: '🔥', label: 'Trending', color: '#EF4444' },
  { id: 'top', icon: '⭐', label: 'Top Rated', color: '#F59E0B' },
  { id: 'new', icon: '🆕', label: 'Newly Added', color: '#10B981' },
  { id: 'reviewed', icon: '🏆', label: 'Most Reviewed', color: '#8B5CF6' },
];

// ── Filter Options ────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'distance', label: 'Distance', icon: '📍' },
  { id: 'rating', label: 'Rating', icon: '⭐' },
  { id: 'popularity', label: 'Popularity', icon: '🔥' },
  { id: 'newest', label: 'Newest', icon: '🆕' },
];

// ── Travel Modes ──────────────────────────────────────────────────────────
const TRAVEL_MODES = [
  { id: 'walking', icon: '🚶', label: 'Walk' },
  { id: 'driving', icon: '🚗', label: 'Drive' },
  { id: 'cycling', icon: '🚲', label: 'Cycle' },
];

// ── Simple Clustering Algorithm ───────────────────────────────────────────
interface Cluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  points: Business[];
}

function clusterMarkers(points: Business[], region: Region, gridSize: number = 0.02): (Business | Cluster)[] {
  if (!region || points.length === 0) return points;

  const clusters: Map<string, Cluster> = new Map();
  const zoom = Math.log2(360 / (region.longitudeDelta * gridSize));
  const zoomFactor = Math.max(0.5, Math.min(1, (zoom - 5) / 10));

  // Adaptive grid size based on zoom
  const adaptiveGrid = gridSize * (1 + (1 - zoomFactor));

  points.forEach((point) => {
    const latKey = Math.round(point.latitude / adaptiveGrid);
    const lngKey = Math.round(point.longitude / adaptiveGrid);
    const key = `${latKey}_${lngKey}`;

    if (clusters.has(key)) {
      const cluster = clusters.get(key)!;
      cluster.count++;
      cluster.points.push(point);
    } else {
      clusters.set(key, {
        id: `cluster_${key}`,
        latitude: point.latitude,
        longitude: point.longitude,
        count: 1,
        points: [point],
      });
    }
  });

  const result: (Business | Cluster)[] = [];
  clusters.forEach((cluster) => {
    if (cluster.count === 1) {
      result.push(cluster.points[0]);
    } else {
      // Center the cluster on average position
      const avgLat = cluster.points.reduce((s, p) => s + p.latitude, 0) / cluster.count;
      const avgLng = cluster.points.reduce((s, p) => s + p.longitude, 0) / cluster.count;
      result.push({ ...cluster, latitude: avgLat, longitude: avgLng });
    }
  });

  return result;
}

// ── Main Component ────────────────────────────────────────────────────────
export const MapScreenV2: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, mode } = useTheme();
  const { businesses, savedPlaces, toggleSavedPlace, isSaved } = useAppStore();

  // ── Core State ──────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [sheetMode, setSheetMode] = useState<'collapsed' | 'expanded' | 'full'>('collapsed');
  const [showFilters, setShowFilters] = useState(false);
  const [showAiSearch, setShowAiSearch] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [activeDiscovery, setActiveDiscovery] = useState<string | null>(null);
  const [showSavedLayer, setShowSavedLayer] = useState(false);
  const [showNavMode, setShowNavMode] = useState(false);
  const [travelMode, setTravelMode] = useState('driving');
  const [isOffline, setIsOffline] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [filterDistance, setFilterDistance] = useState<number>(10);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterRatingMin, setFilterRatingMin] = useState(0);
  const [pinPreviewBiz, setPinPreviewBiz] = useState<typeof businesses[0] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const mapRef = useRef<MapView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const sheetPanY = useRef(new Animated.Value(0)).current;
  const aiInputRef = useRef<TextInput>(null);

  // ── Sheet animation helper (defined before PanResponder to avoid TDZ) ──
  const expandSheet = useCallback((mode: 'collapsed' | 'expanded' | 'full') => {
    setSheetMode(mode);
    const target = mode === 'collapsed' ? 0 : mode === 'expanded' ? 1 : 2;
    Animated.spring(sheetAnim, {
      toValue: target,
      tension: 65,
      friction: 11,
      useNativeDriver: false,
    }).start();
  }, [sheetAnim]);

  // ── Refs for stale-closure-safe values ─────────────────────────────────
  const sheetModeRef = useRef(sheetMode);
  sheetModeRef.current = sheetMode;
  const expandSheetRef = useRef(expandSheet);
  expandSheetRef.current = expandSheet;

  // ── Sheet Pan Responder ─────────────────────────────────────────────────
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        sheetPanY.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        const mode = sheetModeRef.current;
        const current = mode === 'collapsed' ? 0 : mode === 'expanded' ? 1 : 2;
        const maxDrag = current === 0 ? 100 : current === 1 ? 200 : 0;
        sheetPanY.setValue(Math.max(-maxDrag, Math.min(0, gesture.dy)));
      },
      onPanResponderRelease: (_, gesture) => {
        const vy = gesture.vy;
        const dy = gesture.dy;
        const mode = sheetModeRef.current;
        const expand = expandSheetRef.current;

        if (dy < -80 || vy < -0.5) {
          if (mode === 'collapsed') expand('expanded');
          else if (mode === 'expanded') expand('full');
        } else if (dy > 80 || vy > 0.5) {
          if (mode === 'full') expand('expanded');
          else if (mode === 'expanded') expand('collapsed');
        } else {
          expand(mode);
        }
        Animated.spring(sheetPanY, { toValue: 0, useNativeDriver: false }).start();
      },
    }),
  ).current;

  // ── Filtered & Sorted Businesses ────────────────────────────────────────
  const filteredBusinesses = useMemo(() => {
    let results = businesses;

    // Category filter
    if (activeFilter !== 'all') {
      results = results.filter((b) => b.categoryId === activeFilter);
    }

    // Discovery layer
    if (activeDiscovery === 'trending') {
      results = [...results].sort((a, b) => b.reviews - a.reviews);
    } else if (activeDiscovery === 'top') {
      results = [...results].sort((a, b) => b.rating - a.rating);
    } else if (activeDiscovery === 'new') {
      results = results.slice(0, 20);
    } else if (activeDiscovery === 'reviewed') {
      results = [...results].sort((a, b) => b.reviews - a.reviews);
    }

    // Search text
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q),
      );
    }

    // Filter: Open Now
    if (filterOpenNow) {
      results = results.filter((b) => b.hours?.includes('24') || b.hours?.includes('AM'));
    }

    // Filter: Verified Only
    if (filterVerified) {
      results = results.filter((b) => b.verified);
    }

    // Filter: Rating minimum
    if (filterRatingMin > 0) {
      results = results.filter((b) => b.rating >= filterRatingMin);
    }

    // Filter: Distance (simulated)
    if (filterDistance < 10) {
      const distKm = filterDistance;
      results = results.filter((b) => parseFloat(b.distance) <= distKm);
    }

    // Sort
    if (sortBy === 'distance') {
      results = [...results].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } else if (sortBy === 'rating') {
      results = [...results].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'popularity') {
      results = [...results].sort((a, b) => b.reviews - a.reviews);
    }

    return results;
  }, [businesses, activeFilter, activeDiscovery, searchText, filterOpenNow, filterVerified, filterRatingMin, filterDistance, sortBy]);

  // ── Saved Places Set (O(1) lookups) ────────────────────────────────────
  const savedSet = useMemo(() => new Set(savedPlaces), [savedPlaces]);

  // ── Clustered Markers ───────────────────────────────────────────────────
  const clusteredMarkers = useMemo(() => {
    if (!currentRegion) return filteredBusinesses;
    // Skip clustering when zoomed in close (latitudeDelta < 0.01)
    if (currentRegion.latitudeDelta < 0.01) return filteredBusinesses;
    return clusterMarkers(filteredBusinesses, currentRegion, 0.015);
  }, [filteredBusinesses, currentRegion]);

  // ── Selected Business ───────────────────────────────────────────────────
  const selectedBiz = selectedBusiness
    ? businesses.find((b) => b.id === selectedBusiness)
    : null;

  // ── Color helper ────────────────────────────────────────────────────────
  const getCategoryColor = (categoryId: string) => {
    const cat = CATEGORY_FILTERS.find((c) => c.id === categoryId);
    return cat?.color || '#1F2937';
  };

  // ── Request Location Permission on Mount ───────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (e) {
        console.log('Location permission error:', e);
      }
    })();
  }, []);

  // ── Auto-center on user once both map is ready and location is known ──
  useEffect(() => {
    if (mapReady && userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 500);
    }
  }, [mapReady, userLocation]);

  // ── Region Change Handler ───────────────────────────────────────────────
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setCurrentRegion(region);
  }, []);

  // ── Center on user location ─────────────────────────────────────────────
  const centerOnUser = useCallback(() => {
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600,
      );
    } else {
      // Fallback to Addis Ababa if no location available
      mapRef.current?.animateToRegion(
        {
          latitude: 9.02,
          longitude: 38.74,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        600,
      );
    }
    Vibration.vibrate(10);
  }, [userLocation]);

  // ── AI Search Handler ───────────────────────────────────────────────────
  const handleAiSearch = useCallback(() => {
    setShowAiSearch(true);
    setTimeout(() => aiInputRef.current?.focus(), 300);
  }, []);

  const submitAiQuery = useCallback(() => {
    if (aiQuery.trim()) {
      setSearchText(aiQuery);
      setShowAiSearch(false);
      setAiQuery('');
      expandSheet('expanded');
    }
  }, [aiQuery, expandSheet]);

  // ── Pin Press Handler ──────────────────────────────────────────────────
  const handlePinPress = useCallback((biz: typeof businesses[0]) => {
    setPinPreviewBiz(biz);
    setSelectedBusiness(biz.id);
    setShowNavMode(false);
    // Auto-expand sheet to show preview
    expandSheet('expanded');
  }, [expandSheet]);

  // ── Navigation Mode ────────────────────────────────────────────────────
  const handleDirections = useCallback(() => {
    setShowNavMode(true);
    expandSheet('expanded');
  }, [expandSheet]);

  // ── Filter Reset ────────────────────────────────────────────────────────
  const resetFilters = useCallback(() => {
    setFilterDistance(10);
    setFilterOpenNow(false);
    setFilterVerified(false);
    setFilterRatingMin(0);
    setSortBy('distance');
    setActiveFilter('all');
    setActiveDiscovery(null);
  }, []);

  // ── Sheet position calculation ──────────────────────────────────────────
  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [MAP_HEIGHT - SHEET_COLLAPSED - insets.bottom + COLLAPSED_EXTRA, MAP_HEIGHT - SHEET_EXPANDED, MAP_HEIGHT - SHEET_FULL],
  });

  // ── Render Cluster Marker ───────────────────────────────────────────────
  const renderMarker = (item: any) => {
    if (item.count && item.count > 1) {
      // Cluster marker
      return (
        <Marker
          key={item.id}
          coordinate={{ latitude: item.latitude, longitude: item.longitude }}
          onPress={() => {
            mapRef.current?.animateToRegion({
              latitude: item.latitude,
              longitude: item.longitude,
              latitudeDelta: currentRegion?.latitudeDelta ? currentRegion.latitudeDelta * 0.4 : 0.02,
              longitudeDelta: currentRegion?.longitudeDelta ? currentRegion.longitudeDelta * 0.4 : 0.02,
            }, 400);
          }}
        >
          <View style={[styles.clusterMarker, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
            <View style={[styles.clusterInner, { backgroundColor: colors.primary }]}>
              <Text style={styles.clusterText}>{item.count}</Text>
            </View>
          </View>
        </Marker>
      );
    }

    const biz = item;
    const isSelected = selectedBusiness === biz.id;
    const isSavedPin = savedSet.has(biz.id);
    const categoryColor = getCategoryColor(biz.categoryId);
    const pinSize = isSelected ? 40 : 30;

    return (
      <Marker
        key={biz.id}
        coordinate={{ latitude: biz.latitude, longitude: biz.longitude }}
        onPress={() => handlePinPress(biz)}
        tracksViewChanges={false}
      >
        <View style={styles.markerWrapper}>
          {/* Saved heart indicator */}
          {isSavedPin && showSavedLayer && (
            <View style={styles.savedHeartBadge}>
              <Ionicons name="heart" size={12} color="#EF4444" />
            </View>
          )}

          {/* Pin shadow */}
          <View
            style={[
              styles.pinShadow,
              {
                width: pinSize,
                height: pinSize,
                borderRadius: pinSize / 2,
                backgroundColor: categoryColor,
                opacity: 0.2,
              },
            ]}
          />

          {/* Pin body */}
          <View
            style={[
              styles.pinBody,
              {
                width: pinSize,
                height: pinSize,
                borderRadius: pinSize / 2,
                backgroundColor: categoryColor,
                borderWidth: isSelected ? 3 : 2,
                borderColor: isSelected ? '#FFF' : 'rgba(255,255,255,0.5)',
              },
            ]}
          >
            <Text style={styles.pinIcon}>
              {biz.categoryId === 'food' ? '🍽️' :
               biz.categoryId === 'cafe' ? '☕' :
               biz.categoryId === 'hotel' ? '🏨' :
               biz.categoryId === 'health' ? '🏥' :
               biz.categoryId === 'shop' ? '🛍️' :
               biz.categoryId === 'club' ? '🎵' :
               biz.categoryId === 'fuel' ? '⛽' :
               biz.categoryId === 'finance' ? '🏦' :
               biz.categoryId === 'edu' ? '🏫' : '📍'}
            </Text>
          </View>

          {/* Selected pulse ring */}
          {isSelected && (
            <View style={[styles.pulseRing, { borderColor: categoryColor }]} />
          )}
        </View>


      </Marker>
    );
  };

  // ── Sheet Content ───────────────────────────────────────────────────────
  const renderSheetContent = () => {
    // Map collapsed view
    if (sheetMode === 'collapsed') {
      return (
        <View style={[styles.collapsedBar]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.textMuted }]} />
          <View style={styles.collapsedRow}>
            <View style={[styles.collapsedIconWrap, { backgroundColor: colors.primaryGlow }]}>
              <Ionicons name="location" size={18} color={colors.primary} />
            </View>
            <View style={styles.collapsedInfo}>
              <Text style={[styles.collapsedTitle, { color: colors.text }]}>
                Places Near You
              </Text>
              <Text style={[styles.collapsedSub, { color: colors.textMuted }]}>
                {filteredBusinesses.length} results{activeFilter !== 'all' ? ` · ${CATEGORY_FILTERS.find(c => c.id === activeFilter)?.label}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => expandSheet('expanded')}
              style={[styles.collapsedBtn, { backgroundColor: colors.cardElevated }]}
            >
              <Ionicons name="chevron-up" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Navigation Mode
    if (showNavMode && selectedBiz) {
      return (
        <View style={styles.navContainer}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.textMuted }]} />

          {/* Nav Header */}
          <View style={styles.navHeader}>
            <Text style={[styles.navTitle, { color: colors.text }]}>🗺️ Navigation</Text>
            <TouchableOpacity onPress={() => setShowNavMode(false)}>
              <Text style={[styles.navCloseText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Travel Modes */}
          <View style={styles.travelModeRow}>
            {TRAVEL_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => setTravelMode(mode.id)}
                style={[
                  styles.travelModeBtn,
                  {
                    backgroundColor: travelMode === mode.id ? colors.primaryGlow : colors.cardElevated,
                    borderColor: travelMode === mode.id ? colors.primary + '44' : colors.border,
                  },
                ]}
              >
                <Text style={styles.travelModeIcon}>{mode.icon}</Text>
                <Text
                  style={[
                    styles.travelModeLabel,
                    { color: travelMode === mode.id ? colors.primary : colors.textSub },
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Route Info */}
          <View style={[styles.routeCard, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
            <View style={styles.routeInfoRow}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <View style={styles.routeInfoText}>
                <Text style={[styles.routeLabel, { color: colors.textMuted }]}>From</Text>
                <Text style={[styles.routeValue, { color: colors.text }]}>Your Location</Text>
              </View>
            </View>
            <View style={[styles.routeDivider, { backgroundColor: colors.border }]} />
            <View style={styles.routeInfoRow}>
              <Ionicons name="flag" size={16} color={colors.accent} />
              <View style={styles.routeInfoText}>
                <Text style={[styles.routeLabel, { color: colors.textMuted }]}>To</Text>
                <Text style={[styles.routeValue, { color: colors.text }]}>{selectedBiz.name}</Text>
              </View>
            </View>
            <View style={[styles.routeDivider, { backgroundColor: colors.border }]} />
            <View style={styles.routeStats}>
              <View style={styles.routeStat}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={[styles.routeStatValue, { color: colors.text }]}>
                  {travelMode === 'driving' ? '12 min' : travelMode === 'walking' ? '35 min' : '18 min'}
                </Text>
                <Text style={[styles.routeStatLabel, { color: colors.textMuted }]}>ETA</Text>
              </View>
              <View style={styles.routeStat}>
                <Ionicons name="resize" size={14} color={colors.accent} />
                <Text style={[styles.routeStatValue, { color: colors.text }]}>
                  {parseFloat(selectedBiz.distance) * (travelMode === 'walking' ? 1.5 : 1)} km
                </Text>
                <Text style={[styles.routeStatLabel, { color: colors.textMuted }]}>Distance</Text>
              </View>
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity style={[styles.startNavBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="navigate" size={18} color="#FFF" />
            <Text style={styles.startNavText}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Pin Preview (single business)
    if (pinPreviewBiz && sheetMode === 'expanded' && !showFilters) {
      const biz = pinPreviewBiz;
      const isItemSaved = savedSet.has(biz.id);

      return (
        <View style={styles.previewContainer}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.textMuted }]} />

          {/* Close + Actions Row */}
          <View style={styles.previewTopRow}>
            <TouchableOpacity
              onPress={() => {
                setPinPreviewBiz(null);
                setSelectedBusiness(null);
                expandSheet('collapsed');
              }}
              style={[styles.previewCloseBtn, { backgroundColor: colors.cardElevated }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.previewTopActions}>
              <TouchableOpacity
                onPress={() => toggleSavedPlace(biz.id)}
                style={[styles.previewActionBtn, { backgroundColor: isItemSaved ? colors.dangerGlow : colors.cardElevated }]}
              >
                <Ionicons
                  name={isItemSaved ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isItemSaved ? colors.danger : colors.textSub}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  /* Share */
                }}
                style={[styles.previewActionBtn, { backgroundColor: colors.cardElevated }]}
              >
                <Ionicons name="share-outline" size={18} color={colors.textSub} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Business Image */}
          <Image source={{ uri: biz.image }} style={styles.previewImage} resizeMode="cover" />

          {/* Business Info */}
          <View style={styles.previewInfo}>
            <View style={styles.previewNameRow}>
              <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
                {biz.name}
              </Text>
              {biz.verified && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
            </View>

            {/* Rating + Distance + Category */}
            <View style={styles.previewMetaRow}>
              <View style={styles.previewRating}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={[styles.previewRatingText, { color: colors.text }]}>{biz.rating.toFixed(1)}</Text>
                <Text style={[styles.previewRatingCount, { color: colors.textMuted }]}>({biz.reviews})</Text>
              </View>
              <Text style={[styles.previewDot, { color: colors.textMuted }]}> · </Text>
              <Text style={[styles.previewDist, { color: colors.textSub }]}>{biz.distance}</Text>
              <Text style={[styles.previewDot, { color: colors.textMuted }]}> · </Text>
              <Text style={[styles.previewCategory, { color: colors.textSub }]}>{biz.category}</Text>
            </View>

            {/* Open Status */}
            <View style={styles.previewStatusRow}>
              {biz.hours?.includes('24') || biz.hours?.includes('AM') ? (
                <View style={[styles.openBadge, { backgroundColor: colors.accentGlow }]}>
                  <View style={[styles.openDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.openText, { color: colors.accent }]}>Open Now</Text>
                </View>
              ) : (
                <View style={[styles.closedBadge, { backgroundColor: colors.dangerGlow }]}>
                  <View style={[styles.openDot, { backgroundColor: colors.danger }]} />
                  <Text style={[styles.closedText, { color: colors.danger }]}>Closed</Text>
                </View>
              )}
              {biz.verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.accentGlow }]}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
                  <Text style={[styles.verifiedText, { color: colors.accent }]}>Verified</Text>
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.previewActions}>
              <TouchableOpacity
                onPress={handleDirections}
                style={[styles.previewAction, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="navigate" size={16} color="#FFF" />
                <Text style={styles.previewActionText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  /* Call */
                }}
                style={[styles.previewAction, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="call" size={16} color="#FFF" />
                <Text style={styles.previewActionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/business/${biz.id}`)}
                style={[styles.previewAction, { backgroundColor: colors.violet }]}
              >
                <Ionicons name="information-circle" size={16} color="#FFF" />
                <Text style={styles.previewActionText}>Details</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Drag up hint */}
          <TouchableOpacity
            onPress={() => expandSheet('full')}
            style={styles.dragUpHint}
          >
            <Text style={[styles.dragUpText, { color: colors.textMuted }]}>
              Swipe up for full details
            </Text>
            <Ionicons name="chevron-up" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      );
    }

    // Full Sheet - Nearby List
    if (sheetMode === 'full' || (sheetMode === 'expanded' && !pinPreviewBiz && !showFilters)) {
      return (
        <View style={styles.listContainer}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.textMuted }]} />

          {/* Sheet Header */}
          <View style={styles.listHeader}>
            <View style={styles.listHeaderLeft}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={[styles.listTitle, { color: colors.text }]}>Places Near You</Text>
            </View>
            <TouchableOpacity onPress={() => setShowFilters(true)} style={[styles.filterToggleBtn, { backgroundColor: colors.primaryGlow }]}>
              <Ionicons name="options" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Discovery Layer Badges */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.discoveryRow}
          >
            {DISCOVERY_BADGES.map((badge) => (
              <TouchableOpacity
                key={badge.id}
                onPress={() => setActiveDiscovery(activeDiscovery === badge.id ? null : badge.id)}
                style={[
                  styles.discoveryChip,
                  {
                    backgroundColor: activeDiscovery === badge.id ? badge.color + '22' : colors.cardElevated,
                    borderColor: activeDiscovery === badge.id ? badge.color : colors.border,
                  },
                ]}
              >
                <Text style={styles.discoveryIcon}>{badge.icon}</Text>
                <Text
                  style={[
                    styles.discoveryLabel,
                    { color: activeDiscovery === badge.id ? badge.color : colors.textSub },
                  ]}
                >
                  {badge.label}
                </Text>
                {activeDiscovery === badge.id && (
                  <TouchableOpacity onPress={() => setActiveDiscovery(null)}>
                    <Ionicons name="close-circle" size={14} color={badge.color} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Saved Layer Toggle */}
          <TouchableOpacity
            onPress={() => setShowSavedLayer(!showSavedLayer)}
            style={[
              styles.savedLayerToggle,
              {
                backgroundColor: showSavedLayer ? colors.primaryGlow : colors.cardElevated,
                borderColor: showSavedLayer ? colors.primary + '44' : colors.border,
              },
            ]}
          >
            <Ionicons
              name={showSavedLayer ? 'heart' : 'heart-outline'}
              size={16}
              color={showSavedLayer ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.savedLayerText,
                { color: showSavedLayer ? colors.primary : colors.textSub },
              ]}
            >
              {showSavedLayer ? 'Showing Saved' : 'Show Saved Places'}
            </Text>
            {showSavedLayer && (
              <Text style={[styles.savedLayerCount, { color: colors.primary }]}>
                ({savedPlaces.length})
              </Text>
            )}
          </TouchableOpacity>

          {/* Offline Indicator */}
          {isOffline && (
            <View style={[styles.offlineBar, { backgroundColor: colors.dangerGlow }]}>
              <Ionicons name="cloud-offline" size={14} color={colors.danger} />
              <Text style={[styles.offlineText, { color: colors.danger }]}>
                Offline mode — showing cached results
              </Text>
            </View>
          )}

          {/* Results List */}
          {filteredBusinesses.length > 0 ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
            >
              {filteredBusinesses.map((biz) => {
                const isItemSaved = savedSet.has(biz.id);
                return (
                  <TouchableOpacity
                    key={biz.id}
                    onPress={() => {
                      setPinPreviewBiz(biz);
                      setSelectedBusiness(biz.id);
                      // Animate to business on map
                      mapRef.current?.animateToRegion({
                        latitude: biz.latitude,
                        longitude: biz.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      }, 500);
                    }}
                    style={[styles.resultItem, { borderBottomColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: biz.image }} style={styles.resultImage} resizeMode="cover" />
                    <View style={styles.resultInfo}>
                      <View style={styles.resultTopRow}>
                        <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
                          {biz.name}
                        </Text>
                        {biz.verified && <Ionicons name="checkmark-circle" size={14} color={colors.accent} />}
                      </View>
                      <View style={styles.resultMetaRow}>
                        <Ionicons name="star" size={11} color="#F59E0B" />
                        <Text style={[styles.resultRating, { color: colors.text }]}>{biz.rating.toFixed(1)}</Text>
                        <Text style={[styles.resultCategory, { color: colors.textMuted }]}>
                           · {biz.category}
                        </Text>
                        <Text style={[styles.resultDist, { color: colors.textMuted }]}>
                           · {biz.distance}
                        </Text>
                      </View>
                      <View style={styles.resultBadges}>
                        {biz.hours?.includes('24') && (
                          <View style={[styles.resultBadge, { backgroundColor: colors.accentGlow }]}>
                            <Text style={[styles.resultBadgeText, { color: colors.accent }]}>Open</Text>
                          </View>
                        )}
                        {biz.verified && (
                          <View style={[styles.resultBadge, { backgroundColor: colors.primaryGlow }]}>
                            <Text style={[styles.resultBadgeText, { color: colors.primary }]}>Verified</Text>
                          </View>
                        )}
                        {biz.reviews > 200 && (
                          <View style={[styles.resultBadge, { backgroundColor: colors.violetGlow }]}>
                            <Text style={[styles.resultBadgeText, { color: colors.violet }]}>Popular</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleSavedPlace(biz.id)}
                      style={styles.resultSaveBtn}
                    >
                      <Ionicons
                        name={isItemSaved ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isItemSaved ? colors.danger : colors.textMuted}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
              {/* Bottom spacer */}
              <View style={{ height: SPACING.xxxl }} />
            </ScrollView>
          ) : (
            /* Empty State */
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryGlow }]}>
                <Ionicons name="search-outline" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No places found</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                {searchText.trim()
                  ? `No results for "${searchText}"`
                  : 'Try expanding your search area'}
              </Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity
                  onPress={() => setSearchText('')}
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="search" size={16} color="#FFF" />
                  <Text style={styles.emptyBtnText}>Search Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setFilterDistance(20);
                    setActiveDiscovery(null);
                  }}
                  style={[styles.emptyBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border, borderWidth: 1 }]}
                >
                  <Ionicons name="expand" size={16} color={colors.primary} />
                  <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Expand Radius</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/add-place')}
                style={[styles.addPlaceBtn, { backgroundColor: colors.cardElevated }]}
              >
                <Ionicons name="add-circle" size={16} color={colors.textSub} />
                <Text style={[styles.addPlaceText, { color: colors.textSub }]}>Add New Place</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    // Filter Panel
    if (showFilters) {
      return (
        <View style={styles.filterContainer}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.textMuted }]} />

          <View style={styles.filterHeader}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>🔍 Map Filters</Text>
            <TouchableOpacity onPress={() => { resetFilters(); setShowFilters(false); }}>
              <Text style={[styles.filterResetText, { color: colors.primary }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
            {/* Sort By */}
            <Text style={[styles.filterSectionTitle, { color: colors.textSub }]}>Sort By</Text>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSortBy(opt.id)}
                  style={[
                    styles.sortBtn,
                    {
                      backgroundColor: sortBy === opt.id ? colors.primaryGlow : colors.cardElevated,
                      borderColor: sortBy === opt.id ? colors.primary + '44' : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.sortIcon}>{opt.icon}</Text>
                  <Text
                    style={[
                      styles.sortLabel,
                      { color: sortBy === opt.id ? colors.primary : colors.textSub },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {sortBy === opt.id && (
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Distance Slider */}
            <Text style={[styles.filterSectionTitle, { color: colors.textSub }]}>
              Max Distance: {filterDistance} km
            </Text>
            <View style={styles.sliderRow}>
              {[1, 2, 5, 10, 20, 50].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setFilterDistance(d)}
                  style={[
                    styles.sliderDot,
                    {
                      backgroundColor: filterDistance === d ? colors.primary : colors.cardElevated,
                      borderColor: filterDistance === d ? colors.primary : colors.border,
                      width: filterDistance === d ? 44 : 36,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sliderLabel,
                      { color: filterDistance === d ? '#FFF' : colors.textSub, fontSize: filterDistance === d ? 12 : 10 },
                    ]}
                  >
                    {d === 50 ? 'Any' : `${d}km`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Toggle Filters */}
            <Text style={[styles.filterSectionTitle, { color: colors.textSub }]}>Quick Filters</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setFilterOpenNow(!filterOpenNow)}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: filterOpenNow ? colors.accentGlow : colors.cardElevated,
                    borderColor: filterOpenNow ? colors.accent : colors.border,
                  },
                ]}
              >
                <View style={[styles.toggleCheck, { borderColor: colors.borderLight }, filterOpenNow && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                  {filterOpenNow && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text style={[styles.toggleLabel, { color: filterOpenNow ? colors.accent : colors.textSub }]}>
                  Open Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterVerified(!filterVerified)}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: filterVerified ? colors.primaryGlow : colors.cardElevated,
                    borderColor: filterVerified ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={[styles.toggleCheck, { borderColor: colors.borderLight }, filterVerified && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {filterVerified && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text style={[styles.toggleLabel, { color: filterVerified ? colors.primary : colors.textSub }]}>
                  Verified Only
                </Text>
              </TouchableOpacity>
            </View>

            {/* Minimum Rating */}
            <Text style={[styles.filterSectionTitle, { color: colors.textSub }]}>Minimum Rating</Text>
            <View style={styles.ratingRow}>
              {[0, 3, 3.5, 4, 4.5].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setFilterRatingMin(r)}
                  style={[
                    styles.ratingBtn,
                    {
                      backgroundColor: filterRatingMin === r ? colors.goldGlow : colors.cardElevated,
                      borderColor: filterRatingMin === r ? '#F59E0B' : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.ratingBtnText, { color: filterRatingMin === r ? '#F59E0B' : colors.textSub }]}>
                    {r === 0 ? 'Any' : `${r}+`}
                  </Text>
                  {r > 0 && <Ionicons name="star" size={10} color={filterRatingMin === r ? '#F59E0B' : colors.textMuted} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return null;
  };

  // ── AI Search Modal Overlay ────────────────────────────────────────────
  const renderAiSearch = () => {
    if (!showAiSearch) return null;
    return (
      <View style={[styles.aiOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)' }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setShowAiSearch(false)}
        />
        <View style={[styles.aiPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aiPanelHeader}>
            <View style={styles.aiPanelHeaderLeft}>
              <Ionicons name="sparkles" size={22} color={colors.violet} />
              <Text style={[styles.aiPanelTitle, { color: colors.text }]}>AI Search</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAiSearch(false)}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Examples */}
          <View style={styles.aiExamples}>
            {[
              { text: 'Best coffee shop with WiFi', icon: '☕' },
              { text: 'Quiet restaurant for meetings', icon: '🍽️' },
              { text: 'Family-friendly hotel', icon: '🏨' },
              { text: 'Open pharmacy near me', icon: '💊' },
            ].map((ex, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setAiQuery(ex.text);
                  setSearchText(ex.text);
                  setShowAiSearch(false);
                  expandSheet('expanded');
                }}
                style={[styles.aiExampleItem, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              >
                <Text style={styles.aiExampleIcon}>{ex.icon}</Text>
                <Text style={[styles.aiExampleLabel, { color: colors.textSub }]}>{ex.text}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Input */}
          <View style={[styles.aiInputRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="sparkles" size={18} color={colors.violet} />
            <TextInput
              ref={aiInputRef}
              style={[styles.aiInput, { color: colors.text }]}
              placeholder="Ask anything... "
              placeholderTextColor={colors.textMuted}
              value={aiQuery}
              onChangeText={setAiQuery}
              onSubmitEditing={submitAiQuery}
              returnKeyType="search"
            />
            {aiQuery.trim().length > 0 && (
              <TouchableOpacity onPress={submitAiQuery} style={[styles.aiSendBtn, { backgroundColor: colors.violet }]}>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ── Main Render ────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ════════════════════════════════════════════════════════════════
          FULL SCREEN MAP
         ════════════════════════════════════════════════════════════════ */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: 9.02,
            longitude: 38.74,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapReady={() => setMapReady(true)}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={true}
          showsCompass={false}
          mapType={isDark ? 'standard' : 'standard'}
          customMapStyle={isDark ? darkMapStyle : undefined}
          rotateEnabled={true}
          zoomEnabled={true}
          scrollEnabled={true}
          toolbarEnabled={false}
        >
          {/* Business Markers (saved places show heart badges via renderMarker) */}
          {clusteredMarkers.map((item) => renderMarker(item))}
        </MapView>

        {/* ═══ Floating Search Bar (Top Center) ═══ */}
        <View
          style={[
            styles.searchOverlay,
            { paddingTop: insets.top + SPACING.sm },
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.glassSearchBar, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
            {/* Search Icon */}
            <Ionicons name="search" size={18} color={colors.textSub} />

            {/* Input */}
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search places, restaurants, hotels..."
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                if (text) expandSheet('expanded');
              }}
              onFocus={() => {
                if (!pinPreviewBiz) expandSheet('expanded');
              }}
              returnKeyType="search"
            />

            {/* Right buttons */}
            <View style={styles.searchRightActions}>
              {/* Voice Search */}
              <TouchableOpacity style={styles.searchIconBtn}>
                <Ionicons name="mic-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* AI Button */}
              <TouchableOpacity
                onPress={handleAiSearch}
                style={[styles.aiSearchBtn, { backgroundColor: colors.violetGlow }]}
              >
                <Ionicons name="sparkles" size={16} color={colors.violet} />
              </TouchableOpacity>

              {/* Filter Button */}
              <TouchableOpacity
                onPress={() => setShowFilters(true)}
                style={[styles.filterBadgeBtn, {
                  backgroundColor: showFilters || filterOpenNow || filterVerified || filterRatingMin > 0
                    ? colors.primaryGlow : 'transparent',
                }]}
              >
                <Ionicons
                  name="options"
                  size={18}
                  color={showFilters || filterOpenNow || filterVerified || filterRatingMin > 0
                    ? colors.primary : colors.textMuted}
                />
                {(filterOpenNow || filterVerified || filterRatingMin > 0) && (
                  <View style={[styles.activeFilterDot, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>

              {/* Close if has text */}
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText('');
                    setActiveFilter('all');
                  }}
                  style={styles.clearSearchBtn}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Chips (Horizontal Scroll) */}
          <View style={styles.chipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
              keyboardShouldPersistTaps="handled"
            >
              {CATEGORY_FILTERS.map((cat) => {
                const isActive = activeFilter === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      setActiveFilter(cat.id);
                      expandSheet('expanded');
                      setPinPreviewBiz(null);
                    }}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isActive ? cat.color : colors.glassBg,
                        borderColor: isActive ? cat.color : colors.glassBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.chipLabel,
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
        </View>

        {/* ═══ Current Location Button (Bottom Right) ═══ */}
        <View style={styles.locationBtnContainer} pointerEvents="box-none">
          <TouchableOpacity
            onPress={centerOnUser}
            style={[styles.locationBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              /* Layer toggle */
            }}
            style={[styles.locationBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
            activeOpacity={0.8}
          >
            <Ionicons name="layers-outline" size={20} color={colors.textSub} />
          </TouchableOpacity>
        </View>

        {/* ═══ AI Discovery FAB (Floating) ═══ */}
        <TouchableOpacity
          onPress={handleAiSearch}
          style={[styles.aiFab, { backgroundColor: colors.violet }]}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={22} color="#FFF" />
        </TouchableOpacity>



        {/* ═══ Offline Indicator (if offline) ═══ */}
        {isOffline && (
          <View style={[styles.mapOfflineBadge, { backgroundColor: 'rgba(239,68,68,0.9)' }]}>
            <Ionicons name="cloud-offline" size={12} color="#FFF" />
            <Text style={styles.mapOfflineText}>Offline</Text>
          </View>
        )}
      </View>

      {/* ════════════════════════════════════════════════════════════════
          BOTTOM SHEET (Animated)
         ════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.glassBorder,
            transform: [{ translateY: Animated.add(sheetPanY, sheetTranslateY) }],
          },
        ]}
      >
        <View
          {...sheetPanResponder.panHandlers}
          style={styles.sheetDragArea}
        >
          {renderSheetContent()}
        </View>
      </Animated.View>

      {/* ════════════════════════════════════════════════════════════════
          AI SEARCH OVERLAY
         ════════════════════════════════════════════════════════════════ */}
      {renderAiSearch()}

      {/* ════════════════════════════════════════════════════════════════
          PLACE COUNT BADGE (on map)
         ════════════════════════════════════════════════════════════════ */}
      {filteredBusinesses.length > 0 && mapReady && sheetMode === 'collapsed' && (
        <View
          style={[
            styles.placeCountBadge,
            {
              backgroundColor: colors.card,
              borderColor: colors.glassBorder,
              bottom: SHEET_COLLAPSED + insets.bottom + 80,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="location" size={13} color={colors.primary} />
          <Text style={[styles.placeCountText, { color: colors.text }]}>
            {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'place' : 'places'}
          </Text>
        </View>
      )}
    </View>
  );
};

// ── Dark Mode Map Style ───────────────────────────────────────────────────
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1, position: 'relative' },

  // ── Search Bar ────────────────────────────────────────────────────────
  searchOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 30,
    paddingHorizontal: SPACING.md,
  },
  glassSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  searchRightActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  searchIconBtn: { padding: 4 },
  aiSearchBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  clearSearchBtn: { padding: 4 },

  // ── Category Chips ────────────────────────────────────────────────────
  chipsContainer: { marginTop: SPACING.sm, height: 40 },
  chipsScroll: { gap: SPACING.sm, paddingHorizontal: SPACING.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    elevation: 2,
  },
  chipIcon: { fontSize: 13 },
  chipLabel: { fontSize: 12, fontWeight: '700' },

  // ── Location Button ───────────────────────────────────────────────────
  locationBtnContainer: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 160,
    zIndex: 25,
    gap: SPACING.md,
  },
  locationBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 3,
  },

  // ── AI FAB ────────────────────────────────────────────────────────────
  aiFab: {
    position: 'absolute',
    left: SPACING.md,
    bottom: 160,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    zIndex: 25,
  },

  // ── Offline Badge ─────────────────────────────────────────────────────
  mapOfflineBadge: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    zIndex: 25,
  },
  mapOfflineText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  // ── Place Count Badge ────────────────────────────────────────────────
  placeCountBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    elevation: 4,
    zIndex: 15,
  },
  placeCountText: { fontSize: 13, fontWeight: '700' },

  // ── Markers ───────────────────────────────────────────────────────────
  markerWrapper: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  pinShadow: { position: 'absolute', transform: [{ scale: 0.9 }] },
  pinBody: { alignItems: 'center', justifyContent: 'center', elevation: 4 },
  pinIcon: { fontSize: 13, fontWeight: 'bold' },
  pulseRing: { position: 'absolute', width: 52, height: 52, borderRadius: 26, borderWidth: 2, opacity: 0.3 },
  savedHeartBadge: { position: 'absolute', top: -6, right: -6, zIndex: 10 },

  // ── Cluster Marker ────────────────────────────────────────────────────
  clusterMarker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  clusterInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: { color: '#FFF', fontSize: 14, fontWeight: '900' },

  // ── Bottom Sheet ──────────────────────────────────────────────────────
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    elevation: 8,
    zIndex: 50,
  },
  sheetDragArea: { flex: 1 },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    opacity: 0.5,
  },

  // ── Collapsed State ───────────────────────────────────────────────────
  collapsedBar: { paddingHorizontal: SPACING.lg, paddingBottom: 20 },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  collapsedIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  collapsedInfo: { flex: 1 },
  collapsedTitle: { fontSize: 15, fontWeight: '700' },
  collapsedSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  collapsedBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // ── Preview (Pin Tap) ─────────────────────────────────────────────────
  previewContainer: { flex: 1, paddingHorizontal: SPACING.lg },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  previewCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  previewTopActions: { flexDirection: 'row', gap: SPACING.sm },
  previewActionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  previewInfo: { gap: SPACING.sm },
  previewNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewName: { fontSize: 20, fontWeight: '800', flex: 1 },
  previewMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flexWrap: 'wrap' },
  previewRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  previewRatingText: { fontSize: 14, fontWeight: '700' },
  previewRatingCount: { fontSize: 12, fontWeight: '500' },
  previewDot: { fontSize: 14, fontWeight: '500' },
  previewDist: { fontSize: 13, fontWeight: '600' },
  previewCategory: { fontSize: 13, fontWeight: '500' },
  previewStatusRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 2 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 10, fontWeight: '700' },
  closedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  closedText: { fontSize: 10, fontWeight: '700' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  verifiedText: { fontSize: 10, fontWeight: '700' },
  previewActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  previewAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  previewActionText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  dragUpHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  dragUpText: { fontSize: 11, fontWeight: '500' },

  // ── List (Full Sheet) ─────────────────────────────────────────────────
  listContainer: { flex: 1, paddingHorizontal: SPACING.lg },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  listTitle: { fontSize: 18, fontWeight: '800' },
  filterToggleBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Discovery
  discoveryRow: { gap: SPACING.sm, marginBottom: SPACING.md },
  discoveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  discoveryIcon: { fontSize: 13 },
  discoveryLabel: { fontSize: 11, fontWeight: '700' },

  // Saved Layer Toggle
  savedLayerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  savedLayerText: { fontSize: 12, fontWeight: '600' },
  savedLayerCount: { fontSize: 11, fontWeight: '700' },

  // Offline Bar
  offlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  offlineText: { fontSize: 11, fontWeight: '600' },

  // Results
  resultsList: { paddingBottom: 20 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  resultImage: { width: 56, height: 56, borderRadius: RADIUS.md },
  resultInfo: { flex: 1, gap: 3 },
  resultTopRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultName: { fontSize: 14, fontWeight: '700', flex: 1 },
  resultMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  resultRating: { fontSize: 12, fontWeight: '700' },
  resultCategory: { fontSize: 11, fontWeight: '500' },
  resultDist: { fontSize: 11, fontWeight: '500' },
  resultBadges: { flexDirection: 'row', gap: 4, marginTop: 2 },
  resultBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  resultBadgeText: { fontSize: 9, fontWeight: '700' },
  resultSaveBtn: { padding: 4 },

  // ── Empty State ───────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.lg },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: SPACING.sm },
  emptyDesc: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginBottom: SPACING.xl },
  emptyActions: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  emptyBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  addPlaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  addPlaceText: { fontSize: 12, fontWeight: '600' },

  // ── Filter Panel ──────────────────────────────────────────────────────
  filterContainer: { flex: 1, paddingHorizontal: SPACING.lg },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  filterTitle: { fontSize: 18, fontWeight: '800' },
  filterResetText: { fontSize: 13, fontWeight: '700' },
  filterScrollContent: { paddingBottom: SPACING.xxxl },
  filterSectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: SPACING.sm, marginTop: SPACING.lg, textTransform: 'uppercase', letterSpacing: 0.5 },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  sortIcon: { fontSize: 13 },
  sortLabel: { fontSize: 12, fontWeight: '600' },
  sliderRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  sliderDot: {
    height: 34,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sliderLabel: { fontWeight: '700' },
  toggleRow: { gap: SPACING.sm },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  toggleCheck: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  toggleLabel: { fontSize: 13, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', gap: SPACING.sm },
  ratingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  ratingBtnText: { fontSize: 12, fontWeight: '700' },
  applyBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  applyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  // ── Navigation ────────────────────────────────────────────────────────
  navContainer: { flex: 1, paddingHorizontal: SPACING.lg },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  navTitle: { fontSize: 18, fontWeight: '800' },
  navCloseText: { fontSize: 14, fontWeight: '700' },
  travelModeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  travelModeBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  travelModeIcon: { fontSize: 20 },
  travelModeLabel: { fontSize: 11, fontWeight: '600' },
  routeCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  routeInfoRow: { flexDirection: 'row', gap: SPACING.md },
  routeInfoText: { flex: 1 },
  routeLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  routeValue: { fontSize: 13, fontWeight: '700' },
  routeDivider: { height: 1, marginVertical: 4 },
  routeStats: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.sm },
  routeStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  routeStatValue: { fontSize: 13, fontWeight: '800' },
  routeStatLabel: { fontSize: 10, fontWeight: '600' },
  startNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  startNavText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  // ── AI Search Overlay ─────────────────────────────────────────────────
  aiOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: 120,
  },
  aiPanel: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    elevation: 10,
  },
  aiPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  aiPanelHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  aiPanelTitle: { fontSize: 17, fontWeight: '800' },
  aiExamples: { gap: SPACING.sm, marginBottom: SPACING.lg },
  aiExampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  aiExampleIcon: { fontSize: 16 },
  aiExampleLabel: { fontSize: 13, fontWeight: '500' },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  aiInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  aiSendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
