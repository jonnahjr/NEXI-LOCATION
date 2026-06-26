import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Linking,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Vibration,
    Alert,
    Share,
} from 'react-native';
import WebMapView, { WebMapViewRef, MapMarkerData, Region, MapLayerType, Bounds } from '../components/WebMapView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAppStore, Business } from '../store/appStore';
import { RADIUS, SPACING, useTheme } from '../theme/colors';
import { searchPlaces, searchNearby, mapPlaceTypeToCategory, getCategoryLabel, getPhotoUrl } from '../services/googlePlaces';
import { fetchBusinessesByBounds } from '../services/dataService';
import type { PlaceResult } from '../services/googlePlaces';

// ── In-Memory Map Cache (viewport-based) ──────────────────────────────────
// Cache key format: "{zoom}-{boundsKey}" where boundsKey is rounded to 3 decimals
// TTL: 30 seconds for small pans, 60 seconds for same region
interface MapCacheEntry {
  data: any[];
  timestamp: number;
  ttl: number;
}
const mapCache = new Map<string, MapCacheEntry>();
const MAP_CACHE_TTL_SMALL = 30_000;   // 30s for small pans
const MAP_CACHE_TTL_LARGE = 60_000;   // 60s for same region

function getMapBoundsKey(bounds: Bounds): string {
  const swLat = bounds.southWest.lat.toFixed(3);
  const swLng = bounds.southWest.lng.toFixed(3);
  const neLat = bounds.northEast.lat.toFixed(3);
  const neLng = bounds.northEast.lng.toFixed(3);
  return `${swLat}_${swLng}_${neLat}_${neLng}`;
}

function getCacheKey(bounds: Bounds, zoom: number, categoryId?: string): string {
  return `z${zoom}-${getMapBoundsKey(bounds)}-${categoryId || 'all'}`;
}

function getCacheEntry(key: string): { data: any[] } | null {
  const entry = mapCache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age > entry.ttl) {
    mapCache.delete(key);
    return null;
  }
  return { data: entry.data };
}

function setCacheEntry(key: string, data: any[], ttl: number = MAP_CACHE_TTL_LARGE): void {
  mapCache.set(key, { data, timestamp: Date.now(), ttl });
  // Evict old entries if cache grows beyond 50
  if (mapCache.size > 50) {
    const oldest = [...mapCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) mapCache.delete(oldest[0]);
  }
}

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

// ── Haversine Distance Calculation (real GPS distance) ───────────────────
// Uses the haversine formula to calculate real distance between two GPS coordinates
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Map Layer Options ─────────────────────────────────────────────────────
const MAP_LAYERS: { id: MapLayerType; icon: string; label: string; desc: string }[] = [
  { id: 'standard', icon: '🗺️', label: 'Standard', desc: 'Default street map' },
  { id: 'light', icon: '☀️', label: 'Light', desc: 'Clean light theme' },
  { id: 'dark', icon: '🌙', label: 'Dark', desc: 'Dark mode map' },
  { id: 'satellite', icon: '🛰️', label: 'Satellite', desc: 'Satellite imagery' },
  { id: 'terrain', icon: '⛰️', label: 'Terrain', desc: 'Topographic view' },
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
  const { colors, isDark } = useTheme();
  const { businesses, savedPlaces, toggleSavedPlace } = useAppStore();

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
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<MapLayerType>('standard');
  const [isOffline, setIsOffline] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [filterDistance, setFilterDistance] = useState<number>(2);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterRatingMin, setFilterRatingMin] = useState(0);
  const [pinPreviewBiz, setPinPreviewBiz] = useState<typeof businesses[0] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [apiResults, setApiResults] = useState<PlaceResult[]>([]);
  const [nearbyResults, setNearbyResults] = useState<PlaceResult[]>([]);
  const [showTraffic, setShowTraffic] = useState(false);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const hasFetchedNearby = useRef(false);

  const mapRef = useRef<WebMapViewRef>(null);
  const searchInputRef = useRef<TextInput>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const sheetPanY = useRef(new Animated.Value(0)).current;
  const aiInputRef = useRef<TextInput>(null);
  
  // ── Viewport-based fetch refs ─────────────────────────────────────────
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewportBusinesses, setViewportBusinesses] = useState<any[]>([]);
  const [viewportLoading, setViewportLoading] = useState(false);
  const lastBoundsRef = useRef<string | null>(null);

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

  // ── Real GPS distance helper ───────────────────────────────────────────
  const getRealDistance = useCallback((lat: number, lng: number): string => {
    if (!userLocation) return '— km';
    const dist = haversineDistance(userLocation.latitude, userLocation.longitude, lat, lng);
    if (dist < 1) return `${(dist * 1000).toFixed(0)} m`;
    return `${dist.toFixed(1)} km`;
  }, [userLocation]);

  // ── Merge nearby API results with local businesses ───────────────────
  const mergedBusinesses = useMemo(() => {
    // Priority: viewport-fetched data > nearby API results > store businesses
    // Viewport data comes from the backend bbox query (fast, scoped to visible area)
    if (viewportBusinesses.length > 0) {
      return viewportBusinesses.map((b: any) => ({
        ...b,
        source: 'viewport',
        distance: getRealDistance(b.latitude, b.longitude),
      }));
    }

    if (nearbyResults.length === 0) {
      // Fallback: store businesses with real distances
      return businesses.map((b: any) => ({
        ...b,
        source: 'local',
        distance: getRealDistance(b.latitude, b.longitude),
      }));
    }
    
    // Nearby API results merged with store businesses
    const apiBiz = nearbyResults.map((place) => {
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
        hours: place.opening_hours?.open_now ? 'Open Now (AM)' : undefined,
        address: place.formatted_address || place.vicinity || '',
        source: 'google_api',
      };
    });
    
    const localBiz = businesses.map((b: any) => ({ ...b, source: 'local' }));
    return [...apiBiz, ...localBiz];
  }, [viewportBusinesses, nearbyResults, businesses, getRealDistance]);

  // ── Map Google Places API results to Business-like objects ─────────────
  const mappedApiResults = useMemo(() => {
    return apiResults.map((place) => {
      const lat = place.geometry.location.lat;
      const lng = place.geometry.location.lng;
      const distance = getRealDistance(lat, lng);
      
      return {
        id: place.place_id,
        name: place.name,
        category: getCategoryLabel(place.types || []),
        categoryId: mapPlaceTypeToCategory(place.types || []),
        rating: place.rating || 0,
        reviews: place.user_ratings_total || 0,
        distance,
        latitude: lat,
        longitude: lng,
        image: place.photos?.[0]
          ? getPhotoUrl(place.photos[0].photo_reference, 400)
          : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        verified: place.business_status === 'OPERATIONAL',
        description: place.formatted_address || place.vicinity || '',
        hours: place.opening_hours?.open_now ? 'Open Now (AM)' : undefined,
        address: place.formatted_address || place.vicinity || '',
      };
    });
  }, [apiResults, getRealDistance]);

  // ── Filtered & Sorted Businesses (with real GPS distances) ───────────
  const filteredBusinesses = useMemo(() => {
    // Determine source: API results when searching, local businesses otherwise
    let results: any[];
    const isApiMode = mappedApiResults.length > 0;
    
    if (isApiMode) {
      results = mappedApiResults;
    } else {
      // Calculate real GPS distances for merged businesses (local + Google API)
      results = mergedBusinesses.map((b: any) => ({
        ...b,
        distance: getRealDistance(b.latitude, b.longitude),
      }));
    }

    // Category filter (applies to both local and API results)
    if (activeFilter !== 'all') {
      results = results.filter((b: any) => b.categoryId === activeFilter);
    }

    // Discovery layer (local data only)
    if (!isApiMode) {
      if (activeDiscovery === 'trending') {
        results = [...results].sort((a: any, b: any) => b.reviews - a.reviews);
      } else if (activeDiscovery === 'top') {
        results = [...results].sort((a: any, b: any) => b.rating - a.rating);
      } else if (activeDiscovery === 'new') {
        results = results.slice(0, 20);
      } else if (activeDiscovery === 'reviewed') {
        results = [...results].sort((a: any, b: any) => b.reviews - a.reviews);
      }
    }

    // Search text (local data only — API already searched via text query)
    if (!isApiMode && searchText.trim()) {
      const q = searchText.toLowerCase();
      results = results.filter(
        (b: any) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q),
      );
    }

    // Filter: Open Now
    if (filterOpenNow) {
      results = results.filter((b: any) => b.hours?.includes('24') || b.hours?.includes('AM'));
    }

    // Filter: Verified Only
    if (filterVerified) {
      results = results.filter((b: any) => b.verified);
    }

    // Filter: Rating minimum
    if (filterRatingMin > 0) {
      results = results.filter((b: any) => b.rating >= filterRatingMin);
    }

    // Helper: parse distance string like "1.2 km" or "350 m" to km value
    const parseDistanceKm = (d: string): number => {
      if (!d || d === '— km') return 999;
      const val = parseFloat(d);
      if (isNaN(val)) return 999;
      if (d.includes(' m')) return val / 1000;
      return val; // already in km
    };

    // Filter: Distance (show all if distance field is '— km' from missing user location)
    if (filterDistance < 50) {
      results = results.filter((b: any) => {
        const dist = parseDistanceKm(b.distance);
        return dist <= filterDistance;
      });
    }

    // Sort (applies to both)
    if (sortBy === 'distance') {
      results = [...results].sort((a: any, b: any) => {
        return parseDistanceKm(a.distance) - parseDistanceKm(b.distance);
      });
    } else if (sortBy === 'rating') {
      results = [...results].sort((a: any, b: any) => b.rating - a.rating);
    } else if (sortBy === 'popularity') {
      results = [...results].sort((a: any, b: any) => b.reviews - a.reviews);
    }

    return results;
  }, [mergedBusinesses, activeFilter, activeDiscovery, searchText, filterOpenNow, filterVerified, filterRatingMin, filterDistance, sortBy, mappedApiResults, getRealDistance]);

  // ── Saved Places Set (O(1) lookups) ────────────────────────────────────
  const savedSet = useMemo(() => new Set(savedPlaces), [savedPlaces]);

  // ── Clustered Markers ───────────────────────────────────────────────────
  const clusteredMarkers = useMemo(() => {
    if (!currentRegion) return filteredBusinesses;
    // Skip clustering when zoomed in close (latitudeDelta < 0.01)
    if (currentRegion.latitudeDelta < 0.01) return filteredBusinesses;
    return clusterMarkers(filteredBusinesses, currentRegion, 0.015);
  }, [filteredBusinesses, currentRegion]);

  // ── Share business via native share sheet ────────────────────────────
  const shareBusiness = useCallback(async (biz: any) => {
    try {
      const lat = biz.latitude;
      const lng = biz.longitude;
      const label = biz.name || 'Destination';
      const mapsUrl = `https://maps.google.com/maps?q=${label}&daddr=${lat},${lng}`;
      await Share.share({
        message: `Check out ${label} on Nexi! 📍 ${mapsUrl}`,
        title: label,
      });
    } catch {}
  }, []);

  // ── Open external maps for navigation ─────────────────────────────────
  const openExternalMaps = useCallback((biz: any) => {
    const lat = biz.latitude;
    const lng = biz.longitude;
    const label = encodeURIComponent(biz.name || 'Destination');
    
    if (Platform.OS === 'ios') {
      // Apple Maps
      const url = `maps://app?daddr=${lat},${lng}&q=${label}`;
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        Linking.openURL(`https://maps.google.com/maps?daddr=${lat},${lng}&q=${label}`);
      });
    } else {
      // Google Maps app (Android)
      const url = `https://maps.google.com/maps?daddr=${lat},${lng}&q=${label}`;
      Linking.openURL(url);
    }
  }, []);

  // ── Emoji helper ────────────────────────────────────────────────────────
  const getEmoji = (catId: string) => {
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
  };

  // ── Marker Types ──────────────────────────────────────────────────────
  // Different pin colors/types for different place categories:
  // - Google-registered businesses (#EA4335 - Google Red)
  // - Verified businesses (#34A853 - Google Green)
  // - Saved places with heart overlay
  // - Open Now places with subtle glow
  // - User-added places (#FBBC04 - Google Yellow)

  // ── Convert clustered markers to MapMarkerData for WebMapView ───────────
  const markerData = useMemo((): MapMarkerData[] => {
    return clusteredMarkers.map((item: any) => {
      const isCluster = item.count && item.count > 1;
      if (isCluster) {
        return {
          id: item.id,
          latitude: item.latitude,
          longitude: item.longitude,
          emoji: '',
          color: '#4285F4',
          isSelected: selectedBusiness === item.id,
          count: item.count,
          markerType: 'cluster',
        };
      }
      
      // Determine marker type based on business properties (priority order)
      let markerColor: string = '#EA4335'; // Default Google Red
      let markerType: 'google_business' | 'verified' | '24hour' | 'popular' = 'google_business';
      
      // Priority: 24hr > Popular > Verified (most distinctive first)
      if (item.hours?.includes('24')) {
        markerColor = '#4285F4'; // Blue for 24-hour places
        markerType = '24hour';
      } else if (item.reviews > 200) {
        markerColor = '#EA4335'; // Red for popular places
        markerType = 'popular';
      } else if (item.verified) {
        markerColor = '#34A853'; // Google Green for verified
        markerType = 'verified';
      }
      
      return {
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        emoji: getEmoji(item.categoryId),
        color: markerColor,
        isSelected: selectedBusiness === item.id,
        isSaved: savedSet.has(item.id),
        showSavedLayer: showSavedLayer,
        markerType,
      };
    });
  }, [clusteredMarkers, selectedBusiness, savedSet, showSavedLayer]);

  // ── Selected Business ───────────────────────────────────────────────────
  const selectedBiz = selectedBusiness
    ? businesses.find((b) => b.id === selectedBusiness)
    : null;

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

  // ── Search via Google Places API when user types a query ─────────────
  useEffect(() => {
    if (!searchText.trim()) {
      setApiResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const results = await searchPlaces(
          searchText,
          userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : undefined,
          10000,
        );
        setApiResults(results);
      } catch {
        setApiResults([]);
      } finally {
        setIsSearchingApi(false);
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(timer);
  }, [searchText, userLocation]);

  // ── Fetch real Google Business data via Nearby Search on mount ───────
  useEffect(() => {
    if (!mapReady || !userLocation || hasFetchedNearby.current) return;
    hasFetchedNearby.current = true;
    
    const fetchNearby = async () => {
      try {
        // All categories user wants to see
        const categoryTypes = [
          'restaurant', 'cafe', 'hotel', 'hospital', 'pharmacy',
          'bank', 'atm', 'gas_station', 'shopping_mall', 'supermarket',
          'church', 'place_of_worship', 'mosque', 'school', 'university',
          'police', 'fire_station', 'post_office', 'embassy', 'courthouse',
          'night_club', 'bar', 'gym', 'spa', 'beauty_salon',
          'electronics_store', 'convenience_store',
        ];
        const allResults: PlaceResult[] = [];
        
        // First: broad search (no type) to grab top 20 closest places of any type
        const broadResults = await searchNearby(
          userLocation.latitude, userLocation.longitude, 3000
        ).catch(() => [] as PlaceResult[]);
        broadResults.forEach(p => allResults.push(p));

        // Then: fetch all specific categories in batches of 6 (parallel)
        const BATCH = 6;
        for (let i = 0; i < categoryTypes.length; i += BATCH) {
          const batch = categoryTypes.slice(i, i + BATCH);
          const batchResults = await Promise.all(
            batch.map((type) =>
              searchNearby(userLocation.latitude, userLocation.longitude, 3000, type)
                .catch(() => [] as PlaceResult[])
            )
          );
          batchResults.forEach((results) => results.forEach((place) => allResults.push(place)));
        }
        
        // Deduplicate by place_id
        const seen = new Set<string>();
        const deduped: PlaceResult[] = [];
        allResults.forEach((place) => {
          if (place.place_id && !seen.has(place.place_id)) {
            seen.add(place.place_id);
            deduped.push(place);
          }
        });
        
        setNearbyResults(deduped);
      } catch {
        // Silently fail - local data will be used as fallback
      }
    };
    
    fetchNearby();
  }, [mapReady, userLocation]);

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

  // ── Debounced viewport fetch ────────────────────────────────────────────
  const debouncedBoundsFetch = useCallback(
    (bounds: Bounds, zoom: number, categoryId?: string) => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      // Build cache key
      const cacheKey = getCacheKey(bounds, zoom, categoryId || activeFilter);
      
      // Check cache first
      const cached = getCacheEntry(cacheKey);
      if (cached) {
        setViewportBusinesses(cached.data);
        return;
      }

      // Debounce: wait 400ms before fetching on pan, 200ms after zoom ends
      const delay = lastBoundsRef.current === cacheKey ? 600 : 400;
      lastBoundsRef.current = cacheKey;

      fetchTimeoutRef.current = setTimeout(async () => {
        setViewportLoading(true);
        try {
          const data = await fetchBusinessesByBounds(
            bounds.southWest,
            bounds.northEast,
            categoryId || activeFilter,
          );
          
          // Cache with longer TTL if region hasn't changed much
          const ttl = zoom > 14 ? MAP_CACHE_TTL_SMALL : MAP_CACHE_TTL_LARGE;
          setCacheEntry(cacheKey, data, ttl);
          
          setViewportBusinesses(data);
        } catch {
          // Fall through — existing businesses stay
        } finally {
          setViewportLoading(false);
        }
      }, delay);
    },
    [activeFilter],
  );

  // ── Region Change Handler ───────────────────────────────────────────────
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setCurrentRegion(region);
    // Trigger viewport-based fetch if bounds are available
    if (region.northEast && region.southWest && region.zoom != null) {
      debouncedBoundsFetch(
        { northEast: region.northEast, southWest: region.southWest },
        region.zoom,
        activeFilter,
      );
    }
  }, [activeFilter, debouncedBoundsFetch]);

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

  // ── WebMapView Marker Press Handler ────────────────────────────────────
  const handleWebMarkerPress = useCallback((id: string) => {
    // Find the business/cluster by id in filteredBusinesses
    const biz = filteredBusinesses.find((b: any) => b.id === id);
    if (biz && !biz.count) {
      setPinPreviewBiz(biz);
      setSelectedBusiness(id);
      expandSheet('expanded');
    }
    // Clusters zoom in via WebView handler
  }, [filteredBusinesses, expandSheet]);

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
                onPress={() => shareBusiness(biz)}
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
                onPress={() => openExternalMaps(biz)}
                style={[styles.previewAction, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="navigate" size={16} color="#FFF" />
                <Text style={styles.previewActionText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (biz.phone) {
                    Linking.openURL(`tel:${biz.phone}`);
                  }
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
          {/* Discovery + Saved Row — no gap */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'nowrap', gap: 6 }}>
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
                  <Text style={[styles.discoveryLabel, { color: activeDiscovery === badge.id ? badge.color : colors.textSub }]}>
                    {badge.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
              <Text style={[styles.savedLayerText, { color: showSavedLayer ? colors.primary : colors.textSub }]}>
                {showSavedLayer ? 'Showing Saved' : 'Show Saved Places'}
              </Text>
              {showSavedLayer && (
                <Text style={[styles.savedLayerCount, { color: colors.primary }]}>
                  ({savedPlaces.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>

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
                      borderWidth: filterDistance === d ? 2 : 1,
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
        <WebMapView
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
          onMarkerPress={handleWebMarkerPress}
          onUserLocation={(loc) => setUserLocation(loc)}
          showsUserLocation={true}
          followsUserLocation={true}
          markers={markerData}
        />

        {/* ═══ Floating Search Bar (Top Center) ═══ */}
        <View
          style={[
            styles.searchOverlay,
            { paddingTop: insets.top + SPACING.sm },
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.glassSearchBar, { backgroundColor: '#000000', borderColor: '#000000' }]}>
            {/* Search Icon */}
            <Ionicons name="search" size={18} color="#FFFFFF" />

            {/* Input */}
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: '#FFFFFF' }]}
              placeholder="Search places, restaurants, hotels..."
              placeholderTextColor="#999999"
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
              {/* Voice Search - Focuses search input */}
              <TouchableOpacity
                onPress={() => {
                  searchInputRef.current?.focus();
                  Vibration.vibrate(10);
                }}
                style={styles.searchIconBtn}
              >
                <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
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
                  <Ionicons name="close-circle" size={18} color="#FFFFFF" />
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
                        backgroundColor: isActive ? cat.color : '#000000',
                        borderColor: isActive ? cat.color : '#000000',
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: isActive ? '#FFF' : '#FFFFFF' },
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

        {/* ═══ Zoom Controls (Left Side) ═══ */}
        <View style={styles.zoomControlsContainer} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => mapRef.current?.zoomIn()}
            style={[styles.zoomBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.zoomDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            onPress={() => mapRef.current?.zoomOut()}
            style={[styles.zoomBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
            activeOpacity={0.8}
          >
            <Ionicons name="remove" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* ═══ Current Location & Compass (Bottom Right) ═══ */}
        <View style={styles.locationBtnContainer} pointerEvents="box-none">
          {/* Compass Button */}
          <TouchableOpacity
            onPress={() => mapRef.current?.resetBearing()}
            style={[styles.locationBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
            activeOpacity={0.8}
          >
            <Ionicons name="compass" size={20} color={colors.textSub} />
          </TouchableOpacity>
          {/* Traffic Toggle */}
          <TouchableOpacity
            onPress={() => {
              const newVal = !showTraffic;
              setShowTraffic(newVal);
              mapRef.current?.setTraffic(newVal);
            }}
            style={[styles.locationBtn, { backgroundColor: showTraffic ? colors.accentGlow : colors.card, borderColor: colors.glassBorder }]}
            activeOpacity={0.8}
          >
            <Ionicons name="car" size={20} color={showTraffic ? colors.accent : colors.textSub} />
          </TouchableOpacity>
          {/* Location */}
          <TouchableOpacity
            onPress={centerOnUser}
            style={[styles.locationBtn, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={22} color={colors.primary} />
          </TouchableOpacity>
          {/* Layers */}
          <TouchableOpacity
            onPress={() => setShowLayerPanel(!showLayerPanel)}
            style={[styles.locationBtn, { backgroundColor: showLayerPanel ? colors.primaryGlow : colors.card, borderColor: colors.glassBorder }]}
            activeOpacity={0.8}
          >
            <Ionicons name="layers-outline" size={20} color={showLayerPanel ? colors.primary : colors.textSub} />
          </TouchableOpacity>
        </View>




        {/* ═══ Layer Panel (floating) ═══ */}
        {showLayerPanel && (
          <View style={[styles.layerPanel, { backgroundColor: colors.card, borderColor: colors.glassBorder }]} pointerEvents="box-none">
            <Text style={[styles.layerPanelTitle, { color: colors.text }]}>Map Style</Text>
            {MAP_LAYERS.map((layer) => (
              <TouchableOpacity
                key={layer.id}
                onPress={() => {
                  setCurrentLayer(layer.id);
                  mapRef.current?.setMapLayer(layer.id);
                  setShowLayerPanel(false);
                }}
                style={[
                  styles.layerOption,
                  {
                    backgroundColor: currentLayer === layer.id ? colors.primaryGlow : colors.surfaceAlt,
                    borderColor: currentLayer === layer.id ? colors.primary + '44' : 'transparent',
                  },
                ]}
              >
                <Text style={styles.layerOptionIcon}>{layer.icon}</Text>
                <View style={styles.layerOptionInfo}>
                  <Text style={[styles.layerOptionLabel, { color: colors.text }]}>{layer.label}</Text>
                  <Text style={[styles.layerOptionDesc, { color: colors.textMuted }]}>{layer.desc}</Text>
                </View>
                {currentLayer === layer.id && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

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
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0, color: '#FFFFFF' },
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
  chipsContainer: { marginTop: SPACING.sm, height: 34 },
  chipsScroll: { gap: SPACING.sm, paddingHorizontal: SPACING.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    elevation: 1,
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  chipIcon: { fontSize: 11 },
  chipLabel: { fontSize: 11, fontWeight: '700' },

  // ── Zoom Controls (Left Side) ────────────────────────────────────────
  zoomControlsContainer: {
    position: 'absolute',
    left: SPACING.md,
    bottom: 200,
    zIndex: 25,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  zoomDivider: { height: 1 },

  // ── Location / Actions (Bottom Right) ───────────────────────────────
  locationBtnContainer: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 160,
    zIndex: 25,
    gap: SPACING.sm,
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
    right: SPACING.md,
    bottom: 360,
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
  // (Markers are rendered inside the WebMapView using Leaflet/OSM)

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
    marginBottom: 6,
  },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  listTitle: { fontSize: 18, fontWeight: '800' },
  filterToggleBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Discovery
  discoveryRow: { gap: SPACING.sm, marginBottom: 0 },
  discoveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    elevation: 1,
  },
  discoveryIcon: { fontSize: 11 },
  discoveryLabel: { fontSize: 11, fontWeight: '700' },

  // Saved Layer Toggle
  savedLayerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginTop: 0,
    marginBottom: 4,
    alignSelf: 'flex-start',
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  sortIcon: { fontSize: 11 },
  sortLabel: { fontSize: 11, fontWeight: '600' },
  sliderRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  sliderDot: {
    height: 28,
    minWidth: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  sliderLabel: { fontWeight: '700', fontSize: 11 },
  toggleRow: { gap: SPACING.sm },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  toggleCheck: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  toggleLabel: { fontSize: 11, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', gap: SPACING.sm },
  ratingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  ratingBtnText: { fontSize: 11, fontWeight: '700' },
  applyBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  applyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  // ── Layer Panel ───────────────────────────────────────────────────────
  layerPanel: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    top: 160,
    zIndex: 35,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
    elevation: 8,
    maxWidth: 280,
    alignSelf: 'center',
  },
  layerPanelTitle: { fontSize: 16, fontWeight: '800', marginBottom: SPACING.sm },
  layerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  layerOptionIcon: { fontSize: 18 },
  layerOptionInfo: { flex: 1 },
  layerOptionLabel: { fontSize: 13, fontWeight: '700' },
  layerOptionDesc: { fontSize: 11, fontWeight: '500' },

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
