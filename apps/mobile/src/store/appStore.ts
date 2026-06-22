import { create } from 'zustand';
import { Notification } from '../services/notifications';
import { syncAllData, savePlaceOnBackend, unsavePlaceOnBackend } from '../services/dataService';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'business' | 'admin';
  points: number;
  totalEarned: number;
  level: number;
  verified: boolean;
  createdAt: string;
  reviewCount: number;
  photoCount: number;
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
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
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

// ── Mock Reviews ───────────────────────────────────────────────────────────
export const MOCK_REVIEWS_DATA: Review[] = [
  { id: 'rev1', businessId: 'food-1', userId: 'u2', userName: 'John D.', rating: 5, text: 'Amazing food and fast service. The traditional coffee ceremony was unforgettable!', images: ['https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200'], createdAt: '2 days ago', helpful: 24 },
  { id: 'rev2', businessId: 'food-1', userId: 'u3', userName: 'Sarah M.', rating: 5, text: 'Best Ethiopian restaurant in Addis. The live music creates such a vibrant atmosphere.', createdAt: '1 week ago', helpful: 18 },
  { id: 'rev3', businessId: 'food-1', userId: 'u4', userName: 'Tewodros A.', rating: 4, text: 'Great food and service. Would recommend the platter for sharing.', createdAt: '2 weeks ago', helpful: 12 },
  { id: 'rev4', businessId: 'food-1', userId: 'u5', userName: 'Meron K.', rating: 5, text: 'Incredible flavors! The injera was perfectly made. A must-visit in Addis.', images: ['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200'], createdAt: '3 weeks ago', helpful: 31 },
  { id: 'rev5', businessId: 'food-1', userId: 'u6', userName: 'Abebe B.', rating: 5, text: 'The doro wat is the best I have ever had. Authentic and delicious.', createdAt: '1 month ago', helpful: 15 },
  { id: 'rev6', businessId: 'cafe-1', userId: 'u3', userName: 'Sarah M.', rating: 5, text: 'Best coffee in Addis! The single-origin Yirgacheffe is outstanding.', createdAt: '3 days ago', helpful: 22 },
  { id: 'rev7', businessId: 'cafe-2', userId: 'u2', userName: 'John D.', rating: 4, text: 'Classic Addis institution. The espresso is strong and authentic.', createdAt: '5 days ago', helpful: 16 },
  { id: 'rev8', businessId: 'hotel-1', userId: 'u4', userName: 'Tewodros A.', rating: 5, text: 'World-class hotel with exceptional service. The gardens are stunning.', createdAt: '1 week ago', helpful: 28 },
  { id: 'rev9', businessId: 'hotel-2', userId: 'u5', userName: 'Meron K.', rating: 5, text: 'Absolutely stunning property. The architecture is breathtaking.', createdAt: '2 weeks ago', helpful: 35 },
  { id: 'rev10', businessId: 'gym-1', userId: 'u6', userName: 'Abebe B.', rating: 5, text: 'Top-notch equipment and trainers. Best gym in the area.', createdAt: '1 day ago', helpful: 19 },
  { id: 'rev11', businessId: 'tech-1', userId: 'u2', userName: 'John D.', rating: 5, text: 'Fascinating AI research happening here. Very innovative team.', createdAt: '1 week ago', helpful: 14 },
  { id: 'rev12', businessId: 'auto-2', userId: 'u3', userName: 'Sarah M.', rating: 4, text: 'Great selection of vehicles and professional service.', createdAt: '2 weeks ago', helpful: 8 },
];

// ── Mock Gallery Photos ────────────────────────────────────────────────────
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

// ── Mock User ─────────────────────────────────────────────────────────────
export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Jonas',
  email: 'jonas@example.com',
  phone: '+251-91-234-5678',
  role: 'user',
  points: 1240,
  totalEarned: 2450,
  level: 5,
  verified: true,
  createdAt: '2025-01-15',
  reviewCount: 24,
  photoCount: 48,
};

// ── Fallback Businesses (always available, no network needed) ─────────────
// These match the Supabase seed. Supabase data overwrites these on sync.
export const FALLBACK_BUSINESSES: Business[] = [
  // Restaurants
  { id: 'food-1', name: 'Yod Abyssinia Restaurant', category: 'Ethiopian Cuisine', categoryId: 'food', rating: 4.8, reviews: 324, distance: '', latitude: 9.0227, longitude: 38.7468, image: 'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400', verified: true, description: 'Authentic Ethiopian cuisine with live music and traditional coffee ceremony.', phone: '+251-11-123-4567', hours: '8:00 AM - 10:00 PM', address: 'Bole Road, Addis Ababa' },
  { id: 'food-2', name: 'Kategna Restaurant', category: 'Ethiopian Cuisine', categoryId: 'food', rating: 4.7, reviews: 267, distance: '', latitude: 9.0215, longitude: 38.7485, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400', verified: true, description: 'High-quality traditional Ethiopian cuisine with extensive menu.', phone: '+251-11-667-2879', hours: '8:00 AM - 11:00 PM', address: 'Bole Medhane Alem, Addis Ababa' },
  { id: 'food-3', name: 'Gusto Trattoria', category: 'Italian', categoryId: 'food', rating: 4.5, reviews: 189, distance: '', latitude: 9.025, longitude: 38.75, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', verified: true, description: 'Italian and Mediterranean fusion cuisine.', phone: '+251-11-553-0444', hours: '11:00 AM - 10:00 PM', address: 'Kazanchis, Addis Ababa' },
  { id: 'food-4', name: 'Marcus Addis Restaurant & Sky Bar', category: 'Fine Dining', categoryId: 'food', rating: 4.2, reviews: 156, distance: '', latitude: 9.025, longitude: 38.755, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', verified: true, description: 'Premium dining with panoramic city views.', phone: '+251-11-555-0101', hours: '6:00 PM - 11:00 PM', address: 'Head Office Tower, Addis Ababa' },
  { id: 'food-5', name: 'Arirang Korean Restaurant', category: 'Korean', categoryId: 'food', rating: 4.3, reviews: 112, distance: '', latitude: 9.023, longitude: 38.749, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', verified: true, description: 'Authentic Korean cuisine with BBQ.', phone: '+251-11-618-1618', hours: '11:00 AM - 10:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'food-6', name: 'Bait Al Mandi', category: 'Yemeni', categoryId: 'food', rating: 4.4, reviews: 134, distance: '', latitude: 9.02, longitude: 38.751, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', verified: true, description: 'Authentic Yemeni and Middle Eastern cuisine.', phone: '+251-11-551-2345', hours: '10:00 AM - 11:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'food-7', name: 'Little China Restaurant', category: 'Chinese', categoryId: 'food', rating: 4.1, reviews: 98, distance: '', latitude: 9.026, longitude: 38.752, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', verified: true, description: 'Chinese cuisine with dim sum and noodle options.', phone: '+251-11-554-4321', hours: '11:00 AM - 10:00 PM', address: 'Kazanchis, Addis Ababa' },
  { id: 'food-8', name: 'Sishu Restaurant', category: 'Burgers', categoryId: 'food', rating: 4.3, reviews: 145, distance: '', latitude: 9.022, longitude: 38.748, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', verified: true, description: 'Popular spot for burgers and sandwiches.', phone: '+251-11-661-6116', hours: '8:00 AM - 10:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'food-9', name: '2000 Habesha Cultural Restaurant', category: 'Ethiopian Cultural', categoryId: 'food', rating: 4.3, reviews: 312, distance: '', latitude: 9.03, longitude: 38.74, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', verified: true, description: 'Live cultural music and dance with traditional cuisine.', phone: '+251-91-283-8383', hours: '9:00 AM - 12:00 AM', address: 'Namibia St, Addis Ababa' },
  { id: 'food-10', name: 'Cravings Restaurant & Bar', category: 'International', categoryId: 'food', rating: 4.6, reviews: 287, distance: '', latitude: 9.021, longitude: 38.75, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', verified: true, description: 'Modern international cuisine with wine menu.', phone: '+251-11-868-5353', hours: '11:00 AM - 11:00 PM', address: 'Bole, Addis Ababa' },
  // Cafes
  { id: 'cafe-1', name: 'Tomoca Coffee', category: 'Coffee Shop', categoryId: 'cafe', rating: 4.6, reviews: 234, distance: '', latitude: 9.02, longitude: 38.75, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', verified: true, description: "Addis Ababa's iconic coffee shop since 1953.", phone: '+251-11-111-2498', hours: '6:00 AM - 10:00 PM', address: 'Wawel St, Addis Ababa' },
  { id: 'cafe-2', name: "Kaldi's Coffee", category: 'Coffee Shop', categoryId: 'cafe', rating: 4.2, reviews: 312, distance: '', latitude: 9.022, longitude: 38.747, image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', verified: true, description: "Ethiopia's largest coffee chain.", hours: '6:00 AM - 10:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'cafe-3', name: 'Garden of Coffee', category: 'Specialty Coffee', categoryId: 'cafe', rating: 4.8, reviews: 98, distance: '', latitude: 9.021, longitude: 38.748, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', verified: true, description: 'Artisan coffee roastery.', phone: '+251-91-345-6789', hours: '7:00 AM - 9:00 PM', address: 'Bole, Addis Ababa' },
  { id: 'cafe-4', name: 'Mokarar Coffee', category: 'Coffee Shop', categoryId: 'cafe', rating: 4.5, reviews: 112, distance: '', latitude: 9.025, longitude: 38.746, image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', verified: true, description: 'Historic coffee shop.', phone: '+251-11-111-5678', hours: '6:00 AM - 9:00 PM', address: 'Piassa, Addis Ababa' },
  { id: 'cafe-5', name: 'Reboot Coffee', category: 'Coffee Shop', categoryId: 'cafe', rating: 4.8, reviews: 112, distance: '', latitude: 9.024, longitude: 38.744, image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', verified: true, description: 'Modern coffee shop with workspace.', hours: '7:00 AM - 9:00 PM', address: '4 Kilo, Addis Ababa' },
  // Hotels
  { id: 'hotel-1', name: 'Sheraton Addis Hotel', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.8, reviews: 423, distance: '', latitude: 9.017, longitude: 38.751, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', verified: true, description: 'Iconic luxury hotel with premium service.', phone: '+251-11-517-1717', hours: '24 hours', address: 'Taitu Street, Addis Ababa' },
  { id: 'hotel-2', name: 'Hilton Addis Ababa', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.6, reviews: 512, distance: '', latitude: 9.025, longitude: 38.745, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true, description: 'Five-star luxury hotel with pools.', phone: '+251-11-517-0000', hours: '24 hours', address: 'Menelik II Ave, Addis Ababa' },
  { id: 'hotel-3', name: 'Hyatt Regency Addis Ababa', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.7, reviews: 345, distance: '', latitude: 9.022, longitude: 38.752, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', verified: true, description: 'Modern luxury hotel near Meskel Square.', phone: '+251-11-544-1234', hours: '24 hours', address: 'Meskel Square, Addis Ababa' },
  { id: 'hotel-4', name: 'Radisson Blu Hotel Addis Ababa', category: 'Business Hotel', categoryId: 'hotel', rating: 4.5, reviews: 298, distance: '', latitude: 9.024, longitude: 38.748, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true, description: 'Premium business hotel.', phone: '+251-11-554-0000', hours: '24 hours', address: 'Kazanchis, Addis Ababa' },
  { id: 'hotel-5', name: 'Ethiopian Skylight Hotel', category: 'Luxury Hotel', categoryId: 'hotel', rating: 4.6, reviews: 267, distance: '', latitude: 9.015, longitude: 38.755, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', verified: true, description: 'Modern airport hotel.', phone: '+251-11-558-0000', hours: '24 hours', address: 'Bole Airport, Addis Ababa' },
  // Health
  { id: 'health-1', name: 'Black Lion Hospital', category: 'General Hospital', categoryId: 'health', rating: 4.2, reviews: 187, distance: '', latitude: 9.03, longitude: 38.74, image: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', verified: true, description: 'Leading public teaching hospital.', phone: '+251-11-551-3000', hours: '24 hours', address: 'King George VI Street, Addis Ababa' },
  { id: 'health-2', name: 'Nordic Medical Centre', category: 'Private Hospital', categoryId: 'health', rating: 4.5, reviews: 134, distance: '', latitude: 9.021, longitude: 38.748, image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400', verified: true, description: 'Premium private medical services.', phone: '+251-11-554-9900', hours: '24 hours', address: 'Bole, Addis Ababa' },
  { id: 'health-3', name: 'Myungsung Christian Medical Center', category: 'Private Hospital', categoryId: 'health', rating: 4.6, reviews: 167, distance: '', latitude: 9.02, longitude: 38.749, image: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', verified: true, description: 'Leading private hospital in Bole.', phone: '+251-11-618-9000', hours: '24 hours', address: 'Bole Medhane Alem, Addis Ababa' },
  // Shops
  { id: 'shop-1', name: 'Mercato - Addis Merkato', category: 'Market', categoryId: 'shop', rating: 4.0, reviews: 345, distance: '', latitude: 9.035, longitude: 38.735, image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400', verified: true, description: "Africa's largest open-air market.", phone: '+251-96-372-7196', hours: '8:00 AM - 7:00 PM', address: 'Merkato, Addis Ababa' },
  { id: 'shop-2', name: 'Edna Mall', category: 'Shopping Mall', categoryId: 'shop', rating: 4.3, reviews: 890, distance: '', latitude: 9.001, longitude: 38.784, image: 'https://images.unsplash.com/photo-1519567281023-e1262d182b8d?w=400', verified: true, description: 'Popular mall with cinema.', phone: '+251-11-661-6272', hours: '8:00 AM - 10:00 PM', address: 'Bole Medhane Alem, Addis Ababa' },
  // Nightlife
  { id: 'club-1', name: 'Club Illusion', category: 'Nightclub', categoryId: 'club', rating: 4.3, reviews: 156, distance: '', latitude: 9.027, longitude: 38.754, image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', verified: true, description: 'Long-standing club with electrifying atmosphere.', phone: '+251-91-127-2628', hours: '9:00 PM - 3:00 AM', address: 'Kazanchis, Addis Ababa' },
  { id: 'club-2', name: 'Wakanda Ultra Lounge', category: 'Lounge', categoryId: 'club', rating: 4.7, reviews: 134, distance: '', latitude: 9.021, longitude: 38.749, image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400', verified: true, description: 'Ultra lounge with premium cocktails.', phone: '+251-93-001-1125', hours: '7:00 PM - 2:00 AM', address: 'Mickey Leland St, Addis Ababa' },
  // Banks
  { id: 'bank-1', name: 'Commercial Bank of Ethiopia', category: 'Bank', categoryId: 'finance', rating: 3.7, reviews: 145, distance: '', latitude: 9.022, longitude: 38.752, image: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400', verified: true, description: "Ethiopia's largest commercial bank.", phone: '+251-11-551-5000', hours: '8:00 AM - 5:00 PM', address: 'Meskel Square, Addis Ababa' },
  { id: 'bank-2', name: 'Dashen Bank - Head Office', category: 'Bank', categoryId: 'finance', rating: 4.6, reviews: 98, distance: '', latitude: 9.02, longitude: 38.748, image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', verified: true, description: "One of Ethiopia's largest private banks.", phone: '+251-11-552-4111', hours: '8:00 AM - 5:00 PM', address: 'Bole, Addis Ababa' },
  // Gyms
  { id: 'gym-1', name: 'Vigor Fitness Laphto Mall', category: 'Fitness Center', categoryId: 'gym', rating: 4.8, reviews: 156, distance: '', latitude: 9.021, longitude: 38.747, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', verified: true, description: 'Premium fitness center with pool and spa.', phone: '+251-11-552-8800', hours: '6:00 AM - 10:00 PM', address: 'Laphto Mall, Old Airport, Addis Ababa' },
  { id: 'gym-2', name: 'SweatBox Addis', category: 'Fitness Studio', categoryId: 'gym', rating: 4.6, reviews: 87, distance: '', latitude: 9.019, longitude: 38.749, image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400', verified: true, description: 'High-intensity group classes.', phone: '+251-910-657-999', hours: '5:00 AM - 10:00 PM', address: 'Bole Subcity, Addis Ababa' },
  // Fuel
  { id: 'fuel-1', name: 'TotalEnergies Bole Station', category: 'Fuel Station', categoryId: 'fuel', rating: 4.0, reviews: 45, distance: '', latitude: 9.0215, longitude: 38.749, image: 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', verified: true, description: 'Full-service fuel station.', hours: '24 hours', address: 'Bole Road, Addis Ababa' },
  // Education
  { id: 'edu-1', name: 'Addis Ababa University', category: 'University', categoryId: 'edu', rating: 4.3, reviews: 423, distance: '', latitude: 9.046, longitude: 38.755, image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', verified: true, description: "Ethiopia's oldest and largest university.", phone: '+251-11-123-4567', hours: '8:00 AM - 5:00 PM', address: 'Sidist Kilo, Addis Ababa' },
  { id: 'edu-2', name: 'International Community School of Addis', category: 'International School', categoryId: 'edu', rating: 4.7, reviews: 89, distance: '', latitude: 9.025, longitude: 38.755, image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', verified: true, description: 'Prestigious IB and American curriculum school.', phone: '+251-11-661-7171', hours: '8:00 AM - 4:00 PM', address: 'Bole, Addis Ababa' },
];

// ── Rewards / Points data ───────────────────────────────────────────────
export const EARN_OPTIONS = [
  { id: 'e1', title: 'Daily Login', points: 5, icon: '📅', type: 'earn' as const, description: 'Open the app daily' },
  { id: 'e2', title: 'Check In at Place', points: 10, icon: '📍', type: 'earn' as const, description: 'Visit a location on the map' },
  { id: 'e3', title: 'Write a Review', points: 50, icon: '✍️', type: 'earn' as const, description: 'Share your experience' },
  { id: 'e4', title: 'Add a Photo', points: 25, icon: '📸', type: 'earn' as const, description: 'Upload a place photo' },
  { id: 'e5', title: 'Invite a Friend', points: 100, icon: '👥', type: 'earn' as const, description: 'Refer a new user to Nexi' },
];

export const REDEEM_OPTIONS: RewardOption[] = [
  { id: 'r1', name: '☕ Free Coffee', points: 200, icon: '☕', available: true, category: 'food' },
  { id: 'r2', name: '🍕 Meal Voucher', points: 500, icon: '🍕', available: true, category: 'food' },
  { id: 'r3', name: '🚕 Ride Discount', points: 300, icon: '🚕', available: true, category: 'transport' },
  { id: 'r4', name: '🏋️ Gym Pass', points: 800, icon: '🏋️', available: false, category: 'fitness' },
  { id: 'r5', name: '📱 Phone Credit', points: 100, icon: '📱', available: true, category: 'tech' },
  { id: 'r6', name: '🎬 Cinema Ticket', points: 400, icon: '🎬', available: true, category: 'entertainment' },
];

// ── Store Interface ─────────────────────────────────────────────────────
interface AppState {
  user: User;
  businesses: Business[];
  savedPlaces: string[];
  notifications: Notification[];
  isLoading: boolean;
  isOnline: boolean;
  lastSyncAt: number | null;
  unreadCount: number;

  // Actions
  setBusinesses: (businesses: Business[]) => void;
  setSavedPlaces: (ids: string[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  toggleSavedPlace: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchCategoryFilter: (category: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  login: (user: User) => void;
  searchQuery: string;
  searchCategoryFilter: string;
  setOnline: (online: boolean) => void;
  setLoading: (loading: boolean) => void;
  syncFromBackend: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: MOCK_USER,
  businesses: FALLBACK_BUSINESSES,
  savedPlaces: [],
  notifications: [],
  isLoading: true,
  isOnline: false,
  lastSyncAt: null,
  unreadCount: 0,

  setBusinesses: (businesses) => set({ businesses }),
  setSavedPlaces: (ids) => set({ savedPlaces: ids }),
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),

  toggleSavedPlace: async (id) => {
    const { savedPlaces } = get();
    const isSaved = savedPlaces.includes(id);

    // Optimistic update
    if (isSaved) {
      set({ savedPlaces: savedPlaces.filter((s) => s !== id) });
      await unsavePlaceOnBackend(id);
    } else {
      set({ savedPlaces: [...savedPlaces, id] });
      await savePlaceOnBackend(id);
    }
  },

  searchQuery: '',
  searchCategoryFilter: '',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchCategoryFilter: (category) => set({ searchCategoryFilter: category }),

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
  login: (user) => set({ user }),

  setOnline: (online) => set({ isOnline: online }),
  setLoading: (loading) => set({ isLoading: loading }),

  syncFromBackend: async () => {
    try {
      set({ isLoading: true, isOnline: true });
      const data = await syncAllData();
      const newBusinesses = data.businesses.length > 0 ? data.businesses : FALLBACK_BUSINESSES;
      set({
        businesses: newBusinesses,
        savedPlaces: data.savedPlaceIds,
        isLoading: false,
        isOnline: true,
        lastSyncAt: Date.now(),
      });
      console.log(`✅ Synced ${data.businesses.length} businesses (using ${data.businesses.length > 0 ? 'Supabase' : 'fallback'} data)`);
    } catch (error) {
      console.warn('Backend sync failed, using fallback data:', error);
      set({ businesses: FALLBACK_BUSINESSES, isOnline: false, isLoading: false });
    }
  },
}));
