// ═══════════════════════════════════════════════════════════════════════════
// App Store — Zustand Global State
// Real Supabase Auth — no mock user. Session-driven.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Notification } from '../services/notifications';
import { syncAllData, savePlaceOnBackend, unsavePlaceOnBackend } from '../services/dataService';
import { signOut as authSignOut } from '../services/authService';
import { cacheGet, cacheSet, TTL, CACHE_KEYS } from '../services/cacheService';

// ── Types ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'business' | 'admin' | 'moderator';
  points: number;
  totalEarned: number;
  level: number;
  verified: boolean;
  createdAt: string;
  reviewCount: number;
  photoCount: number;
  city?: string;
  bio?: string;
  // extra fields from types package (optional)
  priceLevel?: number;
  ownerId?: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  rating: number;
  reviews: number;
  distance: string;
  latitude: number;
  longitude: number;
  image: string;
  verified: boolean;
  description: string;
  phone?: string;
  website?: string;
  hours?: string;
  address: string;
  city?: string;
  priceLevel?: number;
  features?: string[];
  status?: 'active' | 'pending' | 'rejected' | 'closed';
  ownerId?: string;
  // Enriched fields
  trendingScore?: number;
  recommendationScore?: number;
  isPromoted?: boolean;
  promotionType?: 'featured' | 'boosted' | 'banner';
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  text: string;
  images?: string[];
  createdAt: string;
  helpful: number;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'redeem';
  title: string;
  points: number;
  date: string;
  icon?: string;
}

export interface RewardOption {
  id: string;
  name: string;
  points: number;
  icon: string;
  available: boolean;
  category: string;
}

// ── Static data (unchanged by auth) ──────────────────────────────────────

export const MOCK_REVIEWS_DATA: Review[] = [
  { id: 'rev1', businessId: 'food-1', userId: 'u2', userName: 'John D.', rating: 5, text: 'Amazing food and fast service. The traditional coffee ceremony was unforgettable!', images: ['https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200'], createdAt: '2 days ago', helpful: 24, userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
  { id: 'rev2', businessId: 'food-1', userId: 'u3', userName: 'Sarah M.', rating: 5, text: 'Best Ethiopian restaurant in Addis. The live music creates such a vibrant atmosphere.', createdAt: '1 week ago', helpful: 18, userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
  { id: 'rev3', businessId: 'food-1', userId: 'u4', userName: 'Tewodros A.', rating: 4, text: 'Great food and service. Would recommend the platter for sharing.', createdAt: '2 weeks ago', helpful: 12 },
  { id: 'rev4', businessId: 'cafe-1', userId: 'u3', userName: 'Sarah M.', rating: 5, text: 'Best coffee in Addis! The single-origin Yirgacheffe is outstanding.', createdAt: '3 days ago', helpful: 22, userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
  { id: 'rev5', businessId: 'hotel-1', userId: 'u4', userName: 'Tewodros A.', rating: 5, text: 'World-class hotel with exceptional service. The gardens are stunning.', createdAt: '1 week ago', helpful: 28 },
];

export const MOCK_GALLERY = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
  'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
];

export const EARN_OPTIONS = [
  { id: 'e1', title: 'Daily Login', points: 5, icon: '📅', type: 'earn' as const, description: 'Open the app daily', action: 'daily_login' },
  { id: 'e2', title: 'Check In at Place', points: 10, icon: '📍', type: 'earn' as const, description: 'Visit a location on the map', action: 'checkin' },
  { id: 'e3', title: 'Write a Review', points: 50, icon: '✍️', type: 'earn' as const, description: 'Share your experience', action: 'review' },
  { id: 'e4', title: 'Add a Photo', points: 25, icon: '📸', type: 'earn' as const, description: 'Upload a place photo', action: 'photo' },
  { id: 'e5', title: 'Invite a Friend', points: 100, icon: '👥', type: 'earn' as const, description: 'Refer a new user to Nexi', action: 'referral' },
];

export const REDEEM_OPTIONS: RewardOption[] = [
  { id: 'r1', name: '☕ Free Coffee', points: 200, icon: '☕', available: true, category: 'food' },
  { id: 'r2', name: '🍕 Meal Voucher', points: 500, icon: '🍕', available: true, category: 'food' },
  { id: 'r3', name: '🚕 Ride Discount', points: 300, icon: '🚕', available: true, category: 'transport' },
  { id: 'r4', name: '🏋️ Gym Pass', points: 800, icon: '🏋️', available: false, category: 'fitness' },
  { id: 'r5', name: '📱 Phone Credit', points: 100, icon: '📱', available: true, category: 'tech' },
  { id: 'r6', name: '🎬 Cinema Ticket', points: 400, icon: '🎬', available: true, category: 'entertainment' },
];

// ── Fallback businesses (offline first) ───────────────────────────────────
export const FALLBACK_BUSINESSES: Business[] = [
  { id: 'food-1', name: 'Yod Abyssinia Restaurant', category: 'Ethiopian Cuisine', categoryId: 'food', rating: 4.8, reviews: 324, distance: '', latitude: 9.0227, longitude: 38.7468, image: 'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400', verified: true, description: 'Authentic Ethiopian cuisine with live music and traditional coffee ceremony.', phone: '+251-11-123-4567', hours: '8:00 AM - 10:00 PM', address: 'Bole Road, Addis Ababa' },
  { id: 'food-2', name: 'Kategna Restaurant', category: 'Ethiopian Cuisine', categoryId: 'food', rating: 4.7, reviews: 267, distance: '', latitude: 9.0215, longitude: 38.7485, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400', verified: true, description: 'High-quality traditional Ethiopian cuisine with extensive menu.', phone: '+251-11-667-2879', hours: '8:00 AM - 11:00 PM', address: 'Bole Medhane Alem, Addis Ababa' },
  { id: 'cafe-1', name: 'Tomoca Coffee', category: 'Coffee Shop', categoryId: 'cafe', rating: 4.6, reviews: 234, distance: '', latitude: 9.02, longitude: 38.75, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', verified: true, description: "Addis Ababa's iconic coffee shop since 1953.", phone: '+251-11-111-2498', hours: '6:00 AM - 10:00 PM', address: 'Wawel St, Addis Ababa' },
  { id: 'hotel-1', name: 'Sheraton Addis Hotel', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.8, reviews: 423, distance: '', latitude: 9.017, longitude: 38.751, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', verified: true, description: 'Iconic luxury hotel with premium service.', phone: '+251-11-517-1717', hours: '24 hours', address: 'Taitu Street, Addis Ababa' },
  { id: 'hotel-2', name: 'Hilton Addis Ababa', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.6, reviews: 512, distance: '', latitude: 9.025, longitude: 38.745, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true, description: 'Five-star luxury hotel with pools.', phone: '+251-11-517-0000', hours: '24 hours', address: 'Menelik II Ave, Addis Ababa' },
  { id: 'health-1', name: 'Black Lion Hospital', category: 'General Hospital', categoryId: 'health', rating: 4.2, reviews: 187, distance: '', latitude: 9.03, longitude: 38.74, image: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', verified: true, description: 'Leading public teaching hospital.', phone: '+251-11-551-3000', hours: '24 hours', address: 'King George VI Street, Addis Ababa' },
  { id: 'shop-1', name: 'Mercato - Addis Merkato', category: 'Market', categoryId: 'shop', rating: 4.0, reviews: 345, distance: '', latitude: 9.035, longitude: 38.735, image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400', verified: true, description: "Africa's largest open-air market.", hours: '8:00 AM - 7:00 PM', address: 'Merkato, Addis Ababa' },
  { id: 'shop-2', name: 'Edna Mall', category: 'Shopping Mall', categoryId: 'shop', rating: 4.3, reviews: 890, distance: '', latitude: 9.001, longitude: 38.784, image: 'https://images.unsplash.com/photo-1519567281023-e1262d182b8d?w=400', verified: true, description: 'Popular mall with cinema.', phone: '+251-11-661-6272', hours: '8:00 AM - 10:00 PM', address: 'Bole Medhane Alem, Addis Ababa' },
  { id: 'tech-1', name: 'iCog Labs', category: 'AI & Robotics', categoryId: 'tech', rating: 4.5, reviews: 67, distance: '', latitude: 9.016, longitude: 38.77, image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400', verified: true, description: 'AI research lab developing intelligent systems.', phone: '+251-11-554-1234', hours: '9:00 AM - 6:00 PM', address: 'Bole Road, Addis Ababa' },
  { id: 'gym-1', name: 'Vigor Fitness Laphto Mall', category: 'Fitness Center', categoryId: 'gym', rating: 4.8, reviews: 156, distance: '', latitude: 9.021, longitude: 38.747, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', verified: true, description: 'Premium fitness center with pool and spa.', phone: '+251-11-552-8800', hours: '6:00 AM - 10:00 PM', address: 'Laphto Mall, Old Airport, Addis Ababa' },
];

// ── Store State Interface ─────────────────────────────────────────────────

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Data
  businesses: Business[];
  recommendations: Business[];
  savedPlaces: string[];
  notifications: Notification[];
  isLoading: boolean;
  isOnline: boolean;
  lastSyncAt: number | null;
  unreadCount: number;

  // Search & Filter
  searchQuery: string;
  searchCategoryFilter: string;
  selectedCity: string;

  // Actions — Auth
  login: (user: User) => void;
  logout: () => Promise<void>;
  setAuthLoading: (loading: boolean) => void;
  updateUserPoints: (points: number, totalEarned: number, level: number) => void;
  refreshProfile: () => Promise<void>;

  // Actions — Data
  setBusinesses: (businesses: Business[]) => void;
  setRecommendations: (recommendations: Business[]) => void;
  setSavedPlaces: (ids: string[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  toggleSavedPlace: (id: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Actions — Search
  setSearchQuery: (query: string) => void;
  setSearchCategoryFilter: (category: string) => void;
  setSelectedCity: (city: string) => void;

  // Actions — Sync
  setOnline: (online: boolean) => void;
  setLoading: (loading: boolean) => void;
  syncFromBackend: () => Promise<void>;
}

// ── Store Implementation ──────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // ── Auth initial state ──────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  authLoading: true, // true until session check completes — blocks nav guard

  // ── Data initial state ──────────────────────────────────────────────
  businesses: FALLBACK_BUSINESSES,
  recommendations: [],
  savedPlaces: [],
  notifications: [],
  isLoading: false,
  isOnline: false,
  lastSyncAt: null,
  unreadCount: 0,

  // ── Search initial state ─────────────────────────────────────────────
  searchQuery: '',
  searchCategoryFilter: '',
  selectedCity: 'Addis Ababa',

  // ── Auth Actions ─────────────────────────────────────────────────────
  login: (user) => set({ user, isAuthenticated: true, authLoading: false }),

  logout: async () => {
    await authSignOut();
    set({
      user: null,
      isAuthenticated: false,
      authLoading: false,
      savedPlaces: [],
      notifications: [],
      unreadCount: 0,
      businesses: FALLBACK_BUSINESSES,
      recommendations: [],
    });
  },

  setAuthLoading: (loading) => set({ authLoading: loading }),

  updateUserPoints: (points, totalEarned, level) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, points, totalEarned, level } });
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const { fetchProfile } = await import('../services/authService');
      const updated = await fetchProfile(user.id);
      if (updated) set({ user: updated });
    } catch {
      // silently fail
    }
  },

  // ── Data Actions ─────────────────────────────────────────────────────
  setBusinesses: (businesses) => set({ businesses }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setSavedPlaces: (ids) => set({ savedPlaces: ids }),
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),

  toggleSavedPlace: async (id) => {
    const { savedPlaces } = get();
    const isSaved = savedPlaces.includes(id);
    if (isSaved) {
      set({ savedPlaces: savedPlaces.filter((s) => s !== id) });
      await unsavePlaceOnBackend(id);
    } else {
      set({ savedPlaces: [...savedPlaces, id] });
      await savePlaceOnBackend(id);
    }
  },

  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  // ── Search Actions ────────────────────────────────────────────────────
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchCategoryFilter: (category) => set({ searchCategoryFilter: category }),
  setSelectedCity: (city) => set({ selectedCity: city }),

  // ── Sync Actions ──────────────────────────────────────────────────────
  setOnline: (online) => set({ isOnline: online }),
  setLoading: (loading) => set({ isLoading: loading }),

  syncFromBackend: async () => {
    const { user } = get();
    if (!user) return;

    const bizCacheKey = CACHE_KEYS.businesses(get().selectedCity || 'all');

    try {
      // ── Step 1: Serve cached data instantly ──────────────────────────
      const cached = await cacheGet<{ businesses: any[]; savedPlaceIds: string[] }>(bizCacheKey);
      if (cached) {
        const cachedBiz = cached.data.businesses.length > 0
          ? cached.data.businesses
          : FALLBACK_BUSINESSES;
        set({
          businesses: cachedBiz,
          savedPlaces: cached.data.savedPlaceIds,
          isLoading: !cached.stale, // Only show loading if cache is stale
        });
        if (!cached.stale) return; // Fresh cache — no need to refetch
      } else {
        set({ isLoading: true });
      }

      // ── Step 2: Fetch fresh from network ─────────────────────────────
      const data = await syncAllData(user.id);
      const newBusinesses = data.businesses.length > 0 ? data.businesses : FALLBACK_BUSINESSES;

      // ── Step 3: Update store & write to cache ─────────────────────────
      set({
        businesses: newBusinesses,
        savedPlaces: data.savedPlaceIds,
        isLoading: false,
        isOnline: true,
        lastSyncAt: Date.now(),
      });

      await cacheSet(bizCacheKey, {
        businesses: newBusinesses,
        savedPlaceIds: data.savedPlaceIds,
      }, TTL.MEDIUM);

      console.log(`✅ Synced ${data.businesses.length} businesses for user ${user.id}`);
    } catch (error) {
      console.warn('Backend sync failed, using fallback data:', error);
      // Only fall back if we have nothing at all
      const { businesses } = get();
      if (!businesses || businesses.length === 0) {
        set({ businesses: FALLBACK_BUSINESSES });
      }
      set({ isOnline: false, isLoading: false });
    }
  },
}));
