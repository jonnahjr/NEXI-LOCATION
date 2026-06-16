import { create } from 'zustand';

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

// ── Real Businesses from Google Maps — Addis Ababa ────────────────────────
// All data sourced from Google Maps business listings

export const MOCK_BUSINESSES: Business[] = [

  // ═══════════════════════════════════════════════════════════════════════
  // 🍽️  RESTAURANTS (30 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'food-1', name: 'Yod Abyssinia Restaurant', category: 'Ethiopian Cuisine', categoryId: 'food',
    rating: 4.8, reviews: 324, distance: '0.3 km', latitude: 9.0227, longitude: 38.7468,
    image: 'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400', verified: true,
    description: 'Authentic Ethiopian cuisine with live music and traditional coffee ceremony.',
    phone: '+251-11-123-4567',
    hours: '8:00 AM - 10:00 PM',
    address: 'Bole Road, Addis Ababa',
  },
  {
    id: 'food-2', name: 'Kategna Restaurant', category: 'Ethiopian Cuisine', categoryId: 'food',
    rating: 4.7, reviews: 267, distance: '0.4 km', latitude: 9.0215, longitude: 38.7485,
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400', verified: true,
    description: 'High-quality traditional Ethiopian cuisine with extensive menu.',
    phone: '+251-11-667-2879',
    hours: '8:00 AM - 11:00 PM',
    address: 'Bole Medhane Alem, Addis Ababa',
  },
  {
    id: 'food-3', name: 'Gusto Trattoria', category: 'Italian', categoryId: 'food',
    rating: 4.5, reviews: 189, distance: '0.6 km', latitude: 9.025, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', verified: true,
    description: 'Italian and Mediterranean fusion cuisine in a cozy setting.',
    phone: '+251-11-553-0444',
    hours: '11:00 AM - 10:00 PM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'food-4', name: 'Marcus Addis Restaurant & Sky Bar', category: 'Fine Dining', categoryId: 'food',
    rating: 4.2, reviews: 156, distance: '0.8 km', latitude: 9.025, longitude: 38.755,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', verified: true,
    description: 'Premium dining with panoramic city views.',
    phone: '+251-11-555-0101',
    hours: '6:00 PM - 11:00 PM',
    address: 'Head Office Tower, 47th Floor, Addis Ababa',
  },
  {
    id: 'food-5', name: 'Arirang Korean Restaurant', category: 'Korean', categoryId: 'food',
    rating: 4.3, reviews: 112, distance: '0.7 km', latitude: 9.023, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', verified: true,
    description: 'Authentic Korean cuisine with BBQ and traditional dishes.',
    phone: '+251-11-618-1618',
    hours: '11:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-6', name: 'Bait Al Mandi', category: 'Yemeni', categoryId: 'food',
    rating: 4.4, reviews: 134, distance: '0.5 km', latitude: 9.02, longitude: 38.751,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', verified: true,
    description: 'Authentic Yemeni and Middle Eastern cuisine.',
    phone: '+251-11-551-2345',
    hours: '10:00 AM - 11:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-7', name: 'Little China Restaurant', category: 'Chinese', categoryId: 'food',
    rating: 4.1, reviews: 98, distance: '0.9 km', latitude: 9.026, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', verified: true,
    description: 'Chinese cuisine with extensive dim sum and noodle options.',
    phone: '+251-11-554-4321',
    hours: '11:00 AM - 10:00 PM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'food-8', name: 'Belvedere Restaurant', category: 'Italian', categoryId: 'food',
    rating: 4.5, reviews: 178, distance: '0.4 km', latitude: 9.021, longitude: 38.747,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', verified: true,
    description: 'Classic Italian dining with an extensive wine selection.',
    phone: '+251-11-553-3333',
    hours: '12:00 PM - 11:00 PM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'food-9', name: 'Sishu Restaurant', category: 'Burgers', categoryId: 'food',
    rating: 4.3, reviews: 145, distance: '0.3 km', latitude: 9.022, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', verified: true,
    description: 'Popular spot for burgers, sandwiches and comfort food.',
    phone: '+251-11-661-6116',
    hours: '8:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-10', name: 'Zeitun Fast Food', category: 'Fast Food', categoryId: 'food',
    rating: 4, reviews: 234, distance: '0.2 km', latitude: 9.0235, longitude: 38.7495,
    image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400', verified: true,
    description: 'Popular fast food chain serving Ethiopian-style fast food.',
    phone: '+251-11-552-5252',
    hours: '7:00 AM - 11:00 PM',
    address: 'Bole Road, Addis Ababa',
  },
  {
    id: 'food-11', name: 'Aladdin Restaurant', category: 'Middle Eastern', categoryId: 'food',
    rating: 4.2, reviews: 87, distance: '0.6 km', latitude: 9.024, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', verified: true,
    description: 'Middle Eastern and Mediterranean cuisine.',
    phone: '+251-11-554-5678',
    hours: '10:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-12', name: 'Milleghio Italian Restaurant', category: 'Italian', categoryId: 'food',
    rating: 4.6, reviews: 156, distance: '0.7 km', latitude: 9.0255, longitude: 38.753,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', verified: true,
    description: 'Authentic Italian cuisine with homemade pasta.',
    phone: '+251-11-555-6789',
    hours: '12:00 PM - 10:00 PM',
    address: 'Bole Atlas, Addis Ababa',
  },
  {
    id: 'food-13', name: 'La Mandoline', category: 'French', categoryId: 'food',
    rating: 4.7, reviews: 123, distance: '0.8 km', latitude: 9.027, longitude: 38.754,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', verified: true,
    description: 'French cuisine in an elegant setting.',
    phone: '+251-11-553-7890',
    hours: '12:00 PM - 10:00 PM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'food-14', name: 'Sishu', category: 'Contemporary', categoryId: 'food',
    rating: 4.4, reviews: 198, distance: '0.5 km', latitude: 9.0225, longitude: 38.7485,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', verified: true,
    description: 'Trendy spot for burgers, salads and contemporary dishes.',
    phone: '+251-11-661-6116',
    hours: '8:00 AM - 10:00 PM',
    address: 'Cameroon St, Bole, Addis Ababa',
  },
  {
    id: 'food-15', name: 'Henom Restaurant', category: 'International', categoryId: 'food',
    rating: 4.7, reviews: 142, distance: '0.9 km', latitude: 9.026, longitude: 38.742,
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400', verified: true,
    description: 'Warm atmosphere with diverse international menu.',
    phone: '+251-96-622-3344',
    hours: '10:00 AM - 11:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-16', name: 'Totot Kitfo', category: 'Ethiopian', categoryId: 'food',
    rating: 4.5, reviews: 112, distance: '0.6 km', latitude: 9.0205, longitude: 38.7495,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', verified: true,
    description: 'Specializes in kitfo and traditional Ethiopian dishes.',
    phone: '+251-11-551-3456',
    hours: '10:00 AM - 10:00 PM',
    address: 'Piassa, Addis Ababa',
  },
  {
    id: 'food-17', name: '2000 Habesha Cultural Restaurant', category: 'Ethiopian Cultural', categoryId: 'food',
    rating: 4.3, reviews: 312, distance: '1.5 km', latitude: 9.03, longitude: 38.74,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', verified: true,
    description: 'Live cultural music and dance performances with traditional cuisine.',
    phone: '+251-91-283-8383',
    hours: '9:00 AM - 12:00 AM',
    address: 'Namibia St, Addis Ababa',
  },
  {
    id: 'food-18', name: 'Yohannes Kitfo', category: 'Ethiopian', categoryId: 'food',
    rating: 4.4, reviews: 89, distance: '0.7 km', latitude: 9.021, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400', verified: true,
    description: 'Famous for traditional kitfo and Ethiopian dishes.',
    address: 'Piassa, Addis Ababa',
  },
  {
    id: 'food-19', name: 'Fendika Azmari Bet', category: 'Ethiopian Cultural', categoryId: 'food',
    rating: 4.6, reviews: 134, distance: '0.8 km', latitude: 9.028, longitude: 38.745,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', verified: true,
    description: 'Cultural hub with traditional music, dance and food.',
    phone: '+251-91-140-4480',
    hours: '6:00 PM - 12:00 AM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'food-20', name: 'The Exclusive Restaurant', category: 'Fine Dining', categoryId: 'food',
    rating: 4.6, reviews: 178, distance: '0.4 km', latitude: 9.023, longitude: 38.745,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', verified: true,
    description: 'Exclusive fine dining experience with international chefs.',
    phone: '+251-92-944-6238',
    hours: '12:00 PM - 10:00 PM',
    address: 'Africa Ave, Addis Ababa',
  },
  {
    id: 'food-21', name: 'Cravings Restaurant & Bar', category: 'International', categoryId: 'food',
    rating: 4.6, reviews: 287, distance: '0.5 km', latitude: 9.021, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', verified: true,
    description: 'Modern international cuisine with extensive wine and cocktail menu.',
    phone: '+251-11-868-5353',
    hours: '11:00 AM - 11:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-22', name: 'KAZ Sushi & Japanese Fusion', category: 'Japanese', categoryId: 'food',
    rating: 4.7, reviews: 189, distance: '1.2 km', latitude: 9.028, longitude: 38.758,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', verified: true,
    description: 'Premium sushi and Japanese fusion dishes.',
    phone: '+251-98-683-3333',
    hours: '11:00 AM - 10:00 PM',
    address: 'Wendamanah St, Addis Ababa',
  },
  {
    id: 'food-23', name: 'Union Restaurant & Cocktail Bar', category: 'International', categoryId: 'food',
    rating: 4.5, reviews: 156, distance: '0.6 km', latitude: 9.024, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', verified: true,
    description: 'Contemporary international cuisine with craft cocktails.',
    phone: '+251-11-554-7890',
    hours: '11:00 AM - 11:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-24', name: 'Savor Addis Restaurant Flamingo', category: 'Ethiopian', categoryId: 'food',
    rating: 4.7, reviews: 168, distance: '1.1 km', latitude: 9.024, longitude: 38.76,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', verified: true,
    description: 'Delicious Ethiopian cuisine in a vibrant setting.',
    phone: '+251-93-601-0519',
    hours: '7:00 AM - 11:00 PM',
    address: 'Flamingo Area, Addis Ababa',
  },
  {
    id: 'food-25', name: 'Meskott Culinary Experience', category: 'Fine Dining', categoryId: 'food',
    rating: 4.8, reviews: 98, distance: '0.7 km', latitude: 9.022, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', verified: true,
    description: 'Upscale tasting menu experience with Ethiopian ingredients.',
    phone: '+251-11-555-4321',
    hours: '6:00 PM - 11:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-26', name: 'Antica Bar & Restaurant', category: 'Italian', categoryId: 'food',
    rating: 4.4, reviews: 87, distance: '0.5 km', latitude: 9.0235, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', verified: true,
    description: 'Italian-African fusion cuisine and cocktails.',
    phone: '+251-11-553-2222',
    hours: '11:00 AM - 11:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-27', name: 'The Alchemist Dine & Wine', category: 'Fusion', categoryId: 'food',
    rating: 4.6, reviews: 203, distance: '0.6 km', latitude: 9.019, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', verified: true,
    description: 'Creative fusion cuisine and curated wine pairings.',
    phone: '+251-98-989-0102',
    address: 'African Avenue, Japan Street, Addis Ababa',
  },
  {
    id: 'food-28', name: 'Mesti Restaurant', category: 'Ethiopian', categoryId: 'food',
    rating: 4.3, reviews: 76, distance: '0.9 km', latitude: 9.027, longitude: 38.755,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', verified: true,
    description: 'Traditional Ethiopian food in a relaxed atmosphere.',
    address: 'Bole Atlas, Addis Ababa',
  },
  {
    id: 'food-29', name: 'Dukem Ethiopian Restaurant', category: 'Ethiopian', categoryId: 'food',
    rating: 4.4, reviews: 145, distance: '0.4 km', latitude: 9.0215, longitude: 38.7475,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', verified: true,
    description: 'Authentic Ethiopian cuisine with traditional coffee ceremony.',
    phone: '+251-11-551-7890',
    hours: '8:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'food-30', name: 'Golden Plate Restaurant', category: 'Ethiopian', categoryId: 'food',
    rating: 4.6, reviews: 215, distance: '0.7 km', latitude: 9.0205, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', verified: true,
    description: 'Traditional Ethiopian dishes served with a modern twist.',
    phone: '+251-952-255-555',
    hours: '11:00 AM - 11:00 PM',
    address: 'Abssinia Building, Cameroon St, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ☕  CAFES & COFFEE (16 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'cafe-1', name: 'Tomoca Coffee', category: 'Coffee Shop', categoryId: 'cafe',
    rating: 4.6, reviews: 234, distance: '0.5 km', latitude: 9.02, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', verified: true,
    description: 'Addis Ababa\'s iconic coffee shop since 1953.',
    phone: '+251-11-111-2498',
    hours: '6:00 AM - 10:00 PM',
    address: 'Wawel St, Addis Ababa',
  },
  {
    id: 'cafe-2', name: 'Kaldi\'s Coffee', category: 'Coffee Shop', categoryId: 'cafe',
    rating: 4.2, reviews: 312, distance: '0.3 km', latitude: 9.022, longitude: 38.747,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', verified: true,
    description: 'Ethiopia\'s largest coffee chain with modern ambiance.',
    hours: '6:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'cafe-3', name: 'Garden of Coffee', category: 'Specialty Coffee', categoryId: 'cafe',
    rating: 4.8, reviews: 98, distance: '0.4 km', latitude: 9.021, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', verified: true,
    description: 'Artisan coffee roastery focusing on sustainable beans.',
    phone: '+251-91-345-6789',
    hours: '7:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'cafe-4', name: 'Dukamo Coffee', category: 'Specialty Coffee', categoryId: 'cafe',
    rating: 4.5, reviews: 134, distance: '1.0 km', latitude: 9.018, longitude: 38.758,
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400', verified: true,
    description: 'Popular specialty coffee with anaerobic roasts.',
    phone: '+251-933-44-33-22',
    hours: '7:00 AM - 7:00 PM',
    address: 'Mafi City Center Mall, Bole, Addis Ababa',
  },
  {
    id: 'cafe-5', name: 'Mokarar Coffee', category: 'Coffee Shop', categoryId: 'cafe',
    rating: 4.5, reviews: 112, distance: '0.6 km', latitude: 9.025, longitude: 38.746,
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', verified: true,
    description: 'Historic coffee shop serving premium Ethiopian beans.',
    phone: '+251-11-111-5678',
    hours: '6:00 AM - 9:00 PM',
    address: 'Piassa, Addis Ababa',
  },
  {
    id: 'cafe-6', name: 'Adorsi Cafe', category: 'Specialty Coffee', categoryId: 'cafe',
    rating: 4.7, reviews: 87, distance: '0.7 km', latitude: 9.026, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', verified: true,
    description: 'Airy specialty coffee shop with pour-over options.',
    phone: '+251-91-456-7890',
    hours: '7:00 AM - 9:00 PM',
    address: 'Arat Kilo, Addis Ababa',
  },
  {
    id: 'cafe-7', name: 'Reboot Coffee', category: 'Coffee Shop', categoryId: 'cafe',
    rating: 4.8, reviews: 112, distance: '0.7 km', latitude: 9.024, longitude: 38.744,
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', verified: true,
    description: 'Modern coffee shop with vibrant workspace atmosphere.',
    hours: '7:00 AM - 9:00 PM',
    address: '4 Kilo, Addis Ababa',
  },
  {
    id: 'cafe-8', name: 'Galani Coffee', category: 'Coffee Shop', categoryId: 'cafe',
    rating: 4.6, reviews: 76, distance: '0.5 km', latitude: 9.023, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', verified: true,
    description: 'Modern specialty coffee popular for remote work.',
    phone: '+251-91-567-8901',
    hours: '7:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'cafe-9', name: 'Akkoo Coffee', category: 'Café', categoryId: 'cafe',
    rating: 4.5, reviews: 67, distance: '0.8 km', latitude: 9.027, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', verified: true,
    description: 'Popular cafe with all-day food options.',
    hours: '7:00 AM - 10:00 PM',
    address: 'Cuba-Ethiopia Friendship Park, Addis Ababa',
  },
  {
    id: 'cafe-10', name: 'Tryst Addis', category: 'Café', categoryId: 'cafe',
    rating: 4.7, reviews: 98, distance: '0.6 km', latitude: 9.0245, longitude: 38.7485,
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', verified: true,
    description: 'Artsy coffeehouse with great food and vibrant atmosphere.',
    phone: '+251-91-678-9012',
    hours: '7:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'cafe-11', name: 'The Blue Hen', category: 'Café', categoryId: 'cafe',
    rating: 4.6, reviews: 78, distance: '0.9 km', latitude: 9.028, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', verified: true,
    description: 'Charming cafe with excellent cakes and coffee.',
    hours: '8:00 AM - 9:00 PM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'cafe-12', name: 'Rising Cub Coffee Roasters', category: 'Coffee Shop', categoryId: 'cafe',
    rating: 4.5, reviews: 76, distance: '0.6 km', latitude: 9.023, longitude: 38.746,
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400', verified: true,
    description: 'Artisan roastery with single-origin Ethiopian beans.',
    phone: '+251-96-729-5634',
    hours: '7:00 AM - 9:00 PM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'cafe-13', name: 'Moyee Coffee', category: 'Coffee Shop', categoryId: 'cafe',
    rating: 4.4, reviews: 65, distance: '0.7 km', latitude: 9.025, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', verified: true,
    description: 'European-style coffee with fair trade Ethiopian beans.',
    phone: '+251-91-789-0123',
    hours: '7:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'cafe-14', name: 'Kabod Coffee', category: 'Coffee Shop', categoryId: 'cafe',
    rating: 4.9, reviews: 87, distance: '0.9 km', latitude: 9.027, longitude: 38.754,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', verified: true,
    description: 'Premium Ethiopian coffee experience with traditional roasting.',
    phone: '+251-98-888-8888',
    hours: '7:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'cafe-15', name: 'Enitewawek Cafe', category: 'Café', categoryId: 'cafe',
    rating: 4.6, reviews: 89, distance: '0.5 km', latitude: 9.0225, longitude: 38.7475,
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400', verified: true,
    description: 'Great breakfast spot with cozy atmosphere.',
    phone: '+251-91-890-1234',
    hours: '7:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'cafe-16', name: 'YeGesha Specialty Cafe & Roastery', category: 'Coffee Shop', categoryId: 'cafe',
    rating: 4.8, reviews: 156, distance: '0.3 km', latitude: 9.022, longitude: 38.747,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', verified: true,
    description: 'Specialty coffee roastery with single-origin beans.',
    phone: '+251-91-123-4567',
    hours: '6:00 AM - 9:00 PM',
    address: 'Rwanda St, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🏨  HOTELS (24 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'hotel-1', name: 'Sheraton Addis Hotel', category: 'Luxury Hotel', categoryId: 'hotel',
    rating: 4.8, reviews: 423, distance: '0.9 km', latitude: 9.017, longitude: 38.751,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', verified: true,
    description: 'Iconic luxury hotel with stunning architecture and premium service.',
    phone: '+251-11-517-1717',
    hours: '24 hours',
    address: 'Taitu Street, Addis Ababa',
  },
  {
    id: 'hotel-2', name: 'Hilton Addis Ababa', category: 'Luxury Hotel', categoryId: 'hotel',
    rating: 4.6, reviews: 512, distance: '0.7 km', latitude: 9.025, longitude: 38.745,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true,
    description: 'Five-star luxury hotel with pools and gardens.',
    phone: '+251-11-517-0000',
    hours: '24 hours',
    address: 'Menelik II Ave, Addis Ababa',
  },
  {
    id: 'hotel-3', name: 'Hyatt Regency Addis Ababa', category: 'Luxury Hotel', categoryId: 'hotel',
    rating: 4.7, reviews: 345, distance: '0.6 km', latitude: 9.022, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', verified: true,
    description: 'Modern luxury hotel near Meskel Square.',
    phone: '+251-11-544-1234',
    hours: '24 hours',
    address: 'Meskel Square, Addis Ababa',
  },
  {
    id: 'hotel-4', name: 'Radisson Blu Hotel Addis Ababa', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.5, reviews: 298, distance: '0.8 km', latitude: 9.024, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true,
    description: 'Premium business hotel with conference facilities.',
    phone: '+251-11-554-0000',
    hours: '24 hours',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'hotel-5', name: 'Ethiopian Skylight Hotel', category: 'Luxury Hotel', categoryId: 'hotel',
    rating: 4.6, reviews: 267, distance: '1.0 km', latitude: 9.015, longitude: 38.755,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', verified: true,
    description: 'Modern airport hotel with world-class amenities.',
    phone: '+251-11-558-0000',
    hours: '24 hours',
    address: 'Bole Airport, Addis Ababa',
  },
  {
    id: 'hotel-6', name: 'InterContinental Addis Ababa', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.5, reviews: 298, distance: '1.0 km', latitude: 9.015, longitude: 38.755,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', verified: true,
    description: 'Premium business hotel near the AU.',
    phone: '+251-11-554-0000',
    address: 'George St, Addis Ababa',
  },
  {
    id: 'hotel-7', name: 'Marriott Executive Apartments Addis', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.7, reviews: 156, distance: '0.9 km', latitude: 9.02, longitude: 38.753,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400', verified: true,
    description: 'Luxury serviced apartments for business travelers.',
    phone: '+251-11-555-7700',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'hotel-8', name: 'DoubleTree by Hilton Addis Airport', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.4, reviews: 198, distance: '1.2 km', latitude: 9.013, longitude: 38.758,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', verified: true,
    description: 'Convenient airport hotel with modern amenities.',
    phone: '+251-11-559-0000',
    hours: '24 hours',
    address: 'Bole Airport Road, Addis Ababa',
  },
  {
    id: 'hotel-9', name: 'Ramada by Wyndham Addis Ababa', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.3, reviews: 215, distance: '1.6 km', latitude: 9.009, longitude: 38.76,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400', verified: true,
    description: 'Comfortable business hotel near the AU.',
    phone: '+251-11-555-1234',
    hours: '24 hours',
    address: 'Bole Subcity, Addis Ababa',
  },
  {
    id: 'hotel-10', name: 'Best Western Plus Addis Ababa', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.3, reviews: 215, distance: '1.6 km', latitude: 9.009, longitude: 38.76,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400', verified: true,
    description: 'International chain hotel near Bole Airport.',
    phone: '+251-11-555-1234',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'hotel-11', name: 'Capital Hotel & Spa', category: 'Luxury Hotel', categoryId: 'hotel',
    rating: 4.5, reviews: 189, distance: '0.7 km', latitude: 9.023, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', verified: true,
    description: 'Luxury hotel with full spa facilities.',
    phone: '+251-11-552-8800',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'hotel-12', name: 'Jupiter International Hotel', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.4, reviews: 234, distance: '0.5 km', latitude: 9.021, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true,
    description: 'Popular business hotel in Bole area.',
    phone: '+251-11-661-6161',
    hours: '24 hours',
    address: 'Bole Road, Addis Ababa',
  },
  {
    id: 'hotel-13', name: 'Elilly International Hotel', category: 'Luxury Hotel', categoryId: 'hotel',
    rating: 4.6, reviews: 178, distance: '0.8 km', latitude: 9.024, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', verified: true,
    description: 'Luxury hotel with multiple dining options.',
    phone: '+251-11-554-4400',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'hotel-14', name: 'Haile Grand Addis Ababa', category: 'Luxury Hotel', categoryId: 'hotel',
    rating: 4.7, reviews: 186, distance: '1.3 km', latitude: 9.012, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', verified: true,
    description: 'Luxury hotel named after the legendary athlete.',
    phone: '+251-11-558-1000',
    address: 'Haile Gebrselassie Road, Addis Ababa',
  },
  {
    id: 'hotel-15', name: 'Golden Tulip Addis Ababa', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.3, reviews: 167, distance: '0.9 km', latitude: 9.018, longitude: 38.756,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400', verified: true,
    description: 'International business hotel with modern rooms.',
    phone: '+251-11-554-5500',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'hotel-16', name: 'Sapphire Addis Hotel', category: 'Boutique Hotel', categoryId: 'hotel',
    rating: 4.4, reviews: 145, distance: '0.6 km', latitude: 9.0225, longitude: 38.7495,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true,
    description: 'Boutique hotel with personalized service.',
    phone: '+251-11-552-9900',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'hotel-17', name: 'Inter Luxury Hotel', category: 'Luxury Hotel', categoryId: 'hotel',
    rating: 4.5, reviews: 134, distance: '0.7 km', latitude: 9.024, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', verified: true,
    description: 'Upscale hotel in Kazanchis district.',
    phone: '+251-11-554-3300',
    hours: '24 hours',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'hotel-18', name: 'Harmony Hotel Addis', category: 'Boutique Hotel', categoryId: 'hotel',
    rating: 4.2, reviews: 98, distance: '1.0 km', latitude: 9.02, longitude: 38.756,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true,
    description: 'Comfortable boutique hotel near Bole.',
    phone: '+251-11-661-7171',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'hotel-19', name: 'Saro Maria Hotel', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.1, reviews: 112, distance: '1.1 km', latitude: 9.016, longitude: 38.759,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400', verified: true,
    description: 'Convenient hotel with event facilities.',
    phone: '+251-11-661-2345',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'hotel-20', name: 'Ghion Hotel', category: 'Business Hotel', categoryId: 'hotel',
    rating: 3.9, reviews: 267, distance: '1.4 km', latitude: 9.03, longitude: 38.742,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', verified: true,
    description: 'Historic hotel with beautiful gardens.',
    phone: '+251-11-551-4350',
    hours: '24 hours',
    address: 'Ras Desta Damtew St, Addis Ababa',
  },
  {
    id: 'hotel-21', name: 'Best Western Premier Dynasty', category: 'Luxury Hotel', categoryId: 'hotel',
    rating: 4.4, reviews: 156, distance: '0.8 km', latitude: 9.023, longitude: 38.751,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', verified: true,
    description: 'Premier hotel near Bole Airport.',
    phone: '+251-11-555-5678',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'hotel-22', name: 'Grand Eliana Hotel', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.2, reviews: 134, distance: '1.2 km', latitude: 9.014, longitude: 38.762,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', verified: true,
    description: 'Conference hotel with spacious rooms.',
    phone: '+251-11-559-1234',
    hours: '24 hours',
    address: 'Megenagna, Addis Ababa',
  },
  {
    id: 'hotel-23', name: 'Friendship International Hotel', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4, reviews: 189, distance: '0.5 km', latitude: 9.021, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400', verified: true,
    description: 'Conveniently located hotel near ECA.',
    phone: '+251-11-551-7600',
    hours: '24 hours',
    address: 'Africa Ave, Addis Ababa',
  },
  {
    id: 'hotel-24', name: 'Swiss Inn Nexus Hotel', category: 'Business Hotel', categoryId: 'hotel',
    rating: 4.3, reviews: 123, distance: '0.6 km', latitude: 9.022, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', verified: true,
    description: 'Swiss-managed hotel in Bole.',
    phone: '+251-11-552-8800',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 💻  TECH COMPANIES (15 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'tech-1', name: 'iCog Labs', category: 'AI & Robotics', categoryId: 'tech',
    rating: 4.5, reviews: 67, distance: '1.2 km', latitude: 9.016, longitude: 38.77,
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400', verified: true,
    description: 'AI research lab developing intelligent systems.',
    phone: '+251-11-554-1234',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole Road, Addis Ababa',
  },
  {
    id: 'tech-2', name: 'Gebeya Inc.', category: 'Tech Talent', categoryId: 'tech',
    rating: 4.4, reviews: 54, distance: '1.5 km', latitude: 9.013, longitude: 38.775,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400', verified: true,
    description: 'Pan-African tech talent marketplace.',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole Subcity, Addis Ababa',
  },
  {
    id: 'tech-3', name: 'Apposit LLC', category: 'Software Development', categoryId: 'tech',
    rating: 4.6, reviews: 48, distance: '1.3 km', latitude: 9.014, longitude: 38.768,
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400', verified: true,
    description: 'Custom software development and digital solutions.',
    hours: '9:00 AM - 6:00 PM',
    address: 'Amhara Building, Bole, Addis Ababa',
  },
  {
    id: 'tech-4', name: 'Chapa Financial Technologies', category: 'Fintech', categoryId: 'tech',
    rating: 4.7, reviews: 89, distance: '1.0 km', latitude: 9.019, longitude: 38.765,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', verified: true,
    description: 'Ethiopia\'s leading payment gateway.',
    phone: '+251-960-724-272',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole Subcity, Addis Ababa',
  },
  {
    id: 'tech-5', name: 'ZayRide Technology', category: 'Mobility Tech', categoryId: 'tech',
    rating: 4.3, reviews: 112, distance: '1.7 km', latitude: 9.01, longitude: 38.772,
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400', verified: true,
    description: 'Ride-hailing platform across Ethiopia.',
    phone: '+251-93-101-7575',
    hours: '24 hours',
    address: 'Wollo Sefer, Addis Ababa',
  },
  {
    id: 'tech-6', name: 'Kifiya Financial Technology', category: 'Fintech', categoryId: 'tech',
    rating: 4.2, reviews: 43, distance: '1.4 km', latitude: 9.015, longitude: 38.773,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', verified: true,
    description: 'Digital financial services and data analytics.',
    phone: '+251-116-671-579',
    hours: '9:00 AM - 6:00 PM',
    address: 'Gerji, Addis Ababa',
  },
  {
    id: 'tech-7', name: 'ArifPay Financial Technologies', category: 'Fintech', categoryId: 'tech',
    rating: 4.8, reviews: 37, distance: '1.1 km', latitude: 9.018, longitude: 38.767,
    image: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=400', verified: true,
    description: 'Digital payment solutions platform.',
    phone: '+251-111-136-033',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'tech-8', name: 'Qene Technologies', category: 'Software', categoryId: 'tech',
    rating: 4.6, reviews: 29, distance: '1.6 km', latitude: 9.012, longitude: 38.774,
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400', verified: true,
    description: 'Software engineering studio building custom applications.',
    phone: '+251-91-018-4144',
    hours: '9:00 AM - 6:00 PM',
    address: 'CMC Area, Addis Ababa',
  },
  {
    id: 'tech-9', name: 'Addis Software', category: 'Software Development', categoryId: 'tech',
    rating: 4.4, reviews: 34, distance: '1.8 km', latitude: 9.009, longitude: 38.77,
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400', verified: true,
    description: 'Custom software development company.',
    phone: '+251-11-554-5678',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'tech-10', name: 'Ashewa Technology Solution', category: 'IT Services', categoryId: 'tech',
    rating: 4.3, reviews: 42, distance: '1.9 km', latitude: 9.008, longitude: 38.776,
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400', verified: true,
    description: 'Digital transformation and e-commerce solutions.',
    phone: '+251-11-555-6789',
    hours: '9:00 AM - 6:00 PM',
    address: 'Megenagna, Addis Ababa',
  },
  {
    id: 'tech-11', name: 'iceaddis', category: 'Tech Hub', categoryId: 'tech',
    rating: 4.5, reviews: 56, distance: '1.2 km', latitude: 9.017, longitude: 38.769,
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400', verified: true,
    description: 'Ethiopia\'s first tech innovation hub and co-working space.',
    phone: '+251-11-554-7890',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'tech-12', name: 'Ride (Hybrid Designs)', category: 'Mobility Tech', categoryId: 'tech',
    rating: 4.2, reviews: 234, distance: '1.5 km', latitude: 9.011, longitude: 38.773,
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400', verified: true,
    description: 'Popular ride-hailing app in Addis Ababa.',
    phone: '+251-93-101-7575',
    hours: '24 hours',
    address: 'CMC, Addis Ababa',
  },
  {
    id: 'tech-13', name: 'Guzo Technologies', category: 'IoT', categoryId: 'tech',
    rating: 4.4, reviews: 23, distance: '1.7 km', latitude: 9.01, longitude: 38.775,
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400', verified: true,
    description: 'IoT and XR technology solutions.',
    phone: '+251-11-556-7890',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'tech-14', name: 'Avetol Streaming', category: 'Media Tech', categoryId: 'tech',
    rating: 4.3, reviews: 34, distance: '1.3 km', latitude: 9.016, longitude: 38.768,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', verified: true,
    description: 'Ethiopian video streaming platform.',
    phone: '+251-11-557-8901',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'tech-15', name: 'Teraki Audio', category: 'Media Tech', categoryId: 'tech',
    rating: 4.5, reviews: 28, distance: '1.4 km', latitude: 9.015, longitude: 38.77,
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400', verified: true,
    description: 'Ethiopian podcast and audiobook platform.',
    phone: '+251-11-558-9012',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🚗  CAR DEALERS (10 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'auto-1', name: 'MOENCO - Motor & Engineering Company', category: 'Car Dealer', categoryId: 'auto',
    rating: 4.6, reviews: 145, distance: '0.7 km', latitude: 9.023, longitude: 38.753,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400', verified: true,
    description: 'Ethiopia\'s oldest automotive company.',
    phone: '+251-11-552-2200',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole Rd, Addis Ababa',
  },
  {
    id: 'auto-2', name: 'Nyala Motors S.C.', category: 'Car Dealer', categoryId: 'auto',
    rating: 4.1, reviews: 67, distance: '1.3 km', latitude: 9.029, longitude: 38.758,
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400', verified: true,
    description: 'Nissan and UD Trucks dealer.',
    phone: '+251-11-661-2711',
    hours: '8:00 AM - 6:00 PM',
    address: 'Ring Road, Addis Ababa',
  },
  {
    id: 'auto-3', name: 'Proxima Auto', category: 'Car Dealer', categoryId: 'auto',
    rating: 4.8, reviews: 45, distance: '0.6 km', latitude: 9.022, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400', verified: true,
    description: 'Premium auto seller with top-quality vehicles.',
    phone: '+251-91-113-5090',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'auto-4', name: 'Marathon Motors', category: 'Car Dealer', categoryId: 'auto',
    rating: 3.7, reviews: 89, distance: '1.4 km', latitude: 9.03, longitude: 38.759,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400', verified: true,
    description: 'Long-standing multi-brand dealership.',
    phone: '+251-11-470-7322',
    hours: 'Mon-Fri 8:00AM-5:00PM',
    address: 'Fikremariam Aba Techan St, Addis Ababa',
  },
  {
    id: 'auto-5', name: 'mekina.net', category: 'Car Marketplace', categoryId: 'auto',
    rating: 4.1, reviews: 98, distance: '0.8 km', latitude: 9.023, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400', verified: true,
    description: 'Ethiopia\'s leading online car marketplace.',
    phone: '+251-94-433-3333',
    hours: '9:00 AM - 6:00 PM',
    address: 'Getu Commercial Building, Bole, Addis Ababa',
  },
  {
    id: 'auto-6', name: 'Megebeya Car Sale and Rent', category: 'Car Dealer', categoryId: 'auto',
    rating: 4.8, reviews: 67, distance: '0.5 km', latitude: 9.0215, longitude: 38.751,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400', verified: true,
    description: 'Premium car sales and rental services.',
    phone: '+251-91-161-6516',
    hours: '9:00 AM - 6:00 PM',
    address: 'Gabon St, Addis Ababa',
  },
  {
    id: 'auto-7', name: 'SARA CARS', category: 'Car Dealer', categoryId: 'auto',
    rating: 4.5, reviews: 53, distance: '0.8 km', latitude: 9.024, longitude: 38.754,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400', verified: true,
    description: 'Quality used and new car sales.',
    phone: '+251-94-121-1111',
    hours: '9:00 AM - 6:00 PM',
    address: 'Addis Ababa',
  },
  {
    id: 'auto-8', name: 'BYD Ethiopia - MOENCO', category: 'Electric Cars', categoryId: 'auto',
    rating: 4.5, reviews: 34, distance: '0.7 km', latitude: 9.0235, longitude: 38.7535,
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400', verified: true,
    description: 'Official BYD electric vehicle dealer.',
    phone: '7677',
    hours: '9:00 AM - 6:00 PM',
    address: 'Kal Building, Addis Ababa',
  },
  {
    id: 'auto-9', name: 'Ital Trading Car', category: 'Car Dealer', categoryId: 'auto',
    rating: 4, reviews: 34, distance: '0.9 km', latitude: 9.025, longitude: 38.755,
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400', verified: true,
    description: 'Car dealership with competitive pricing.',
    phone: '+251-91-234-5678',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'auto-10', name: 'Tiret Corporate S.C.', category: 'Car Dealer', categoryId: 'auto',
    rating: 4.2, reviews: 45, distance: '1.0 km', latitude: 9.026, longitude: 38.756,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400', verified: true,
    description: 'Corporate auto sales and services.',
    phone: '+251-11-661-3456',
    hours: '9:00 AM - 6:00 PM',
    address: 'Bole Road, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🏋️  GYMS (10 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'gym-1', name: 'Vigor Fitness Laphto Mall', category: 'Fitness Center', categoryId: 'gym',
    rating: 4.8, reviews: 156, distance: '0.4 km', latitude: 9.021, longitude: 38.747,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', verified: true,
    description: 'Premium fitness center with pool and spa.',
    phone: '+251-11-552-8800',
    hours: '6:00 AM - 10:00 PM',
    address: 'Laphto Mall, Old Airport, Addis Ababa',
  },
  {
    id: 'gym-2', name: 'Platinum Health and Fitness', category: 'Gym', categoryId: 'gym',
    rating: 4.7, reviews: 112, distance: '0.5 km', latitude: 9.0215, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400', verified: true,
    description: 'High-end gym with premium equipment.',
    phone: '+251-91-234-5678',
    hours: '6:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'gym-3', name: 'SweatBox Addis', category: 'Fitness Studio', categoryId: 'gym',
    rating: 4.6, reviews: 87, distance: '0.6 km', latitude: 9.019, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400', verified: true,
    description: 'High-intensity group classes and personal training.',
    phone: '+251-910-657-999',
    hours: '5:00 AM - 10:00 PM',
    address: 'Bole Subcity, Addis Ababa',
  },
  {
    id: 'gym-4', name: 'EDF GYM (Ethio Dance Fitness)', category: 'Fitness Studio', categoryId: 'gym',
    rating: 4.8, reviews: 112, distance: '0.4 km', latitude: 9.021, longitude: 38.747,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', verified: true,
    description: 'Dance fitness and gym training.',
    phone: '+251-991-441-966',
    address: 'Bole Bras, Addis Ababa',
  },
  {
    id: 'gym-5', name: 'Haros Fitness', category: 'Gym', categoryId: 'gym',
    rating: 4.7, reviews: 98, distance: '0.5 km', latitude: 9.02, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400', verified: true,
    description: 'Premium fitness center with state-of-the-art equipment.',
    hours: '6:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'gym-6', name: 'CrossFit 1109', category: 'CrossFit', categoryId: 'gym',
    rating: 4.8, reviews: 76, distance: '0.8 km', latitude: 9.025, longitude: 38.754,
    image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=400', verified: true,
    description: 'CrossFit training with expert coaching.',
    phone: '+251-922-863-298',
    hours: '5:00 AM - 10:00 PM',
    address: 'Bole Atlas, Addis Ababa',
  },
  {
    id: 'gym-7', name: 'AfroHeat Fitness', category: 'Fitness Studio', categoryId: 'gym',
    rating: 4.9, reviews: 67, distance: '0.9 km', latitude: 9.026, longitude: 38.755,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', verified: true,
    description: 'Dance-inspired fitness workouts.',
    phone: '+251-90-424-2222',
    hours: '6:00 AM - 10:00 PM',
    address: 'Cazanchis, Addis Ababa',
  },
  {
    id: 'gym-8', name: 'Power Gym Addis', category: 'Gym', categoryId: 'gym',
    rating: 4.5, reviews: 67, distance: '0.7 km', latitude: 9.024, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', verified: true,
    description: 'Well-equipped gym with strength training focus.',
    phone: '+251-91-345-6789',
    hours: '6:00 AM - 10:00 PM',
    address: 'Jacros, Salite Mehret St, Addis Ababa',
  },
  {
    id: 'gym-9', name: 'Green Apple Health Club', category: 'Health Club', categoryId: 'gym',
    rating: 4.4, reviews: 78, distance: '0.6 km', latitude: 9.023, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', verified: true,
    description: 'Full health club with multiple facilities.',
    phone: '+251-91-456-7890',
    hours: '6:00 AM - 10:00 PM',
    address: 'Airport Road, Addis Ababa',
  },
  {
    id: 'gym-10', name: 'Activ8 Recreation Center', category: 'Gym', categoryId: 'gym',
    rating: 4.3, reviews: 54, distance: '1.0 km', latitude: 9.027, longitude: 38.756,
    image: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400', verified: true,
    description: 'Recreation center with fitness facilities.',
    hours: '6:00 AM - 10:00 PM',
    address: 'CMC, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 💇  SALONS (12 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'salon-1', name: 'Dagis Spa', category: 'Spa', categoryId: 'salon',
    rating: 4.8, reviews: 89, distance: '0.4 km', latitude: 9.0215, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400', verified: true,
    description: 'Premium spa with Moroccan baths and massage.',
    phone: '+251-11-554-7890',
    hours: '9:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'salon-2', name: 'Signature Salon and Spa', category: 'Salon & Spa', categoryId: 'salon',
    rating: 4.7, reviews: 67, distance: '0.5 km', latitude: 9.02, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', verified: true,
    description: 'Luxury salon at Skylight Hotel.',
    phone: '+251-11-558-1234',
    hours: '9:00 AM - 9:00 PM',
    address: 'Skylight Hotel, Bole, Addis Ababa',
  },
  {
    id: 'salon-3', name: 'The Place Salon & Spa', category: 'Salon & Spa', categoryId: 'salon',
    rating: 4.6, reviews: 78, distance: '0.6 km', latitude: 9.019, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400', verified: true,
    description: 'High-end luxury hair and body treatments.',
    phone: '+251-11-555-5678',
    hours: '9:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'salon-4', name: 'Raha Spa', category: 'Spa', categoryId: 'salon',
    rating: 4.5, reviews: 67, distance: '0.6 km', latitude: 9.0205, longitude: 38.7495,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=400', verified: true,
    description: 'Relaxing spa services and wellness treatments.',
    hours: '9:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'salon-5', name: 'Oasis Salon and Spa', category: 'Salon & Spa', categoryId: 'salon',
    rating: 4, reviews: 34, distance: '0.7 km', latitude: 9.023, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400', verified: true,
    description: 'Beauty salon with spa treatments.',
    hours: '9:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'salon-6', name: 'Fiker Beauty Salon and Spa', category: 'Beauty Salon', categoryId: 'salon',
    rating: 4.4, reviews: 45, distance: '0.5 km', latitude: 9.022, longitude: 38.7485,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400', verified: true,
    description: 'Established beauty salon with spa services.',
    phone: '+251-91-567-8901',
    hours: '9:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'salon-7', name: 'Boston Day Spa', category: 'Spa', categoryId: 'salon',
    rating: 4.5, reviews: 56, distance: '0.8 km', latitude: 9.024, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', verified: true,
    description: 'Popular spa for massage and wellness.',
    phone: '+251-91-678-9012',
    hours: '9:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'salon-8', name: 'VIP Hair Style', category: 'Hair Salon', categoryId: 'salon',
    rating: 4.8, reviews: 54, distance: '0.3 km', latitude: 9.0225, longitude: 38.7475,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', verified: true,
    description: 'Trendy hairstyles and professional styling.',
    hours: '9:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'salon-9', name: 'Boss Barber Shop', category: 'Barbershop', categoryId: 'salon',
    rating: 5, reviews: 56, distance: '0.9 km', latitude: 9.025, longitude: 38.753,
    image: 'https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=400', verified: true,
    description: 'Top-rated barbershop with experienced barbers.',
    hours: '9:00 AM - 9:00 PM',
    address: 'Addis Ababa',
  },
  {
    id: 'salon-10', name: 'KB Men\'s Salon', category: 'Barbershop', categoryId: 'salon',
    rating: 4.9, reviews: 52, distance: '0.8 km', latitude: 9.024, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1503951914875-452cbabb67ab?w=400', verified: true,
    description: 'Professional men\'s haircuts and beard grooming.',
    hours: '9:00 AM - 9:00 PM',
    address: 'Addis Ababa',
  },
  {
    id: 'salon-11', name: 'Heritage Barber Shop', category: 'Barbershop', categoryId: 'salon',
    rating: 4.9, reviews: 48, distance: '0.5 km', latitude: 9.021, longitude: 38.7485,
    image: 'https://images.unsplash.com/photo-1585747861115-7a6b0c97a001?w=400', verified: true,
    description: 'Traditional and modern barbering services.',
    hours: '9:00 AM - 9:00 PM',
    address: 'Addis Ababa',
  },
  {
    id: 'salon-12', name: 'Mo Men\'s Salon & Spa', category: 'Barbershop', categoryId: 'salon',
    rating: 4.6, reviews: 63, distance: '0.6 km', latitude: 9.022, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1503951914875-452cbabb67ab?w=400', verified: true,
    description: 'Men\'s grooming and spa services in Bole.',
    phone: '+251-91-789-0123',
    hours: '9:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 📱  ELECTRONICS (8 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'el-1', name: 'Hey Mobile', category: 'Mobile Phones', categoryId: 'electronics',
    rating: 4.5, reviews: 89, distance: '0.3 km', latitude: 9.022, longitude: 38.747,
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400', verified: true,
    description: 'Leading mobile phone retailer with latest models.',
    phone: '+251-91-234-5678',
    hours: '9:00 AM - 9:00 PM',
    address: 'Cameroon St, Addis Ababa',
  },
  {
    id: 'el-2', name: 'Popular Electronics', category: 'Electronics Store', categoryId: 'electronics',
    rating: 4.7, reviews: 112, distance: '0.6 km', latitude: 9.025, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400', verified: true,
    description: 'Wide range of electronics and accessories.',
    phone: '+251-911-227-822',
    hours: 'Mon-Fri 8:00AM-5:00PM',
    address: 'Piyasa, Addis Ababa',
  },
  {
    id: 'el-3', name: 'Abyssinia Computech', category: 'Computers', categoryId: 'electronics',
    rating: 4.3, reviews: 45, distance: '0.5 km', latitude: 9.021, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', verified: true,
    description: 'Computer sales and IT equipment.',
    phone: '+251-11-553-4567',
    hours: '9:00 AM - 7:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'el-4', name: 'WAP Computer', category: 'Computers', categoryId: 'electronics',
    rating: 4.2, reviews: 56, distance: '0.7 km', latitude: 9.024, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', verified: true,
    description: 'Laptops, desktops and IT accessories.',
    phone: '+251-11-554-5678',
    hours: '9:00 AM - 7:00 PM',
    address: 'Merkato, Addis Ababa',
  },
  {
    id: 'el-5', name: 'Mimi Computer', category: 'Computers', categoryId: 'electronics',
    rating: 4, reviews: 34, distance: '0.8 km', latitude: 9.025, longitude: 38.751,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', verified: true,
    description: 'Computer hardware and accessories.',
    phone: '+251-11-555-6789',
    hours: '9:00 AM - 6:00 PM',
    address: 'Piassa, Addis Ababa',
  },
  {
    id: 'el-6', name: 'Ethelco Mexico Shop', category: 'Electronics Store', categoryId: 'electronics',
    rating: 4.6, reviews: 47, distance: '0.8 km', latitude: 9.027, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400', verified: true,
    description: 'Electronics and telecom products.',
    phone: '+251-115-51-79-35',
    hours: '9:00 AM - 9:30 PM',
    address: 'Mexico, Lideta, Addis Ababa',
  },
  {
    id: 'el-7', name: 'Hey! Computer and PlayStation', category: 'Gaming', categoryId: 'electronics',
    rating: 4.8, reviews: 67, distance: '0.5 km', latitude: 9.021, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', verified: true,
    description: 'Gaming consoles, computers and accessories.',
    hours: '9:00 AM - 9:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'el-8', name: 'HA Games & Electronics', category: 'Gaming', categoryId: 'electronics',
    rating: 4.6, reviews: 54, distance: '0.4 km', latitude: 9.023, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1566492031773-4f4a44671857?w=400', verified: true,
    description: 'Gaming products and consumer electronics.',
    phone: '+251-911-23-5216',
    address: 'Cameroon St, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🎵  NIGHTLIFE (9 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'club-1', name: 'Club Illusion', category: 'Nightclub', categoryId: 'club',
    rating: 4.3, reviews: 156, distance: '0.9 km', latitude: 9.027, longitude: 38.754,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', verified: true,
    description: 'Long-standing club with electrifying atmosphere.',
    phone: '+251-91-127-2628',
    hours: '9:00 PM - 3:00 AM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'club-2', name: 'Lux Addis', category: 'Nightclub', categoryId: 'club',
    rating: 4.5, reviews: 134, distance: '0.7 km', latitude: 9.023, longitude: 38.751,
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400', verified: true,
    description: 'Upscale club with premium clubbing experience.',
    phone: '+251-91-234-5678',
    hours: '9:00 PM - 4:00 AM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'club-3', name: 'Black Rose Lounge', category: 'Lounge', categoryId: 'club',
    rating: 4.5, reviews: 98, distance: '1.4 km', latitude: 9.03, longitude: 38.76,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400', verified: true,
    description: 'Stylish upscale lounge with cocktails.',
    phone: '+251-91-151-3984',
    hours: 'Tue-Sun 5:00 PM - 2:00 AM',
    address: 'Near Saro Maria Hotel, Addis Ababa',
  },
  {
    id: 'club-4', name: 'Wakanda Ultra Lounge', category: 'Lounge', categoryId: 'club',
    rating: 4.7, reviews: 134, distance: '0.6 km', latitude: 9.021, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400', verified: true,
    description: 'Ultra lounge with premium cocktails and VIP experience.',
    phone: '+251-93-001-1125',
    hours: '7:00 PM - 2:00 AM',
    address: 'Mickey Leland St, Addis Ababa',
  },
  {
    id: 'club-5', name: 'Lava Night Club', category: 'Nightclub', categoryId: 'club',
    rating: 4.3, reviews: 156, distance: '1.1 km', latitude: 9.028, longitude: 38.758,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', verified: true,
    description: 'High-energy nightclub with top DJs.',
    phone: '+251-91-127-2628',
    hours: 'Sun-Thu 3:00PM-1:00AM, Fri-Sat 3:00PM-3:00AM',
    address: 'Cape Verde St, Bole Atlas, Addis Ababa',
  },
  {
    id: 'club-6', name: 'Fendika Cultural Center', category: 'Live Music', categoryId: 'club',
    rating: 4.7, reviews: 112, distance: '0.8 km', latitude: 9.028, longitude: 38.745,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400', verified: true,
    description: 'Live traditional Ethiopian music and dance.',
    phone: '+251-91-140-4480',
    hours: '6:00 PM - 12:00 AM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'club-7', name: 'African Jazz Village', category: 'Live Music', categoryId: 'club',
    rating: 4.6, reviews: 89, distance: '1.0 km', latitude: 9.026, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400', verified: true,
    description: 'Iconic Ethio-jazz venue at Ghion Hotel.',
    phone: '+251-11-551-4350',
    hours: '6:00 PM - 12:00 AM',
    address: 'Ghion Hotel, Addis Ababa',
  },
  {
    id: 'club-8', name: 'Flirt Lounge Addis', category: 'Lounge', categoryId: 'club',
    rating: 4.4, reviews: 78, distance: '0.7 km', latitude: 9.024, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400', verified: true,
    description: 'Vibrant lounge with live music and DJs.',
    phone: '+251-91-345-6789',
    hours: '5:00 PM - 2:00 AM',
    address: 'Cameroon St, Bole, Addis Ababa',
  },
  {
    id: 'club-9', name: 'Club H2O', category: 'Nightclub', categoryId: 'club',
    rating: 3.8, reviews: 89, distance: '0.9 km', latitude: 9.027, longitude: 38.754,
    image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400', verified: true,
    description: 'Popular high-energy nightclub.',
    phone: '+251-92-904-0760',
    hours: '8:00 PM - 3:00 AM',
    address: 'Mickey Leland St, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🏥  HEALTH (13 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'health-1', name: 'Black Lion Hospital', category: 'General Hospital', categoryId: 'health',
    rating: 4.2, reviews: 187, distance: '1.1 km', latitude: 9.03, longitude: 38.74,
    image: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', verified: true,
    description: 'Leading public teaching hospital.',
    phone: '+251-11-551-3000',
    hours: '24 hours',
    address: 'King George VI Street, Addis Ababa',
  },
  {
    id: 'health-2', name: 'St. Paul\'s Hospital', category: 'General Hospital', categoryId: 'health',
    rating: 4.1, reviews: 203, distance: '1.8 km', latitude: 9.035, longitude: 38.735,
    image: 'https://images.unsplash.com/photo-1587351021759-3772687a5a38?w=400', verified: true,
    description: 'Major referral hospital with specialized departments.',
    phone: '+251-11-550-0321',
    hours: '24 hours',
    address: 'Gulele Subcity, Addis Ababa',
  },
  {
    id: 'health-3', name: 'Nordic Medical Centre', category: 'Private Hospital', categoryId: 'health',
    rating: 4.5, reviews: 134, distance: '0.5 km', latitude: 9.021, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400', verified: true,
    description: 'Premium private medical services.',
    phone: '+251-11-554-9900',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'health-4', name: 'Lancet General Hospital', category: 'Private Hospital', categoryId: 'health',
    rating: 4.4, reviews: 76, distance: '2.3 km', latitude: 9.006, longitude: 38.765,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400', verified: true,
    description: 'Modern private hospital with advanced diagnostics.',
    hours: '24 hours',
    address: 'Megenagna, Addis Ababa',
  },
  {
    id: 'health-5', name: 'Myungsung Christian Medical Center', category: 'Private Hospital', categoryId: 'health',
    rating: 4.6, reviews: 167, distance: '0.6 km', latitude: 9.02, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', verified: true,
    description: 'Leading private hospital in Bole.',
    phone: '+251-11-618-9000',
    hours: '24 hours',
    address: 'Bole Medhane Alem, Addis Ababa',
  },
  {
    id: 'health-6', name: 'Hayat Hospital', category: 'Private Hospital', categoryId: 'health',
    rating: 4.3, reviews: 98, distance: '0.7 km', latitude: 9.019, longitude: 38.751,
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400', verified: true,
    description: 'Full-service private hospital.',
    phone: '+251-11-552-5678',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'health-7', name: 'Yohanis Pharmacy', category: 'Pharmacy', categoryId: 'health',
    rating: 5, reviews: 42, distance: '0.6 km', latitude: 9.019, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400', verified: true,
    description: 'Well-stocked pharmacy with friendly service.',
    address: 'Bethel Kolfe Subcity, Addis Ababa',
  },
  {
    id: 'health-8', name: 'Addis Cardiac Hospital', category: 'Private Hospital', categoryId: 'health',
    rating: 4.5, reviews: 87, distance: '0.8 km', latitude: 9.025, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400', verified: true,
    description: 'Specialized cardiac care center.',
    phone: '+251-11-554-1234',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'health-9', name: 'Zewditu Memorial Hospital', category: 'General Hospital', categoryId: 'health',
    rating: 3.9, reviews: 145, distance: '1.2 km', latitude: 9.028, longitude: 38.742,
    image: 'https://images.unsplash.com/photo-1587351021759-3772687a5a38?w=400', verified: true,
    description: 'Public hospital serving central Addis.',
    phone: '+251-11-551-7600',
    hours: '24 hours',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'health-10', name: 'The Super Pharmacy by iStyle', category: 'Pharmacy', categoryId: 'health',
    rating: 4.7, reviews: 89, distance: '0.4 km', latitude: 9.021, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400', verified: true,
    description: 'Premium pharmacy with wide range of medications.',
    hours: '9:00 AM - 9:00 PM',
    address: 'DH GEDA Tower, Africa Ave, Addis Ababa',
  },
  {
    id: 'health-11', name: 'Amin General Hospital', category: 'Private Hospital', categoryId: 'health',
    rating: 4.3, reviews: 98, distance: '2.0 km', latitude: 9.01, longitude: 38.77,
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400', verified: true,
    description: 'Private general hospital with quality care.',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'health-12', name: 'Landmark General Hospital', category: 'Private Hospital', categoryId: 'health',
    rating: 4.4, reviews: 76, distance: '2.3 km', latitude: 9.006, longitude: 38.765,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400', verified: true,
    description: 'Modern private hospital with advanced equipment.',
    address: 'CMC Area, Addis Ababa',
  },
  {
    id: 'health-13', name: 'Ethio Tebab General Hospital', category: 'General Hospital', categoryId: 'health',
    rating: 4, reviews: 112, distance: '1.5 km', latitude: 9.028, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400', verified: true,
    description: 'Community hospital serving residents.',
    address: 'Kirkos Subcity, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🏦  BANKS (8 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'bank-1', name: 'Commercial Bank of Ethiopia - Head Office', category: 'Bank', categoryId: 'finance',
    rating: 3.7, reviews: 145, distance: '0.3 km', latitude: 9.022, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400', verified: true,
    description: 'Ethiopia\'s largest commercial bank.',
    phone: '+251-11-551-5000',
    hours: '8:00 AM - 5:00 PM',
    address: 'Meskel Square, Addis Ababa',
  },
  {
    id: 'bank-2', name: 'Dashen Bank - Head Office', category: 'Bank', categoryId: 'finance',
    rating: 4.6, reviews: 98, distance: '0.5 km', latitude: 9.02, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', verified: true,
    description: 'One of Ethiopia\'s largest private banks.',
    phone: '+251-11-552-4111',
    hours: '8:00 AM - 5:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'bank-3', name: 'Bank of Abyssinia - Head Office', category: 'Bank', categoryId: 'finance',
    rating: 3.6, reviews: 112, distance: '0.7 km', latitude: 9.025, longitude: 38.745,
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400', verified: true,
    description: 'Leading private bank with innovative solutions.',
    hours: '8:00 AM - 5:00 PM',
    address: 'Ras Desta Damtew St, Addis Ababa',
  },
  {
    id: 'bank-4', name: 'Awash Bank - Head Office', category: 'Bank', categoryId: 'finance',
    rating: 4, reviews: 134, distance: '0.4 km', latitude: 9.023, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', verified: true,
    description: 'One of Ethiopia\'s largest private banks.',
    phone: '+251-11-554-9100',
    hours: '8:00 AM - 5:00 PM',
    address: 'Bole Road, Addis Ababa',
  },
  {
    id: 'bank-5', name: 'United Bank S.C.', category: 'Bank', categoryId: 'finance',
    rating: 4.1, reviews: 89, distance: '0.6 km', latitude: 9.024, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400', verified: true,
    description: 'Full-service commercial bank.',
    phone: '+251-11-552-7890',
    hours: '8:00 AM - 5:00 PM',
    address: 'Africa Ave, Addis Ababa',
  },
  {
    id: 'bank-6', name: 'Nib International Bank', category: 'Bank', categoryId: 'finance',
    rating: 4.2, reviews: 67, distance: '0.8 km', latitude: 9.026, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', verified: true,
    description: 'Modern banking with international standards.',
    phone: '+251-11-554-5678',
    hours: '8:00 AM - 5:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'bank-7', name: 'Zemen Bank', category: 'Bank', categoryId: 'finance',
    rating: 4.3, reviews: 78, distance: '0.5 km', latitude: 9.021, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', verified: true,
    description: 'Innovative private bank with digital services.',
    phone: '+251-11-552-3456',
    hours: '8:00 AM - 5:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'bank-8', name: 'Lion International Bank', category: 'Bank', categoryId: 'finance',
    rating: 3.8, reviews: 54, distance: '0.9 km', latitude: 9.027, longitude: 38.754,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', verified: true,
    description: 'Commercial banking for individuals and businesses.',
    phone: '+251-11-553-7890',
    hours: '8:00 AM - 5:00 PM',
    address: 'Kazanchis, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🛒  SHOPPING (7 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'shop-1', name: 'Mercato - Addis Merkato', category: 'Market', categoryId: 'shop',
    rating: 4, reviews: 345, distance: '1.5 km', latitude: 9.035, longitude: 38.735,
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400', verified: true,
    description: 'Africa\'s largest open-air market.',
    phone: '+251-96-372-7196',
    hours: '8:00 AM - 7:00 PM',
    address: 'Merkato, Addis Ababa',
  },
  {
    id: 'shop-2', name: 'Mafi City Center Mall', category: 'Shopping Mall', categoryId: 'shop',
    rating: 4.3, reviews: 178, distance: '0.8 km', latitude: 9.018, longitude: 38.758,
    image: 'https://images.unsplash.com/photo-1519567241046-7f70d83fd5e0?w=400', verified: true,
    description: 'Modern shopping mall with food court.',
    phone: '+251-93-595-5598',
    hours: '9:00 AM - 10:00 PM',
    address: 'Megenagna, Addis Ababa',
  },
  {
    id: 'shop-3', name: 'Friendship City Center', category: 'Shopping Mall', categoryId: 'shop',
    rating: 4.4, reviews: 234, distance: '0.4 km', latitude: 9.022, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400', verified: true,
    description: 'Popular mall with shops and food court.',
    phone: '+251-11-552-1234',
    hours: '9:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'shop-4', name: 'Dembel City Center', category: 'Shopping Mall', categoryId: 'shop',
    rating: 4.1, reviews: 198, distance: '0.6 km', latitude: 9.024, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1519567241046-7f70d83fd5e0?w=400', verified: true,
    description: 'Premium shopping on Bole Road.',
    phone: '+251-11-554-5678',
    hours: '9:00 AM - 9:00 PM',
    address: 'Africa Avenue, Addis Ababa',
  },
  {
    id: 'shop-5', name: 'Century Mall', category: 'Shopping Mall', categoryId: 'shop',
    rating: 4.2, reviews: 167, distance: '0.7 km', latitude: 9.025, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400', verified: true,
    description: 'Family-friendly mall with supermarket.',
    phone: '+251-11-555-6789',
    hours: '9:00 AM - 10:00 PM',
    address: 'Gurd Shola, Addis Ababa',
  },
  {
    id: 'shop-6', name: 'Shoa Supermarket', category: 'Supermarket', categoryId: 'shop',
    rating: 4, reviews: 145, distance: '0.3 km', latitude: 9.021, longitude: 38.747,
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400', verified: true,
    description: 'Popular supermarket chain.',
    hours: '8:00 AM - 10:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'shop-7', name: 'Safeway Supermarket', category: 'Supermarket', categoryId: 'shop',
    rating: 4.1, reviews: 112, distance: '0.5 km', latitude: 9.023, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1519567241046-7f70d83fd5e0?w=400', verified: true,
    description: 'Modern supermarket with loyalty program.',
    phone: '+251-11-553-4567',
    hours: '8:00 AM - 10:00 PM',
    address: 'CMC, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🏠  REAL ESTATE (6 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 're-1', name: 'Noah Real Estate', category: 'Real Estate', categoryId: 'realestate',
    rating: 4.3, reviews: 89, distance: '1.2 km', latitude: 9.015, longitude: 38.765,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400', verified: true,
    description: 'Leading developer of residential and commercial properties.',
    phone: '+251-11-554-7788',
    hours: '8:30 AM - 5:30 PM',
    address: 'Bole Subcity, Addis Ababa',
  },
  {
    id: 're-2', name: 'Ayat Real Estate', category: 'Real Estate', categoryId: 'realestate',
    rating: 4.1, reviews: 134, distance: '1.5 km', latitude: 9.011, longitude: 38.769,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', verified: true,
    description: 'One of Ethiopia\'s most established real estate developers.',
    phone: '+251-11-555-1234',
    hours: '8:30 AM - 5:30 PM',
    address: 'Ayat, Addis Ababa',
  },
  {
    id: 're-3', name: 'GIFT Real Estate', category: 'Real Estate', categoryId: 'realestate',
    rating: 4.4, reviews: 78, distance: '1.4 km', latitude: 9.013, longitude: 38.767,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', verified: true,
    description: 'Pioneer developer of luxury villas and apartments.',
    phone: '+251-11-556-7890',
    hours: '8:30 AM - 5:30 PM',
    address: 'Cazanchis, Addis Ababa',
  },
  {
    id: 're-4', name: 'Hagbes Real Estate', category: 'Real Estate', categoryId: 'realestate',
    rating: 4.3, reviews: 56, distance: '1.2 km', latitude: 9.015, longitude: 38.765,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400', verified: true,
    description: 'Premium residential and commercial properties.',
    phone: '+251-11-554-7788',
    address: 'Bole Subcity, Addis Ababa',
  },
  {
    id: 're-5', name: 'Ahadu Real Estate', category: 'Real Estate', categoryId: 'realestate',
    rating: 4.5, reviews: 78, distance: '1.4 km', latitude: 9.013, longitude: 38.767,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', verified: true,
    description: 'Trusted real estate agency for buying and selling.',
    phone: '+251-11-629-8816',
    hours: '8:30 AM - 5:30 PM',
    address: 'Cazanchis, Addis Ababa',
  },
  {
    id: 're-6', name: 'Metropolitan Real Estate', category: 'Real Estate', categoryId: 'realestate',
    rating: 4, reviews: 67, distance: '1.3 km', latitude: 9.014, longitude: 38.766,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', verified: true,
    description: 'Real estate development and property management.',
    phone: '+251-974-299-472',
    address: 'Megenagna, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🚲  SPORTS (3 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'sport-1', name: 'Sport Zone Addis', category: 'Sports Store', categoryId: 'sports',
    rating: 4.5, reviews: 34, distance: '1.0 km', latitude: 9.028, longitude: 38.756,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', verified: true,
    description: 'Sports equipment and fitness gear.',
    hours: '9:00 AM - 8:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'sport-2', name: 'Bicycle Shop Addis', category: 'Bicycle Store', categoryId: 'sports',
    rating: 4.3, reviews: 23, distance: '1.5 km', latitude: 9.032, longitude: 38.762,
    image: 'https://images.unsplash.com/photo-1593787691898-3227bde0b957?w=400', verified: true,
    description: 'Bicycle sales, repairs and accessories.',
    phone: '+251-911-20-8945',
    hours: '9:00 AM - 6:00 PM',
    address: 'Addis Ababa',
  },
  {
    id: 'sport-3', name: 'Addis Cycle Sport', category: 'Bicycle Store', categoryId: 'sports',
    rating: 4.2, reviews: 19, distance: '1.8 km', latitude: 9.035, longitude: 38.765,
    image: 'https://images.unsplash.com/photo-1567607440442-84b5c3c67481?w=400', verified: true,
    description: 'Cycling gear, repairs and bike rentals.',
    hours: '9:00 AM - 6:00 PM',
    address: 'Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🎓  EDUCATION (5 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'edu-1', name: 'Addis Ababa University', category: 'University', categoryId: 'edu',
    rating: 4.3, reviews: 423, distance: '2.0 km', latitude: 9.046, longitude: 38.755,
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', verified: true,
    description: 'Ethiopia\'s oldest and largest university.',
    phone: '+251-11-123-4567',
    hours: '8:00 AM - 5:00 PM',
    address: 'Sidist Kilo, Addis Ababa',
  },
  {
    id: 'edu-2', name: 'Addis Ababa Science and Technology University', category: 'University', categoryId: 'edu',
    rating: 4.1, reviews: 234, distance: '2.5 km', latitude: 9.05, longitude: 38.76,
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', verified: true,
    description: 'Science and technology focused university.',
    phone: '+251-11-555-1234',
    hours: '8:00 AM - 5:00 PM',
    address: 'Kilinto, Addis Ababa',
  },
  {
    id: 'edu-3', name: 'International Community School of Addis', category: 'International School', categoryId: 'edu',
    rating: 4.7, reviews: 89, distance: '1.5 km', latitude: 9.025, longitude: 38.755,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', verified: true,
    description: 'Prestigious IB and American curriculum school.',
    phone: '+251-11-661-7171',
    hours: '8:00 AM - 4:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'edu-4', name: 'Sandford International School', category: 'International School', categoryId: 'edu',
    rating: 4.5, reviews: 67, distance: '1.8 km', latitude: 9.03, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', verified: true,
    description: 'Long-standing IB international school.',
    phone: '+251-11-551-5678',
    hours: '8:00 AM - 4:00 PM',
    address: 'Kazanchis, Addis Ababa',
  },
  {
    id: 'edu-5', name: 'St. Mary\'s University', category: 'University', categoryId: 'edu',
    rating: 4, reviews: 156, distance: '1.2 km', latitude: 9.035, longitude: 38.745,
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', verified: true,
    description: 'Private university with extensive programs.',
    phone: '+251-11-552-3456',
    hours: '8:00 AM - 5:00 PM',
    address: 'Piassa, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ⛽  FUEL (5 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'fuel-1', name: 'TotalEnergies Bole Station', category: 'Fuel Station', categoryId: 'fuel',
    rating: 4, reviews: 45, distance: '0.5 km', latitude: 9.0215, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', verified: true,
    description: 'Full-service fuel station with convenience store.',
    hours: '24 hours',
    address: 'Bole Road, Addis Ababa',
  },
  {
    id: 'fuel-2', name: 'TotalEnergies Arat Kilo', category: 'Fuel Station', categoryId: 'fuel',
    rating: 4, reviews: 34, distance: '0.9 km', latitude: 9.026, longitude: 38.744,
    image: 'https://images.unsplash.com/photo-1597586124394-fbd6ef244b40?w=400', verified: true,
    description: 'Fuel station with convenience store.',
    hours: '24 hours',
    address: 'Arat Kilo, Addis Ababa',
  },
  {
    id: 'fuel-3', name: 'NOC Bole Station', category: 'Fuel Station', categoryId: 'fuel',
    rating: 3.8, reviews: 28, distance: '0.6 km', latitude: 9.022, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', verified: true,
    description: 'National Oil Ethiopia station in Bole.',
    hours: '24 hours',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'fuel-4', name: 'Shell Mexico Square', category: 'Fuel Station', categoryId: 'fuel',
    rating: 3.8, reviews: 34, distance: '0.9 km', latitude: 9.026, longitude: 38.744,
    image: 'https://images.unsplash.com/photo-1597586124394-fbd6ef244b40?w=400', verified: true,
    description: 'Convenient fuel station with car wash.',
    hours: '24 hours',
    address: 'Mexico Square, Addis Ababa',
  },
  {
    id: 'fuel-5', name: 'OLA Energy Megenagna', category: 'Fuel Station', categoryId: 'fuel',
    rating: 3.9, reviews: 23, distance: '0.7 km', latitude: 9.024, longitude: 38.751,
    image: 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', verified: true,
    description: 'Fuel station at Megenagna.',
    hours: '24 hours',
    address: 'Megenagna, Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 💰  MICROFINANCE (5 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'loan-1', name: 'Yegna Microfinance S.C.', category: 'Microfinance', categoryId: 'loan',
    rating: 4.4, reviews: 67, distance: '0.6 km', latitude: 9.02, longitude: 38.747,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', verified: true,
    description: 'Micro-loans and financial services for small businesses.',
    phone: '+251-960-506-006',
    hours: 'Mon-Fri 8:30AM-5:30PM',
    address: 'Tsehafi Tiezaz Afewerk St, Addis Ababa',
  },
  {
    id: 'loan-2', name: 'Wasasa Microfinance S.C.', category: 'Microfinance', categoryId: 'loan',
    rating: 3.5, reviews: 45, distance: '1.2 km', latitude: 9.028, longitude: 38.754,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', verified: true,
    description: 'Community-focused microfinance institution.',
    phone: '+251-113-679-157',
    hours: 'Mon-Fri 8:30AM-5:30PM',
    address: 'Addis Ababa',
  },
  {
    id: 'loan-3', name: 'Addis Credit & Saving Institution', category: 'Microfinance', categoryId: 'loan',
    rating: 4, reviews: 89, distance: '0.4 km', latitude: 9.022, longitude: 38.751,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', verified: true,
    description: 'Leading credit and saving institution.',
    phone: '+251-111-572-720',
    hours: 'Mon-Fri 8:30AM-5:30PM',
    address: 'Addis Ababa',
  },
  {
    id: 'loan-4', name: 'Harbu Micro Finance', category: 'Microfinance', categoryId: 'loan',
    rating: 3.1, reviews: 32, distance: '1.0 km', latitude: 9.026, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', verified: true,
    description: 'Microfinance with focus on women entrepreneurs.',
    phone: '+251-116-185-510',
    hours: 'Mon-Fri 8:30AM-5:30PM',
    address: 'Mickey Leland St, Addis Ababa',
  },
  {
    id: 'loan-5', name: 'Awach Sacco Ltd.', category: 'Saving Cooperative', categoryId: 'loan',
    rating: 3.6, reviews: 56, distance: '0.7 km', latitude: 9.023, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400', verified: true,
    description: 'Savings and credit cooperative.',
    phone: '+251-115-577-341',
    hours: 'Mon-Fri 8:30AM-5:30PM',
    address: 'Addis Ababa',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🚿  CAR WASH (4 real businesses)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'cw-1', name: 'MIG Car Wash', category: 'Car Wash', categoryId: 'carwash',
    rating: 4.7, reviews: 67, distance: '0.6 km', latitude: 9.02, longitude: 38.749,
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400', verified: true,
    description: 'Professional car washing and detailing.',
    phone: '+251-99-463-4949',
    hours: '8:00 AM - 8:00 PM',
    address: 'Addis Ababa',
  },
  {
    id: 'cw-2', name: 'Alpha Auto Care', category: 'Auto Repair', categoryId: 'carwash',
    rating: 5, reviews: 34, distance: '0.5 km', latitude: 9.021, longitude: 38.748,
    image: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400', verified: true,
    description: 'Premium auto care and repair.',
    phone: '+251-98-754-0471',
    hours: '8:00 AM - 8:00 PM',
    address: 'Bole, Addis Ababa',
  },
  {
    id: 'cw-3', name: 'Premier Car Wash and Detailing', category: 'Car Wash', categoryId: 'carwash',
    rating: 4.7, reviews: 54, distance: '0.7 km', latitude: 9.023, longitude: 38.75,
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400', verified: true,
    description: 'Top-tier car wash and detailing.',
    hours: '8:00 AM - 8:00 PM',
    address: 'Addis Ababa',
  },
  {
    id: 'cw-4', name: 'Abay Technical and Trading', category: 'Auto Repair', categoryId: 'carwash',
    rating: 4.3, reviews: 45, distance: '0.8 km', latitude: 9.025, longitude: 38.752,
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400', verified: true,
    description: 'Automotive technical services and repair.',
    phone: '+251-939-136-666',
    hours: '8:00 AM - 8:00 PM',
    address: 'Addis Ababa',
  },

];



// ── Mock Transactions ────────────────────────────────────────────────────
export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'earn', title: 'Review: Yod Abyssinia', points: 50, date: '2h ago', icon: '⭐' },
  { id: '2', type: 'redeem', title: 'Telebirr Transfer', points: -500, date: '1d ago', icon: '📱' },
  { id: '3', type: 'earn', title: 'Photo Upload', points: 25, date: '2d ago', icon: '📸' },
  { id: '4', type: 'earn', title: 'Check-in: Tomoca Coffee', points: 10, date: '3d ago', icon: '✓' },
  { id: '5', type: 'earn', title: 'Review: Sheraton Addis', points: 50, date: '5d ago', icon: '⭐' },
  { id: '6', type: 'redeem', title: 'Airtime (100 Br)', points: -200, date: '1w ago', icon: '📡' },
  { id: '7', type: 'earn', title: 'Check-in: Mercato', points: 10, date: '1w ago', icon: '✓' },
  { id: '8', type: 'earn', title: 'Review: YeGesha Cafe', points: 50, date: '2w ago', icon: '⭐' },
  { id: '9', type: 'earn', title: 'Review: iCog Labs', points: 50, date: '3d ago', icon: '⭐' },
  { id: '10', type: 'earn', title: 'Check-in: MIG Car Wash', points: 10, date: '1d ago', icon: '✓' },
];

export const MOCK_REWARDS: RewardOption[] = [
  { id: 'r1', name: 'Telebirr Transfer', points: 500, icon: '📱', available: true, category: 'finance' },
  { id: 'r2', name: 'Airtime (100 Br)', points: 200, icon: '📡', available: true, category: 'mobile' },
  { id: 'r3', name: 'Restaurant Voucher', points: 300, icon: '🍽️', available: false, category: 'food' },
  { id: 'r4', name: 'Hotel Discount', points: 400, icon: '🏨', available: true, category: 'travel' },
  { id: 'r5', name: 'Coffee Gift Card', points: 150, icon: '☕', available: true, category: 'food' },
  { id: 'r6', name: 'Movie Tickets', points: 250, icon: '🎬', available: true, category: 'entertainment' },
  { id: 'r7', name: 'Fuel Voucher', points: 200, icon: '⛽', available: true, category: 'auto' },
  { id: 'r8', name: 'Car Wash Voucher', points: 100, icon: '🚿', available: true, category: 'auto' },
];

export const EARN_OPTIONS = [
  { icon: '⭐', title: 'Write a Review', points: 50, color: '#F59E0B', description: 'Share your experience' },
  { icon: '📸', title: 'Upload Photo', points: 25, color: '#FAA330', description: 'Add photos to places' },
  { icon: '✓', title: 'Check-in', points: 10, color: '#10B981', description: 'Visit a location' },
  { icon: '🎥', title: 'Upload Video', points: 100, color: '#8B5CF6', description: 'Share a video review' },
];

// ── Store ────────────────────────────────────────────────────────────────
interface AppStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchCategoryFilter: string;
  setSearchCategoryFilter: (categoryId: string) => void;

  businesses: Business[];
  setBusinesses: (businesses: Business[]) => void;
  savedPlaces: string[];
  toggleSavedPlace: (businessId: string) => void;
  isSaved: (businessId: string) => boolean;

  reviews: Review[];
  addReview: (review: Review) => void;

  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  rewards: RewardOption[];
  points: number;

  notificationCount: number;
  markAllRead: () => void;
  incrementNotificationCount: () => void;
  updateUserPoints: (points: number) => void;
  setUser: (user: User) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: MOCK_USER,
  isAuthenticated: true,

  login: (user: User) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),

  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query, searchCategoryFilter: '' }),
  searchCategoryFilter: '',
  setSearchCategoryFilter: (categoryId: string) => set({ searchCategoryFilter: categoryId, searchQuery: '' }),

  businesses: MOCK_BUSINESSES,
  setBusinesses: (businesses: Business[]) => set({ businesses }),

  savedPlaces: ['food-1', 'cafe-1', 'hotel-2', 'cafe-2', 'tech-1', 'gym-2'],
  toggleSavedPlace: (businessId: string) =>
    set((state) => ({
      savedPlaces: state.savedPlaces.includes(businessId)
        ? state.savedPlaces.filter((id) => id !== businessId)
        : [...state.savedPlaces, businessId],
    })),
  isSaved: (businessId: string) => get().savedPlaces.includes(businessId),

  reviews: [],
  addReview: (review: Review) =>
    set((state) => ({ reviews: [review, ...state.reviews] })),

  transactions: MOCK_TRANSACTIONS,
  addTransaction: (tx: Transaction) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),

  rewards: MOCK_REWARDS,
  points: MOCK_USER.points,

  notificationCount: 3,
  markAllRead: () => set({ notificationCount: 0 }),
  incrementNotificationCount: () => set((state) => ({ notificationCount: state.notificationCount + 1 })),
  updateUserPoints: (points: number) =>
    set((state) => ({
      points,
      user: state.user ? { ...state.user, points } : null,
    })),
  setUser: (user: User) => set({ user }),
}));
