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
  Linking,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore, Business } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';
import { haversineKm, formatDistance, fetchBusinesses } from '../services/dataService';
import { smartSearch, fetchTrendingSearches } from '../services/searchService';
import { searchPlaces, mapPlaceTypeToCategory, getCategoryLabel, getPhotoUrl } from '../services/osmPlaces';
import type { PlaceResult } from '../services/osmPlaces';
import * as Location from 'expo-location';
import WebMapView from '../components/WebMapView';
import type { MapMarkerData, Region } from '../components/WebMapView';

// ── Search Categories ────────────────────────────────────────────────────
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
  { icon: '🎵', name: 'Nightlife', categoryId: 'club' },
  { icon: '💪', name: 'Gyms', categoryId: 'gym' },
  { icon: '💇', name: 'Salons', categoryId: 'salon' },
];

// ── Example & Trending ──────────────────────────────────────────────────
const EXAMPLE_SEARCHES = [
  'Coffee in Bole',
  'Hotels near Airport',
  'Pharmacy near me',
  'Traditional Ethiopian food',
  'Best breakfast in Addis',
];

// ── Filter Types ─────────────────────────────────────────────────────────
type FilterKey = 'distance' | 'rating' | 'openNow' | 'verifiedOnly';
interface FilterState {
  distance: boolean;
  rating: boolean;
  openNow: boolean;
  verifiedOnly: boolean;
}

// ── Helper: parse distance string to km number ────────────────────────────
function parseDistanceKm(d: string): number {
  if (!d || d === '— km') return 999;
  const val = parseFloat(d);
  if (isNaN(val)) return 999;
  if (d.includes(' m')) return val / 1000;
  return val;
}

// ── Emoji by category ─────────────────────────────────────────────────────
function getEmoji(catId: string): string {
  const map: Record<string, string> = {
    food: '🍽️', cafe: '☕', hotel: '🏨', health: '🏥',
    shop: '🛍️', club: '🎵', fuel: '⛽', finance: '🏦',
    atm: '🏧', edu: '🏫', gym: '💪', salon: '💇',
    electronics: '📱', sports: '🚲', realestate: '🏠',
    carwash: '🚿', auto: '🚗', loan: '💰', tech: '💻',
    church: '⛪', government: '🏛️', park: '🌳',
    culture: '🎭', transport: '🚌',
  };
  return map[catId] || '📍';
}

// ── Natural language → category ID mapper ───────────────────────────────
function extractCategoryFromQuery(query: string): string {
  const q = query.toLowerCase();
  if (q.match(/\bhotel|\bhotel|\bhostel|\bmotel|\binn\b|\baccommodat/)) return 'hotel';
  if (q.match(/\bcafe|\bcoffee|\bcapuccino|\bcappuccino|\blatte|\bespresso/)) return 'cafe';
  if (q.match(/\brestaurant|\bfood|\beat|\bdining|\blunch|\bdinner|\bbreakfast/)) return 'food';
  if (q.match(/\bpharmacy|\bpharmacies|\bmedicine|\bdrug store/)) return 'health';
  if (q.match(/\bclinic|\bhospital|\bdoctor|\bhealth|\bmedical/)) return 'health';
  if (q.match(/\bbank|\batm|\bfinance/)) return 'finance';
  if (q.match(/\bfuel|\bpetrol|\bgas station/)) return 'fuel';
  if (q.match(/\bshop|\bshopping|\bmall|\bstore|\bmarket/)) return 'shop';
  if (q.match(/\bschool|\buniversity|\bcollege|\bedu/)) return 'edu';
  if (q.match(/\bgym|\bfitness|\bworkout/)) return 'gym';
  if (q.match(/\bbar|\bpub|\bnightclub|\bnightlife|\bclub/)) return 'club';
  if (q.match(/\bsalon|\bhair|\bbeauty|\bspa/)) return 'salon';
  return '';
}

export const SearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const {
    searchQuery, setSearchQuery,
    searchCategoryFilter, setSearchCategoryFilter,
    businesses, savedPlaces, toggleSavedPlace,
  } = useAppStore();

  // ── State ───────────────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Coffee in Bole',
    'Hotels near Airport',
    'Traditional Food',
    'Open Pharmacy',
  ]);
  const [dynamicTrending, setDynamicTrending] = useState<{label: string, icon: string}[]>([
    { label: 'Best Coffee Shops', icon: '☕' },
    { label: 'Top Restaurants', icon: '🍽️' },
    { label: 'Family Hotels', icon: '🏨' },
    { label: 'Popular Attractions', icon: '🎯' },
  ]);
  const [activeResultTab, setActiveResultTab] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState<FilterState>({
    distance: false, rating: false, openNow: false, verifiedOnly: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [osmResults, setOsmResults] = useState<any[]>([]);
  const [isSearchingOsm, setIsSearchingOsm] = useState(false);
  const [supabaseResults, setSupabaseResults] = useState<Business[]>([]);
  const osmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sbTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const miniMapRef = useRef<any>(null);

  // ── Initial load dynamic data ──────────────────────────────────────────
  useEffect(() => {
    async function loadTrending() {
      const trending = await fetchTrendingSearches(5);
      if (trending && trending.length > 0) {
        setDynamicTrending(trending.map(t => ({
          label: t,
          icon: extractCategoryFromQuery(t) ? getEmoji(extractCategoryFromQuery(t)) : '🔥'
        })));
      }
    }
    loadTrending();
  }, []);

  // ── Request GPS on mount ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        // Cached first for speed
        const cached = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
        if (mounted && cached) {
          setUserLocation({ latitude: cached.coords.latitude, longitude: cached.coords.longitude });
        }
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (mounted) {
          setUserLocation({ latitude: fresh.coords.latitude, longitude: fresh.coords.longitude });
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (osmTimeoutRef.current) clearTimeout(osmTimeoutRef.current);
      if (sbTimeoutRef.current) clearTimeout(sbTimeoutRef.current);
    };
  }, []);

  // ── Real GPS distance helper ──────────────────────────────────────────
  const getRealDistance = useCallback((lat: number, lng: number): string => {
    if (!userLocation) return '— km';
    const dist = haversineKm(userLocation.latitude, userLocation.longitude, lat, lng);
    return formatDistance(dist);
  }, [userLocation]);

  // ── Local businesses with real GPS distances ───────────────────────────
  const localBusinesses = useMemo((): Business[] => {
    if (!userLocation) return businesses;
    return [...businesses]
      .map((b) => ({
        ...b,
        distance: getRealDistance(b.latitude, b.longitude),
      }))
      .sort((a, b) => {
        const da = haversineKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const db = haversineKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
        return da - db;
      });
  }, [businesses, userLocation, getRealDistance]);

  // ── OSM text search debounce ─────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setOsmResults([]);
      return;
    }
    if (osmTimeoutRef.current) clearTimeout(osmTimeoutRef.current);

    osmTimeoutRef.current = setTimeout(async () => {
      setIsSearchingOsm(true);
      try {
        const results = await searchPlaces(
          searchQuery,
          userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : undefined,
          8000,
        );
        setOsmResults(results);
      } catch {
        setOsmResults([]);
      } finally {
        setIsSearchingOsm(false);
      }
    }, 400);

    return () => {
      if (osmTimeoutRef.current) clearTimeout(osmTimeoutRef.current);
    };
  }, [searchQuery, userLocation]);

  // ── Supabase registered businesses search (parallel to OSM) ──────────
  // Fires on both text query AND category filter so registered
  // businesses always appear first in results.
  useEffect(() => {
    const query = searchQuery.trim();
    const catId = searchCategoryFilter;

    if (!query && !catId) {
      setSupabaseResults([]);
      return;
    }

    if (sbTimeoutRef.current) clearTimeout(sbTimeoutRef.current);
    sbTimeoutRef.current = setTimeout(async () => {
      try {
        // Smart: extract a category from the natural language query
        // e.g. "Hotels near Airport" → categoryId='hotel'
        const extractedCat = catId || extractCategoryFromQuery(query);
        // For the text part, strip common location phrases so Supabase
        // searches the business name more precisely
        const cleanQuery = query
          .replace(/\b(near|in|around|at|close to|by)\s+\S+/gi, '')
          .trim();

        const results = await smartSearch({
          query: cleanQuery,
          categoryId: extractedCat || undefined,
          userLat: userLocation?.latitude,
          userLng: userLocation?.longitude,
          cityId: useAppStore.getState().selectedCity,
          limit: 50
        });
        setSupabaseResults(results);
      } catch {
        setSupabaseResults([]);
      }
    }, 300);

    return () => {
      if (sbTimeoutRef.current) clearTimeout(sbTimeoutRef.current);
    };
  }, [searchQuery, searchCategoryFilter, userLocation]);

  // ── Map OSM results to Business-like objects ───────────────────────────
  const mappedOsmResults = useMemo(() => {
    return osmResults.map((place: PlaceResult) => {
      const lat = place.geometry.location.lat;
      const lng = place.geometry.location.lng;
      return {
        id: place.place_id,
        name: place.name,
        category: getCategoryLabel(place.types || []),
        categoryId: mapPlaceTypeToCategory(place.types || []),
        rating: place.rating || 0,
        reviews: place.user_ratings_total || 0,
        distance: getRealDistance(lat, lng),
        latitude: lat,
        longitude: lng,
        image: place.photos?.[0]
          ? getPhotoUrl(place.photos[0].photo_reference, 400)
          : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        verified: place.business_status === 'OPERATIONAL',
        description: place.formatted_address || place.vicinity || '',
        hours: place.opening_hours?.open_now ? 'Open Now' : undefined,
        address: place.formatted_address || place.vicinity || '',
        phone: place.formatted_phone_number,
        website: place.website,
      };
    });
  }, [osmResults, getRealDistance]);

  // ── Filtered Results — registered businesses FIRST, then OSM ─────────
  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const categoryFilter = searchCategoryFilter;

    // ── 1. Start with registered Supabase businesses (always shown) ──
    let registeredItems: any[] = supabaseResults;

    // Apply category filter to local businesses too when no supabase results yet
    let localFiltered = localBusinesses;
    if (categoryFilter) {
      localFiltered = localFiltered.filter((b) => b.categoryId === categoryFilter);
    }
    if (query) {
      localFiltered = localFiltered.filter(
        (b) =>
          b.name?.toLowerCase().includes(query) ||
          b.category?.toLowerCase().includes(query) ||
          b.address?.toLowerCase().includes(query),
      );
    }

    // Merge local businesses not already in supabaseResults (by id)
    const supabaseIds = new Set(registeredItems.map((b) => b.id));
    const extraLocal = localFiltered.filter((b) => !supabaseIds.has(b.id));
    registeredItems = [...registeredItems, ...extraLocal];

    // ── 2. OSM results — exclude duplicates (by name+coords) ────────
    const registeredKeys = new Set(
      registeredItems.map((b) => `${b.name.toLowerCase().trim()}|${b.latitude?.toFixed(3)}|${b.longitude?.toFixed(3)}`)
    );
    const osmFiltered = mappedOsmResults.filter((o) => {
      const key = `${o.name.toLowerCase().trim()}|${o.latitude?.toFixed(3)}|${o.longitude?.toFixed(3)}`;
      return !registeredKeys.has(key);
    });

    // Category filter on OSM results too
    let osmFinal = osmFiltered;
    if (categoryFilter) {
      osmFinal = osmFiltered.filter((o) => o.categoryId === categoryFilter);
    }

    // ── 3. Merge: registered first, then OSM ────────────────────────
    let results: any[] = [...registeredItems, ...osmFinal];

    // Result tab filters
    if (activeResultTab !== 'All') {
      const tabMap: Record<string, string | string[]> = {
        Restaurants: 'food',
        Hotels: 'hotel',
        Services: ['health', 'finance', 'edu', 'gym'],
      };
      const mapped = tabMap[activeResultTab];
      if (mapped) {
        results = results.filter((b) =>
          Array.isArray(mapped) ? mapped.includes(b.categoryId) : b.categoryId === mapped
        );
      }
    }

    // Apply toggled filters
    if (filters.openNow) {
      results = results.filter((b: any) => {
        const h = (b.hours || '').toLowerCase();
        return h.includes('24') || h.includes('open');
      });
    }
    if (filters.verifiedOnly) {
      results = results.filter((b: any) => b.verified);
    }
    if (filters.rating) {
      results = [...results].sort((a: any, b: any) => b.rating - a.rating);
    }
    if (filters.distance) {
      results = [...results].sort((a: any, b: any) => {
        return parseDistanceKm(a.distance) - parseDistanceKm(b.distance);
      });
    }

    return results;
  }, [localBusinesses, supabaseResults, mappedOsmResults, searchQuery, searchCategoryFilter, activeResultTab, filters]);

  // ── Markers for map view ──────────────────────────────────────────────
  const markerData = useMemo((): MapMarkerData[] => {
    return filteredResults.map((biz: any) => ({
      id: biz.id,
      latitude: biz.latitude,
      longitude: biz.longitude,
      emoji: getEmoji(biz.categoryId),
      color: biz.verified ? '#34A853' : '#EA4335',
      isSelected: false,
    }));
  }, [filteredResults]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (query: string) => {
      const category = SEARCH_CATEGORIES.find((c) => c.name === query);
      if (category) {
        setSearchCategoryFilter(category.categoryId);
        setSearchQuery('');
        return;
      }

      setSearchQuery(query);
      setSearchCategoryFilter('');

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
    setOsmResults([]);
    setActiveResultTab('All');
    inputRef.current?.focus();
  }, [setSearchQuery, setSearchCategoryFilter]);

  const toggleFilter = useCallback((key: FilterKey) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Directions button (opens Google Maps) ───────────────────────────
  const openDirections = useCallback((biz: any) => {
    const lat = biz.latitude;
    const lng = biz.longitude;
    const label = encodeURIComponent(biz.name || 'Destination');
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://app?daddr=${lat},${lng}&q=${label}`).catch(() => {
        Linking.openURL(`https://maps.google.com/maps?daddr=${lat},${lng}`);
      });
    } else {
      Linking.openURL(`https://maps.google.com/maps?daddr=${lat},${lng}&q=${label}`);
    }
    Vibration.vibrate(10);
  }, []);

  // ── Call button ─────────────────────────────────────────────────────
  const callBusiness = useCallback((phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const hasQuery = searchQuery.trim().length > 0 || searchCategoryFilter.length > 0;

  // ── Indicate when Supabase + OSM are both being searched ─────────────
  const isSearching = isSearchingOsm;

  // ── Mini Map initial region ─────────────────────────────────────────
  const mapInitialRegion = useMemo((): Region => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return { latitude: 9.02, longitude: 38.74, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }, [userLocation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ════════════════════════════════════════════════════════════════
          SEARCH BAR (Fixed at Top)
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
            autoFocus={false}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary, colors.accent, colors.violet]}
            progressBackgroundColor={colors.card}
          />
        }
      >
        {!hasQuery ? (
          // ════════════════════════════════════════════════════════════════
          // EMPTY STATE — Examples, Recent, Trending, Categories
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
              {recentSearches.length === 0 ? (
                <Text style={[styles.emptyRecent, { color: colors.textMuted }]}>No recent searches</Text>
              ) : (
                recentSearches.map((search, idx) => (
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
                ))
              )}
            </View>

            {/* Trending Searches */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Trending Searches</Text>
              <View style={styles.trendGrid}>
                {dynamicTrending.map((item, idx) => (
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
                {SEARCH_CATEGORIES.map((cat, idx) => {
                  const isActive = searchCategoryFilter === cat.categoryId;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        if (isActive) {
                          setSearchCategoryFilter('');
                        } else {
                          setSearchCategoryFilter(cat.categoryId);
                        }
                      }}
                      style={[
                        styles.catItem,
                        {
                          backgroundColor: isActive ? colors.primaryGlow : colors.card,
                          borderColor: isActive ? colors.primary + '66' : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.catIcon}>{cat.icon}</Text>
                      <Text style={[
                        styles.catName,
                        { color: isActive ? colors.primary : colors.textSub },
                        isActive && { fontWeight: '700' },
                      ]}>
                        {cat.name}
                      </Text>
                      {isActive && (
                        <View style={[styles.catActiveBadge, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={8} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
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
              {['All', 'Places', 'Restaurants', 'Hotels', 'Services', 'Photos'].map((tab) => {
                const isActive = activeResultTab === tab;
                const tabCount = tab === 'All' ? filteredResults.length
                  : tab === 'Restaurants' ? filteredResults.filter((b: any) => b.categoryId === 'food').length
                  : tab === 'Hotels' ? filteredResults.filter((b: any) => b.categoryId === 'hotel').length
                  : tab === 'Services' ? filteredResults.filter((b: any) => ['health', 'finance', 'edu', 'gym'].includes(b.categoryId)).length
                  : tab === 'Photos' ? filteredResults.filter((b: any) => b.image).length
                  : filteredResults.length;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveResultTab(tab)}
                    style={[
                      styles.tabItem,
                      isActive && { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '44' },
                    ]}
                  >
                    <Text style={[
                      styles.tabText,
                      { color: isActive ? colors.primary : colors.textMuted },
                      isActive && { fontWeight: '800' },
                    ]}>
                      {tab} {tabCount > 0 && `(${tabCount})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Filter Chips + View Switcher */}
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

            {/* Results Header */}
            {filteredResults.length > 0 && (
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: colors.textSub }]}>
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                  {isSearching && searchQuery.trim() ? ' • Searching more...' : ''}
                </Text>
              </View>
            )}

            {/* Results / Empty */}
            {viewMode === 'list' && filteredResults.length > 0 ? (
              filteredResults.map((business) => {
                const isSaved = savedPlaces.includes(business.id);
                return (
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
                          <Text style={[styles.resultCategory, { color: colors.textMuted }]}>
                            {getEmoji(business.categoryId)} {business.category}
                          </Text>
                          <View style={styles.resultMeta}>
                            <View style={styles.resultRating}>
                              <Ionicons name="star" size={12} color={colors.gold} />
                              <Text style={[styles.resultScore, { color: colors.text }]}>{business.rating?.toFixed(1)}</Text>
                              <Text style={[styles.resultReviews, { color: colors.textMuted }]}>
                                ({business.reviews})
                              </Text>
                            </View>
                            <Text style={[styles.resultDot, { color: colors.textMuted }]}> • </Text>
                            <Ionicons name="location" size={11} color={colors.textMuted} />
                            <Text style={[styles.resultDist, { color: colors.textMuted }]}>{business.distance}</Text>
                          </View>
                          {business.hours?.includes('24') || business.hours?.includes('Open') ? (
                            <View style={[styles.openBadge, { backgroundColor: colors.accentGlow }]}>
                              <View style={[styles.openDot, { backgroundColor: colors.accent }]} />
                              <Text style={[styles.openText, { color: colors.accent }]}>Open now</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Action Buttons — FULLY FUNCTIONAL */}
                    <View style={[styles.resultActions, { borderTopColor: colors.border }]}>
                      <TouchableOpacity
                        onPress={() => openDirections(business)}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>Directions</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => callBusiness(business.phone)}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="call-outline" size={16} color={colors.accent} />
                        <Text style={[styles.actionText, { color: colors.accent }]}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => toggleSavedPlace(business.id)}
                        style={styles.actionBtn}
                      >
                        <Ionicons
                          name={isSaved ? 'heart' : 'heart-outline'}
                          size={16}
                          color={isSaved ? colors.danger : colors.textMuted}
                        />
                        <Text style={[styles.actionText, { color: isSaved ? colors.danger : colors.textMuted }]}>
                          {isSaved ? 'Saved' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : viewMode === 'map' && filteredResults.length > 0 ? (
              /* REAL MAP VIEW — replaces fake placeholder */
              <View style={[styles.mapContainer, { borderColor: colors.border }]}>
                <WebMapView
                  ref={miniMapRef}
                  style={styles.mapWebView}
                  initialRegion={mapInitialRegion}
                  markers={markerData}
                  showsUserLocation={!!userLocation}
                />
                <View style={[styles.mapOverlay, { backgroundColor: colors.glassBg }]}>
                  <Ionicons name="location" size={13} color={colors.primary} />
                  <Text style={[styles.mapOverlayText, { color: colors.text }]}>
                    {filteredResults.length} places on map
                  </Text>
                  <TouchableOpacity onPress={() => setViewMode('list')}>
                    <Text style={[styles.mapOverlayLink, { color: colors.primary }]}>List view</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Empty State */
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryGlow }]}>
                  <Ionicons name="search-outline" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {searchQuery.trim()
                    ? `No results for "${searchQuery}"`
                    : 'Try different keywords or browse categories'}
                </Text>
                <View style={styles.emptyTips}>
                  {['Try different keywords', 'Browse nearby areas', 'Explore broader categories'].map((tip, i) => (
                    <View key={i} style={styles.emptyTipRow}>
                      <Text style={{ color: colors.primary }}>• </Text>
                      <Text style={[styles.emptyTipText, { color: colors.textSub }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/add-place')}
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="add" size={18} color="#FFF" />
                  <Text style={styles.emptyBtnText}>Suggest New Place</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* AI Search Section (Phase 2) */}
            {filteredResults.length > 0 && (
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
  emptyRecent: { fontSize: 13, fontWeight: '500', fontStyle: 'italic' },

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
    position: 'relative',
  },
  catIcon: { fontSize: 28 },
  catName: { fontSize: 12, fontWeight: '600' },
  catActiveBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

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
  resultActions: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  actionText: { fontSize: 11, fontWeight: '700' },

  // ── Map View ────────────────────────────────────────────────────────
  mapContainer: {
    borderRadius: RADIUS.xl, height: 320, borderWidth: 1,
    overflow: 'hidden', marginBottom: SPACING.lg, position: 'relative',
  },
  mapWebView: { flex: 1 },
  mapOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
  },
  mapOverlayText: { flex: 1, fontSize: 13, fontWeight: '600' },
  mapOverlayLink: { fontSize: 12, fontWeight: '700' },

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
