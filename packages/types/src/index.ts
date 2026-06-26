// ═══════════════════════════════════════════════════════════════════════════
// @nexi/types — Single source of truth for all data models
// Used by: mobile app, admin dashboard, business dashboard, backend API
// ═══════════════════════════════════════════════════════════════════════════

// ── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'business' | 'admin' | 'moderator';

export interface User {
  id: string;
  authId?: string;
  email: string;
  phone?: string;
  name: string;
  avatar?: string;
  role: UserRole;
  points: number;
  totalEarned: number;
  level: number;
  verified: boolean;
  reviewCount: number;
  photoCount: number;
  city?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

// ── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  sortOrder: number;
}

// ── Business ─────────────────────────────────────────────────────────────────

export type BusinessStatus = 'active' | 'pending' | 'rejected' | 'closed';

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
  status?: BusinessStatus;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Computed / enriched fields
  trendingScore?: number;
  recommendationScore?: number;
  isPromoted?: boolean;
  promotionType?: PromotionType;
  // ── Vector Embedding ────────────────────────────────────────────────
  /** OpenAI / local model embedding vector for semantic search */
  embedding?: number[];
  /** Text used to generate the embedding (for debugging/regeneration) */
  embeddingText?: string;
}

// ── Review ───────────────────────────────────────────────────────────────────

export type ReviewStatus = 'active' | 'flagged' | 'removed';

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  text: string;
  images?: string[];
  helpful: number;
  status?: ReviewStatus;
  createdAt: string;
  updatedAt?: string;
}

// ── Photo ────────────────────────────────────────────────────────────────────

export type PhotoStatus = 'pending' | 'approved' | 'rejected';

export interface Photo {
  id: string;
  businessId: string;
  userId: string;
  url: string;
  caption?: string;
  likes: number;
  status: PhotoStatus;
  createdAt: string;
}

// ── Saved Place ───────────────────────────────────────────────────────────────

export interface SavedPlace {
  id: number;
  userId: string;
  businessId: string;
  savedAt: string;
}

// ── Check-In ─────────────────────────────────────────────────────────────────

export interface CheckIn {
  id: string;
  userId: string;
  businessId: string;
  pointsEarned: number;
  createdAt: string;
}

// ── Points & Rewards ─────────────────────────────────────────────────────────

export type TransactionType = 'earn' | 'redeem';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;
  points: number;
  icon?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export interface RewardItem {
  id: string;
  name: string;
  points: number;
  icon: string;
  category?: string;
  stock?: number;
  active: boolean;
  description?: string;
  createdAt?: string;
}

export interface EarnOption {
  id: string;
  title: string;
  points: number;
  icon: string;
  type: 'earn';
  description: string;
  action: string; // e.g., 'checkin', 'review', 'photo', 'daily_login', 'referral'
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationCategory =
  | 'new_review'
  | 'new_location'
  | 'login_alert'
  | 'ad_promotion'
  | 'reward_earned'
  | 'business_response'
  | 'verification_approved'
  | 'photo_liked'
  | 'referral_bonus'
  | 'trending_alert'
  | 'leaderboard_update'
  | 'challenge_complete';

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  description: string;
  icon: string;
  color: string;
  link?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  period: LeaderboardPeriod;
  points: number;
  rank?: number;
  reviewsCount: number;
  photosCount: number;
  checkinsCount: number;
  updatedAt: string;
}

// ── Challenges ────────────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsReward: number;
  requirement: string;
  requiredCount: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
}

// ── Business Claims ───────────────────────────────────────────────────────────

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface BusinessClaim {
  id: string;
  businessId: string;
  userId: string;
  status: ClaimStatus;
  documents?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Reports ────────────────────────────────────────────────────────────────────

export type ReportType = 'spam' | 'fake_reviews' | 'wrong_info' | 'closed_business' | 'offensive' | 'duplicate' | 'other';
export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'business' | 'review' | 'photo' | 'user';
  targetId: string;
  reason: ReportType;
  description?: string;
  status: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

// ── Monetization / Promotions ─────────────────────────────────────────────────

export type PromotionType = 'featured' | 'boosted' | 'banner';

export interface BusinessPromotion {
  id: string;
  businessId: string;
  type: PromotionType;
  startsAt: string;
  endsAt: string;
  pricePaid?: number;
  paymentRef?: string;
  active: boolean;
  createdAt: string;
}

// ── User Behavior (Recommendation Fuel) ───────────────────────────────────────

export type BehaviorAction = 'view' | 'save' | 'checkin' | 'review' | 'search_click' | 'photo_upload' | 'share';

export interface UserBehavior {
  id: string;
  userId: string;
  businessId: string;
  action: BehaviorAction;
  categoryId?: string;
  createdAt: string;
}

export interface UserCategoryAffinity {
  userId: string;
  categoryId: string;
  score: number;
  interactionCount: number;
  updatedAt: string;
}

// ── Trending ──────────────────────────────────────────────────────────────────

export type TrendingPeriod = 'daily' | 'weekly';

export interface TrendingScore {
  businessId: string;
  score: number;
  period: TrendingPeriod;
  rank?: number;
  updatedAt: string;
}

// ── Search ─────────────────────────────────────────────────────────────────────

export interface SearchLog {
  id: string;
  userId?: string;
  query: string;
  resultCount: number;
  clickedBusinessId?: string;
  createdAt: string;
}

export interface SearchFilters {
  category?: string;
  minRating?: number;
  maxDistance?: number;
  priceLevel?: number;
  openNow?: boolean;
  verified?: boolean;
  features?: string[];
}

export interface SearchResult {
  businesses: Business[];
  total: number;
  query: string;
  filters?: SearchFilters;
  tookMs?: number;
}

// ── Cities ─────────────────────────────────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  active: boolean;
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'user_created'
  | 'business_added'
  | 'business_verified'
  | 'business_rejected'
  | 'review_flagged'
  | 'review_removed'
  | 'photo_approved'
  | 'photo_rejected'
  | 'report_resolved'
  | 'claim_approved'
  | 'claim_rejected'
  | 'reward_created';

export interface ActivityLog {
  id: string;
  adminId?: string;
  type: ActivityType;
  description: string;
  subject?: string;
  subjectType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Platform Analytics ─────────────────────────────────────────────────────────

export interface PlatformStats {
  totalUsers: number;
  totalBusinesses: number;
  totalReviews: number;
  totalCheckIns: number;
  newUsersToday: number;
  newReviewsToday: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  openReports: number;
  pendingClaims: number;
}

export interface BusinessAnalytics {
  businessId: string;
  views: number;
  saves: number;
  checkIns: number;
  reviewCount: number;
  avgRating: number;
  promotionClicks?: number;
  period: 'day' | 'week' | 'month' | 'all';
}

// ── API Response Wrappers ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthSession {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}
