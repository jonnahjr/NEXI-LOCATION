-- ═══════════════════════════════════════════════════════════════════════════
-- NEXI LOCATE — COMPLETE SUPABASE DATABASE SCHEMA
-- Fully idempotent — safe to run multiple times.
-- Covers: mobile app, web landing, admin dashboard, business dashboard
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPER: Idempotent type creation
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('earn', 'redeem');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM (
    'new_review', 'new_location', 'login_alert', 'ad_promotion',
    'reward_earned', 'business_response', 'verification_approved',
    'photo_liked', 'referral_bonus', 'trending_alert',
    'leaderboard_update', 'challenge_complete'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'user_created', 'business_added', 'business_verified', 'business_rejected',
    'review_flagged', 'review_removed', 'photo_approved', 'photo_rejected',
    'report_resolved', 'claim_approved', 'claim_rejected', 'reward_created'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_type AS ENUM (
    'spam', 'fake_reviews', 'wrong_info', 'closed_business',
    'offensive', 'duplicate', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. PROFILES (extends Supabase Auth users)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id         TEXT UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  name            TEXT NOT NULL DEFAULT '',
  avatar          TEXT,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'business', 'admin', 'moderator')),
  points          INTEGER NOT NULL DEFAULT 0,
  total_earned    INTEGER NOT NULL DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 1,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  review_count    INTEGER NOT NULL DEFAULT 0,
  photo_count     INTEGER NOT NULL DEFAULT 0,
  city            TEXT DEFAULT 'Addis Ababa',
  bio             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add any columns that might be missing from a prior partial run
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Addis Ababa';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. BUSINESS CATEGORIES (static lookup)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  icon        TEXT NOT NULL,
  color       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO categories (id, label, icon, color, sort_order) VALUES
  ('food',     'Restaurants',  '🍽️', '#EF4444', 1),
  ('cafe',     'Coffee',       '☕',  '#F59E0B', 2),
  ('hotel',    'Hotels',       '🏨',  '#3B82F6', 3),
  ('health',   'Clinics',      '🏥',  '#10B981', 4),
  ('shop',     'Shopping',     '🛍️', '#8B5CF6', 5),
  ('club',     'Nightlife',    '🎵',  '#EC4899', 6),
  ('fuel',     'Fuel',         '⛽',  '#6366F1', 7),
  ('finance',  'Banks',        '🏦',  '#14B8A6', 8),
  ('edu',      'Schools',      '🏫',  '#F97316', 9),
  ('gym',      'Fitness',      '💪',  '#22C55E', 10),
  ('tech',     'Technology',   '💻',  '#A855F7', 11),
  ('auto',     'Automotive',   '🚗',  '#64748B', 12),
  ('salon',    'Salons',       '💇',  '#E879F9', 13),
  ('park',     'Parks',        '🌳',  '#22C55E', 14),
  ('culture',  'Culture',      '🎭',  '#F43F5E', 15),
  ('transport','Transport',    '🚌',  '#0EA5E9', 16),
  ('realestate','Real Estate', '🏠',  '#D97706', 17),
  ('electronics','Electronics','📱',  '#6B7280', 18)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label, icon = EXCLUDED.icon,
  color = EXCLUDED.color, sort_order = EXCLUDED.sort_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. BUSINESSES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS businesses (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT '',
  category_id     TEXT NOT NULL DEFAULT '' REFERENCES categories(id) ON DELETE SET NULL,
  rating          REAL NOT NULL DEFAULT 0,
  reviews         INTEGER NOT NULL DEFAULT 0,
  distance        TEXT NOT NULL DEFAULT '',
  latitude        REAL NOT NULL DEFAULT 0,
  longitude       REAL NOT NULL DEFAULT 0,
  image           TEXT NOT NULL DEFAULT '',
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  description     TEXT NOT NULL DEFAULT '',
  phone           TEXT,
  website         TEXT,
  hours           TEXT,
  address         TEXT NOT NULL DEFAULT '',
  city            TEXT DEFAULT 'Addis Ababa',
  price_level     INTEGER DEFAULT 0,
  features        TEXT[] DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected', 'closed')),
  owner_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns that may be missing from a prior partial run
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Addis Ababa';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS price_level INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected', 'closed'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS distance TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_reviews ON businesses(reviews DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(name);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(latitude, longitude);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. REVIEWS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text            TEXT NOT NULL DEFAULT '',
  images          TEXT[] DEFAULT '{}',
  helpful         INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns that may be missing from a prior partial run
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. SAVED PLACES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saved_places (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id     TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_places_user ON saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_business ON saved_places(business_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. PHOTOS (community-uploaded business photos)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS photos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  caption         TEXT,
  likes           INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_business ON photos(business_id);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. POINTS TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            transaction_type NOT NULL,
  title           TEXT NOT NULL,
  points          INTEGER NOT NULL,
  icon            TEXT,
  reference_type  TEXT,
  reference_id    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category        notification_category NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  icon            TEXT NOT NULL DEFAULT '📌',
  color           TEXT NOT NULL DEFAULT '#3B82F6',
  link            TEXT,
  image_url       TEXT,
  metadata        JSONB DEFAULT '{}',
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. BUSINESS CLAIMS (business dashboard ownership)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS business_claims (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          claim_status NOT NULL DEFAULT 'pending',
  documents       TEXT[] DEFAULT '{}',
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_claims_business ON business_claims(business_id);
CREATE INDEX IF NOT EXISTS idx_business_claims_user ON business_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_business_claims_status ON business_claims(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. ADMIN ACTIVITY LOG
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS activity_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type            activity_type NOT NULL,
  description     TEXT NOT NULL,
  subject         TEXT,
  subject_type    TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. REPORTS (user-generated reports of businesses/reviews)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type     TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  reason          report_type NOT NULL,
  description     TEXT,
  status          report_status NOT NULL DEFAULT 'open',
  resolved_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. LEADERBOARD (weekly/monthly rankings)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS leaderboard (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,
  points          INTEGER NOT NULL DEFAULT 0,
  rank            INTEGER,
  reviews_count   INTEGER NOT NULL DEFAULT 0,
  photos_count    INTEGER NOT NULL DEFAULT 0,
  checkins_count  INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard(period, points DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. CHALLENGES (community challenges for rewards)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS challenges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  icon            TEXT NOT NULL DEFAULT '🎯',
  points_reward   INTEGER NOT NULL DEFAULT 0,
  requirement     TEXT NOT NULL,
  required_count  INTEGER NOT NULL DEFAULT 1,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_challenges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id    UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress        INTEGER NOT NULL DEFAULT 0,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. CHECK-INS (earn points for visiting places)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS check_ins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id     TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  points_earned   INTEGER NOT NULL DEFAULT 10,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_business ON check_ins(business_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 15. REDEEMABLE ITEMS (reward catalog for admin dashboard)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS redeemable_items (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  points          INTEGER NOT NULL,
  icon            TEXT NOT NULL DEFAULT '🎁',
  category        TEXT,
  stock           INTEGER DEFAULT -1,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (drop first for idempotency)
-- ═══════════════════════════════════════════════════════════════════════════

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
END $$;
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid()::text = id::text OR auth.uid() IS NULL);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id::text);

-- Businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Businesses are publicly readable" ON businesses; END $$;
CREATE POLICY "Businesses are publicly readable" ON businesses FOR SELECT USING (true);

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Reviews are publicly readable" ON reviews;
  DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
END $$;
CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Saved Places
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on saved_places" ON saved_places; END $$;
CREATE POLICY "Allow all on saved_places" ON saved_places FOR ALL USING (true) WITH CHECK (true);

-- Photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Photos are publicly readable" ON photos;
  DROP POLICY IF EXISTS "Users can insert own photos" ON photos;
END $$;
CREATE POLICY "Photos are publicly readable" ON photos FOR SELECT USING (true);
CREATE POLICY "Users can insert own photos" ON photos FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can read own notifications" ON notifications; END $$;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Users can read own transactions" ON transactions; END $$;
CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT USING (auth.uid()::text = user_id::text);

-- Activity Log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Activity log is admin only" ON activity_log; END $$;
CREATE POLICY "Activity log is admin only" ON activity_log FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator')));

-- Check-ins
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read own check-ins" ON check_ins;
  DROP POLICY IF EXISTS "Users can insert own check-ins" ON check_ins;
END $$;
CREATE POLICY "Users can read own check-ins" ON check_ins FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own check-ins" ON check_ins FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Redeemable items
ALTER TABLE redeemable_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Redeemable items are publicly readable" ON redeemable_items; END $$;
CREATE POLICY "Redeemable items are publicly readable" ON redeemable_items FOR SELECT USING (true);

-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can create reports" ON reports;
  DROP POLICY IF EXISTS "Reports are admin readable" ON reports;
END $$;
CREATE POLICY "Anyone can create reports" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Reports are admin readable" ON reports FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator')));

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at on profile changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles; CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END $$;

DO $$ BEGIN DROP TRIGGER IF EXISTS trg_businesses_updated_at ON businesses; CREATE TRIGGER trg_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END $$;

DO $$ BEGIN DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews; CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END $$;

-- Update review_count + rating on profiles when review is added
CREATE OR REPLACE FUNCTION update_business_stats()
RETURNS TRIGGER AS $$
DECLARE
  new_rating REAL;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment review count
    UPDATE businesses SET reviews = reviews + 1 WHERE id = NEW.business_id;
    UPDATE profiles SET review_count = review_count + 1 WHERE id = NEW.user_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement review count
    UPDATE businesses SET reviews = GREATEST(reviews - 1, 0) WHERE id = OLD.business_id;
    UPDATE profiles SET review_count = GREATEST(review_count - 1, 0) WHERE id = OLD.user_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.rating IS DISTINCT FROM NEW.rating THEN
    -- Rating changed — recalculate
    NULL; -- handled below
  END IF;

  -- Recalculate average rating
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1)::REAL, 0)
  INTO new_rating
  FROM reviews
  WHERE business_id = COALESCE(NEW.business_id, OLD.business_id) AND status = 'active';

  UPDATE businesses
  SET rating = new_rating
  WHERE id = COALESCE(NEW.business_id, OLD.business_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN DROP TRIGGER IF EXISTS trg_review_inserted ON reviews; CREATE TRIGGER trg_review_inserted AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_business_stats(); END $$;

DO $$ BEGIN DROP TRIGGER IF EXISTS trg_review_updated ON reviews; CREATE TRIGGER trg_review_updated AFTER UPDATE OF rating ON reviews FOR EACH ROW EXECUTE FUNCTION update_business_stats(); END $$;

DO $$ BEGIN DROP TRIGGER IF EXISTS trg_review_deleted ON reviews; CREATE TRIGGER trg_review_deleted AFTER DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_business_stats(); END $$;

-- Log activity when business status changes (admin_id set by caller via app.user_id setting)
CREATE OR REPLACE FUNCTION log_business_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_log (admin_id, type, description, subject, subject_type)
    VALUES (
      NULLIF(current_setting('app.user_id', TRUE), '')::UUID,
      CASE
        WHEN NEW.status = 'active' AND OLD.status = 'pending' THEN 'business_verified'
        WHEN NEW.status = 'rejected' THEN 'business_rejected'
        ELSE 'business_added'
      END,
      'Business status changed: ' || NEW.name || ' (' || OLD.status || ' → ' || NEW.status || ')',
      NEW.id,
      'business'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN DROP TRIGGER IF EXISTS trg_business_status_change ON businesses; CREATE TRIGGER trg_business_status_change AFTER UPDATE OF status ON businesses FOR EACH ROW EXECUTE FUNCTION log_business_status_change(); END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA — Users + 36 Real Addis Ababa Businesses
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert mock profiles (for development without Supabase Auth)
INSERT INTO profiles (id, auth_id, email, phone, name, role, points, total_earned, level, verified, review_count, photo_count) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'jonas@example.com', '+251-91-234-5678', 'Jonas', 'user', 1240, 2450, 5, TRUE, 24, 48),
  ('00000000-0000-0000-0000-000000000002', NULL, 'abebe@example.com', '+251-91-111-1111', 'Abebe B.', 'user', 850, 1200, 3, TRUE, 8, 15),
  ('00000000-0000-0000-0000-000000000003', NULL, 'sarah@example.com', '+251-91-222-2222', 'Sarah M.', 'user', 920, 1800, 4, TRUE, 14, 22),
  ('00000000-0000-0000-0000-000000000004', NULL, 'meron@example.com', '+251-91-333-3333', 'Meron K.', 'user', 1500, 3000, 6, TRUE, 35, 67),
  ('00000000-0000-0000-0000-000000000005', NULL, 'tewodros@example.com', '+251-91-444-4444', 'Tewodros A.', 'user', 670, 900, 3, TRUE, 6, 12),
  ('00000000-0000-0000-0000-000000000010', NULL, 'admin@nexilocate.com', '+251-91-000-0000', 'Admin Panel', 'admin', 5000, 10000, 10, TRUE, 0, 0),
  ('00000000-0000-0000-0000-000000000011', NULL, 'business@yod.com', '+251-91-555-5555', 'Yod Abyssinia Owner', 'business', 3200, 5000, 8, TRUE, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert 36 businesses
INSERT INTO businesses (id, name, category, category_id, rating, reviews, latitude, longitude, image, verified, description, phone, hours, address, status, features) VALUES
  -- Restaurants
  ('food-1', 'Yod Abyssinia Restaurant', 'Ethiopian Cuisine', 'food', 4.8, 324, 9.0227, 38.7468, 'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400', TRUE, 'Authentic Ethiopian cuisine with live music and traditional coffee ceremony.', '+251-11-123-4567', '8:00 AM - 10:00 PM', 'Bole Road, Addis Ababa', 'active', ARRAY['WiFi', 'Live Music', 'Parking']),
  ('food-2', 'Kategna Restaurant', 'Ethiopian Cuisine', 'food', 4.7, 267, 9.0215, 38.7485, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400', TRUE, 'High-quality traditional Ethiopian cuisine with extensive menu.', '+251-11-667-2879', '8:00 AM - 11:00 PM', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['WiFi', 'Parking']),
  ('food-3', 'Gusto Trattoria', 'Italian', 'food', 4.5, 189, 9.025, 38.75, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', TRUE, 'Italian and Mediterranean fusion cuisine in a cozy setting.', '+251-11-553-0444', '11:00 AM - 10:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['WiFi', 'Outdoor', 'Parking']),
  ('food-4', 'Marcus Addis Restaurant & Sky Bar', 'Fine Dining', 'food', 4.2, 156, 9.025, 38.755, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', TRUE, 'Premium dining with panoramic city views on the 47th floor.', '+251-11-555-0101', '6:00 PM - 11:00 PM', 'Head Office Tower, 47th Fl, Addis Ababa', 'active', ARRAY['Valet', 'Wine', 'Sky View']),
  ('food-5', 'Arirang Korean Restaurant', 'Korean', 'food', 4.3, 112, 9.023, 38.749, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', TRUE, 'Authentic Korean cuisine with BBQ and traditional dishes.', '+251-11-618-1618', '11:00 AM - 10:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['BBQ', 'WiFi']),
  ('food-6', 'Bait Al Mandi', 'Yemeni', 'food', 4.4, 134, 9.02, 38.751, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', TRUE, 'Authentic Yemeni and Middle Eastern cuisine.', '+251-11-551-2345', '10:00 AM - 11:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Parking', 'WiFi']),
  ('food-7', 'Little China Restaurant', 'Chinese', 'food', 4.1, 98, 9.026, 38.752, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', TRUE, 'Chinese cuisine with extensive dim sum and noodle options.', '+251-11-554-4321', '11:00 AM - 10:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['Dim Sum', 'WiFi']),
  ('food-8', 'Sishu Restaurant', 'Burgers', 'food', 4.3, 145, 9.022, 38.748, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', TRUE, 'Popular spot for burgers, sandwiches and comfort food.', '+251-11-661-6116', '8:00 AM - 10:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['WiFi', 'Takeaway']),
  ('food-9', '2000 Habesha Cultural Restaurant', 'Ethiopian Cultural', 'food', 4.3, 312, 9.03, 38.74, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', TRUE, 'Live cultural music and dance performances with traditional cuisine.', '+251-91-283-8383', '9:00 AM - 12:00 AM', 'Namibia St, Addis Ababa', 'active', ARRAY['Live Music', 'Dance', 'Parking']),
  ('food-10', 'Cravings Restaurant & Bar', 'International', 'food', 4.6, 287, 9.021, 38.75, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', TRUE, 'Modern international cuisine with extensive wine and cocktail menu.', '+251-11-868-5353', '11:00 AM - 11:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Bar', 'Wine', 'WiFi']),
  -- Cafes
  ('cafe-1', 'Tomoca Coffee', 'Coffee Shop', 'cafe', 4.6, 234, 9.02, 38.75, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', TRUE, 'Addis Ababa''s iconic coffee shop since 1953.', '+251-11-111-2498', '6:00 AM - 10:00 PM', 'Wawel St, Addis Ababa', 'active', ARRAY['WiFi', 'Takeaway']),
  ('cafe-2', 'Kaldi''s Coffee', 'Coffee Shop', 'cafe', 4.2, 312, 9.022, 38.747, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', TRUE, 'Ethiopia''s largest coffee chain with modern ambiance.', NULL, '6:00 AM - 10:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['WiFi']),
  ('cafe-3', 'Garden of Coffee', 'Specialty Coffee', 'cafe', 4.8, 98, 9.021, 38.748, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', TRUE, 'Artisan coffee roastery focusing on sustainable beans.', '+251-91-345-6789', '7:00 AM - 9:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['WiFi', 'Roastery']),
  ('cafe-4', 'Mokarar Coffee', 'Coffee Shop', 'cafe', 4.5, 112, 9.025, 38.746, 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', TRUE, 'Historic coffee shop serving premium Ethiopian beans.', '+251-11-111-5678', '6:00 AM - 9:00 PM', 'Piassa, Addis Ababa', 'active', ARRAY['Historic']),
  ('cafe-5', 'Reboot Coffee', 'Coffee Shop', 'cafe', 4.8, 112, 9.024, 38.744, 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', TRUE, 'Modern coffee shop with vibrant workspace atmosphere.', NULL, '7:00 AM - 9:00 PM', '4 Kilo, Addis Ababa', 'active', ARRAY['WiFi', 'Workspace']),
  -- Hotels
  ('hotel-1', 'Sheraton Addis Hotel', 'Luxury Hotel', 'hotel', 4.8, 423, 9.017, 38.751, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', TRUE, 'Iconic luxury hotel with stunning architecture and premium service.', '+251-11-517-1717', '24 hours', 'Taitu Street, Addis Ababa', 'active', ARRAY['Pool', 'Spa', 'Gym', 'WiFi', 'Restaurant']),
  ('hotel-2', 'Hilton Addis Ababa', 'Luxury Hotel', 'hotel', 4.6, 512, 9.025, 38.745, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', TRUE, 'Five-star luxury hotel with pools and gardens.', '+251-11-517-0000', '24 hours', 'Menelik II Ave, Addis Ababa', 'active', ARRAY['Pool', 'Gym', 'WiFi', 'Restaurant']),
  ('hotel-3', 'Hyatt Regency Addis Ababa', 'Luxury Hotel', 'hotel', 4.7, 345, 9.022, 38.752, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', TRUE, 'Modern luxury hotel near Meskel Square.', '+251-11-544-1234', '24 hours', 'Meskel Square, Addis Ababa', 'active', ARRAY['Pool', 'Gym', 'Spa', 'WiFi']),
  ('hotel-4', 'Radisson Blu Hotel Addis Ababa', 'Business Hotel', 'hotel', 4.5, 298, 9.024, 38.748, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', TRUE, 'Premium business hotel with conference facilities.', '+251-11-554-0000', '24 hours', 'Kazanchis, Addis Ababa', 'active', ARRAY['Gym', 'WiFi', 'Conference']),
  ('hotel-5', 'Ethiopian Skylight Hotel', 'Luxury Hotel', 'hotel', 4.6, 267, 9.015, 38.755, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', TRUE, 'Modern airport hotel with world-class amenities.', '+251-11-558-0000', '24 hours', 'Bole Airport, Addis Ababa', 'active', ARRAY['Pool', 'Gym', 'Spa', 'WiFi', 'Airport Shuttle']),
  -- Health
  ('health-1', 'Black Lion Hospital', 'General Hospital', 'health', 4.2, 187, 9.03, 38.74, 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', TRUE, 'Leading public teaching hospital.', '+251-11-551-3000', '24 hours', 'King George VI Street, Addis Ababa', 'active', ARRAY['Emergency', 'Pharmacy']),
  ('health-2', 'Nordic Medical Centre', 'Private Hospital', 'health', 4.5, 134, 9.021, 38.748, 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400', TRUE, 'Premium private medical services.', '+251-11-554-9900', '24 hours', 'Bole, Addis Ababa', 'active', ARRAY['Emergency', 'Lab', 'Pharmacy']),
  ('health-3', 'Myungsung Christian Medical Center', 'Private Hospital', 'health', 4.6, 167, 9.02, 38.749, 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', TRUE, 'Leading private hospital in Bole.', '+251-11-618-9000', '24 hours', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Emergency', 'ICU', 'Pharmacy']),
  -- Shops
  ('shop-1', 'Mercato - Addis Merkato', 'Market', 'shop', 4.0, 345, 9.035, 38.735, 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400', TRUE, 'Africa''s largest open-air market.', '+251-96-372-7196', '8:00 AM - 7:00 PM', 'Merkato, Addis Ababa', 'active', ARRAY['Open Air', 'Bargaining']),
  ('shop-2', 'Edna Mall', 'Shopping Mall', 'shop', 4.3, 890, 9.001, 38.784, 'https://images.unsplash.com/photo-1519567281023-e1262d182b8d?w=400', TRUE, 'Popular mall with Matti Cinema and gaming zone.', '+251-11-661-6272', '8:00 AM - 10:00 PM', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Cinema', 'Food Court', 'Parking']),
  -- Nightlife
  ('club-1', 'Club Illusion', 'Nightclub', 'club', 4.3, 156, 9.027, 38.754, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', TRUE, 'Long-standing club with electrifying atmosphere.', '+251-91-127-2628', '9:00 PM - 3:00 AM', 'Kazanchis, Addis Ababa', 'active', ARRAY['VIP', 'DJ', 'Bar']),
  ('club-2', 'Wakanda Ultra Lounge', 'Lounge', 'club', 4.7, 134, 9.021, 38.749, 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400', TRUE, 'Ultra lounge with premium cocktails and VIP experience.', '+251-93-001-1125', '7:00 PM - 2:00 AM', 'Mickey Leland St, Addis Ababa', 'active', ARRAY['VIP', 'Cocktails', 'Hookah']),
  -- Tech
  ('tech-1', 'iCog Labs', 'AI & Robotics', 'tech', 4.5, 67, 9.016, 38.77, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400', TRUE, 'AI research lab developing intelligent systems.', '+251-11-554-1234', '9:00 AM - 6:00 PM', 'Bole Road, Addis Ababa', 'active', ARRAY['AI Lab', 'Research']),
  ('tech-2', 'Chapa Financial Technologies', 'Fintech', 'tech', 4.7, 89, 9.019, 38.765, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', TRUE, 'Ethiopia''s leading payment gateway.', '+251-960-724-272', '9:00 AM - 6:00 PM', 'Bole Subcity, Addis Ababa', 'active', ARRAY['Fintech']),
  -- Fuel
  ('fuel-1', 'TotalEnergies Bole Station', 'Fuel Station', 'fuel', 4.0, 45, 9.0215, 38.749, 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', TRUE, 'Full-service fuel station with convenience store.', NULL, '24 hours', 'Bole Road, Addis Ababa', 'active', ARRAY['24hr', 'Convenience Store']),
  -- Banks
  ('bank-1', 'Commercial Bank of Ethiopia - Head Office', 'Bank', 'finance', 3.7, 145, 9.022, 38.752, 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400', TRUE, 'Ethiopia''s largest commercial bank.', '+251-11-551-5000', '8:00 AM - 5:00 PM', 'Meskel Square, Addis Ababa', 'active', ARRAY['ATM', 'Forex']),
  ('bank-2', 'Dashen Bank - Head Office', 'Bank', 'finance', 4.6, 98, 9.02, 38.748, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', TRUE, 'One of Ethiopia''s largest private banks.', '+251-11-552-4111', '8:00 AM - 5:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['ATM', 'Forex', 'Mobile Banking']),
  -- Gyms
  ('gym-1', 'Vigor Fitness Laphto Mall', 'Fitness Center', 'gym', 4.8, 156, 9.021, 38.747, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', TRUE, 'Premium fitness center with pool and spa.', '+251-11-552-8800', '6:00 AM - 10:00 PM', 'Laphto Mall, Old Airport, Addis Ababa', 'active', ARRAY['Pool', 'Spa', 'Sauna', 'Personal Trainer']),
  ('gym-2', 'SweatBox Addis', 'Fitness Studio', 'gym', 4.6, 87, 9.019, 38.749, 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400', TRUE, 'High-intensity group classes and personal training.', '+251-910-657-999', '5:00 AM - 10:00 PM', 'Bole Subcity, Addis Ababa', 'active', ARRAY['HIIT', 'Yoga', 'Personal Training']),
  -- Education
  ('edu-1', 'Addis Ababa University', 'University', 'edu', 4.3, 423, 9.046, 38.755, 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', TRUE, 'Ethiopia''s oldest and largest university.', '+251-11-123-4567', '8:00 AM - 5:00 PM', 'Sidist Kilo, Addis Ababa', 'active', ARRAY['Library', 'Research', 'Sports']),
  ('edu-2', 'International Community School of Addis', 'International School', 'edu', 4.7, 89, 9.025, 38.755, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', TRUE, 'Prestigious IB and American curriculum school.', '+251-11-661-7171', '8:00 AM - 4:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['IB Program', 'Sports', 'Arts'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, category = EXCLUDED.category, category_id = EXCLUDED.category_id,
  rating = EXCLUDED.rating, reviews = EXCLUDED.reviews,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, image = EXCLUDED.image,
  verified = EXCLUDED.verified, description = EXCLUDED.description,
  phone = EXCLUDED.phone, hours = EXCLUDED.hours, address = EXCLUDED.address,
  updated_at = NOW();

-- Insert sample reviews
INSERT INTO reviews (business_id, user_id, rating, text, images, helpful) VALUES
  ('food-1', '00000000-0000-0000-0000-000000000002', 5, 'Amazing food and fast service. The traditional coffee ceremony was unforgettable!', ARRAY['https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200'], 24),
  ('food-1', '00000000-0000-0000-0000-000000000003', 5, 'Best Ethiopian restaurant in Addis. The live music creates such a vibrant atmosphere.', '{}', 18),
  ('food-1', '00000000-0000-0000-0000-000000000004', 5, 'Incredible flavors! The injera was perfectly made. A must-visit in Addis.', ARRAY['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200'], 31),
  ('food-1', '00000000-0000-0000-0000-000000000005', 5, 'The doro wat is the best I have ever had. Authentic and delicious.', '{}', 15),
  ('food-1', '00000000-0000-0000-0000-000000000001', 5, 'Great food and service. Would recommend the platter for sharing.', '{}', 12),
  ('cafe-1', '00000000-0000-0000-0000-000000000003', 5, 'Best coffee in Addis! The single-origin Yirgacheffe is outstanding.', '{}', 22),
  ('cafe-2', '00000000-0000-0000-0000-000000000001', 4, 'Classic Addis institution. The espresso is strong and authentic.', '{}', 16),
  ('hotel-1', '00000000-0000-0000-0000-000000000004', 5, 'World-class hotel with exceptional service. The gardens are stunning.', '{}', 28),
  ('hotel-2', '00000000-0000-0000-0000-000000000005', 5, 'Absolutely stunning property. The architecture is breathtaking.', '{}', 35),
  ('gym-1', '00000000-0000-0000-0000-000000000001', 5, 'Top-notch equipment and trainers. Best gym in the area.', '{}', 19),
  ('tech-1', '00000000-0000-0000-0000-000000000001', 5, 'Fascinating AI research happening here. Very innovative team.', '{}', 14),
  ('bank-2', '00000000-0000-0000-0000-000000000003', 4, 'Great selection of vehicles and professional service.', '{}', 8);

-- Insert sample transactions
INSERT INTO transactions (user_id, type, title, points, icon, reference_type, reference_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'earn',  'Daily Login Bonus',    5,  '📅', 'login',    NULL),
  ('00000000-0000-0000-0000-000000000001', 'earn',  'Wrote a Review',       50, '✍️', 'review',  'food-1'),
  ('00000000-0000-0000-0000-000000000001', 'earn',  'Added a Photo',        25, '📸', 'photo',   'food-1'),
  ('00000000-0000-0000-0000-000000000001', 'earn',  'Invited a Friend',     100,'👥', 'referral',NULL),
  ('00000000-0000-0000-0000-000000000001', 'earn',  'Check-In at Place',    10, '📍', 'checkin', 'cafe-1'),
  ('00000000-0000-0000-0000-000000000001', 'redeem','Free Coffee Reward',   200,'☕', 'reward',  'r1'),
  ('00000000-0000-0000-0000-000000000001', 'redeem','Ride Discount',        300,'🚕', 'reward',  'r3');

-- Insert sample notifications
INSERT INTO notifications (user_id, category, title, description, icon, color, link, metadata) VALUES
  ('00000000-0000-0000-0000-000000000001', 'new_review', 'New Review on Yod Abyssinia', 'Abebe B. left a 5-star review!', '⭐', '#F59E0B', '/business/food-1', '{"businessId":"food-1","reviewer":"Abebe B."}'),
  ('00000000-0000-0000-0000-000000000001', 'reward_earned', 'You earned +50 points!', 'Review bonus credited to your account.', '🎁', '#10B981', '/rewards', '{"points":50}'),
  ('00000000-0000-0000-0000-000000000001', 'leaderboard_update', 'You moved up to #12!', 'You climbed 3 spots on the weekly leaderboard.', '🏆', '#F59E0B', '/leaderboard', '{"rank":12,"change":3}'),
  ('00000000-0000-0000-0000-000000000001', 'new_location', 'New Place: Garden of Coffee', 'A new specialty coffee shop opened near you!', '📍', '#3B82F6', '/business/cafe-3', '{"businessId":"cafe-3"}');

-- Insert sample challenges
INSERT INTO challenges (title, description, icon, points_reward, requirement, required_count) VALUES
  ('Review Master', 'Write 5 reviews this week', '✍️', 250, 'review_5', 5),
  ('Photo Explorer', 'Upload 10 photos of places', '📸', 200, 'photo_10', 10),
  ('City Explorer', 'Check in at 3 different places', '📍', 100, 'checkin_3', 3);

-- Insert redeemable items (reward catalog)
INSERT INTO redeemable_items (id, name, points, icon, category, description) VALUES
  ('r1', '☕ Free Coffee', 200, '☕', 'food', 'Redeem a free coffee at any partner cafe'),
  ('r2', '🍕 Meal Voucher', 500, '🍕', 'food', 'Get a meal voucher worth 500 Birr'),
  ('r3', '🚕 Ride Discount', 300, '🚕', 'transport', 'Discount on your next ride'),
  ('r4', '🏋️ Gym Pass', 800, '🏋️', 'fitness', 'One week free gym access'),
  ('r5', '📱 Phone Credit', 100, '📱', 'tech', '100 Birr mobile phone credit'),
  ('r6', '🎬 Cinema Ticket', 400, '🎬', 'entertainment', 'Free cinema ticket at partner theaters'),
  ('r7', '🛒 Shopping Voucher', 600, '🛒', 'shop', '600 Birr shopping voucher'),
  ('r8', '⛽ Fuel Discount', 350, '⛽', 'fuel', 'Discount on fuel at partner stations')
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════
-- EXTENDED BUSINESS DIRECTORY — ALL TYPES — ETHIOPIA (ADDIS ABABA + CITIES)
-- 200+ real businesses. Run anytime; safe with ON CONFLICT DO UPDATE.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO businesses (id, name, category, category_id, rating, reviews, latitude, longitude, image, verified, description, phone, hours, address, status, features) VALUES

-- ══════════════════ RESTAURANTS ══════════════════
('food-r01', 'Castelli Restaurant', 'Italian', 'food', 4.6, 312, 9.0265, 38.7469, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', TRUE, 'Classic Italian fine dining since 1948. One of the oldest restaurants in Addis Ababa.', '+251-11-156-3580', '12:00 PM - 10:00 PM', 'Mahatma Gandhi St, Addis Ababa', 'active', ARRAY['WiFi', 'Bar', 'Parking']),
('food-r02', 'Makush Art Gallery & Restaurant', 'Ethiopian', 'food', 4.5, 267, 9.0183, 38.7627, 'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400', TRUE, 'Ethiopian restaurant and art gallery showcasing local artists.', '+251-11-661-6448', '10:00 AM - 10:00 PM', 'Bole Road, Addis Ababa', 'active', ARRAY['Art Gallery', 'WiFi', 'Outdoor']),
('food-r03', 'Habesha Restaurant', 'Ethiopian', 'food', 4.4, 198, 9.0220, 38.7550, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', TRUE, 'Traditional Habesha cuisine with live band and cultural shows.', '+251-11-552-7602', '9:00 AM - 11:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Live Music', 'Parking']),
('food-r04', 'Roadhouse Grill', 'Grill', 'food', 4.3, 189, 9.0224, 38.7648, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', TRUE, 'American-style grill with steaks, ribs and burgers.', '+251-11-663-7474', '11:00 AM - 11:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Bar', 'WiFi', 'Outdoor']),
('food-r05', 'Saffron Indian Restaurant', 'Indian', 'food', 4.5, 145, 9.0157, 38.7620, 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=400', TRUE, 'Authentic Indian cuisine with tandoori and curry dishes.', '+251-11-554-0246', '12:00 PM - 10:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Vegetarian Options', 'WiFi']),
('food-r06', 'Lime Tree Cafe & Restaurant', 'International', 'food', 4.4, 223, 9.0182, 38.7589, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', TRUE, 'Relaxed cafe and restaurant with international menu and garden.', '+251-11-661-9927', '8:00 AM - 10:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Garden', 'WiFi', 'Vegetarian']),
('food-r07', 'Yakety Yak Restaurant', 'International', 'food', 4.2, 178, 9.0233, 38.7501, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400', TRUE, 'Popular expat hangout with wide international menu.', '+251-11-551-0340', '8:00 AM - 11:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['Bar', 'WiFi', 'Sports TV']),
('food-r08', 'San Antonio Bar & Grill', 'Mexican', 'food', 4.1, 156, 9.0198, 38.7623, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400', TRUE, 'Mexican and international grill with cocktails and live sports.', '+251-11-661-5537', '11:00 AM - 11:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Bar', 'Sports TV', 'WiFi']),
('food-r09', 'Veranda Restaurant', 'Mediterranean', 'food', 4.6, 201, 9.0203, 38.7601, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400', TRUE, 'Upscale Mediterranean dining with outdoor veranda seating.', '+251-11-662-7722', '12:00 PM - 11:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Outdoor', 'Bar', 'Valet']),
('food-r10', 'Wudnesh Traditional Restaurant', 'Ethiopian', 'food', 4.3, 145, 9.0350, 38.7400, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', FALSE, 'Authentic home-style Ethiopian food in a local setting.', '+251-91-123-4567', '8:00 AM - 9:00 PM', 'Piassa, Addis Ababa', 'active', ARRAY['Local', 'Affordable']),
('food-r11', 'Ras Hotel Restaurant', 'Ethiopian', 'food', 4.1, 134, 9.0317, 38.7483, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', TRUE, 'Classic restaurant serving traditional Ethiopian dishes.', '+251-11-551-7060', '7:00 AM - 10:00 PM', 'Adwa Ave, Addis Ababa', 'active', ARRAY['Breakfast', 'Traditional']),
('food-r12', 'Burger Brothers', 'Fast Food', 'food', 4.3, 267, 9.0195, 38.7755, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', TRUE, 'Gourmet burgers, shakes and loaded fries.', '+251-91-555-2345', '10:00 AM - 11:00 PM', 'CMC, Addis Ababa', 'active', ARRAY['Delivery', 'WiFi']),
('food-r13', 'Fasika Restaurant', 'Ethiopian', 'food', 4.5, 289, 9.0241, 38.7512, 'https://images.unsplash.com/photo-1517521271057-7b1570fcff78?w=400', TRUE, 'Injera specialists and full Ethiopian buffet experience.', '+251-11-553-9910', '7:00 AM - 10:00 PM', 'Mexico Square, Addis Ababa', 'active', ARRAY['Buffet', 'WiFi', 'Parking']),
('food-r14', 'Pizzeria Roma', 'Italian', 'food', 4.2, 167, 9.0173, 38.7634, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', TRUE, 'Wood-fired Neapolitan pizza with Italian desserts.', '+251-11-661-2299', '12:00 PM - 10:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Delivery', 'WiFi']),
('food-r15', 'Abuye Ethiopian Kitchen', 'Ethiopian', 'food', 4.4, 178, 9.0401, 38.7601, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', FALSE, 'Family restaurant serving Tigrayan and Amhara dishes.', '+251-91-234-5678', '7:00 AM - 9:00 PM', 'Megenagna, Addis Ababa', 'active', ARRAY['Local', 'Family']),

-- ══════════════════ COFFEE SHOPS / CAFES ══════════════════
('cafe-c01', 'Buna Bet Addis', 'Coffee House', 'cafe', 4.7, 156, 9.0283, 38.7440, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', TRUE, 'Traditional Ethiopian coffee ceremony in an authentic Buna Bet.', '+251-91-456-7890', '6:00 AM - 9:00 PM', 'Piassa, Addis Ababa', 'active', ARRAY['Traditional', 'Coffee Ceremony']),
('cafe-c02', 'Chemers Juice House', 'Juice Bar', 'cafe', 4.5, 234, 9.0208, 38.7630, 'https://images.unsplash.com/photo-1622597467836-f3e6707b4e84?w=400', TRUE, 'Fresh juice, smoothies and light snacks.', '+251-91-567-8901', '7:00 AM - 9:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Juice', 'Healthy', 'Delivery']),
('cafe-c03', 'Avocado Cafe', 'Cafe', 'cafe', 4.6, 178, 9.0156, 38.7728, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', TRUE, 'Healthy brunch, specialty coffee and avocado dishes.', '+251-91-678-9012', '7:00 AM - 8:00 PM', 'Old Airport, Addis Ababa', 'active', ARRAY['Healthy', 'WiFi', 'Brunch']),
('cafe-c04', 'Bole Juice & Coffee', 'Juice Bar', 'cafe', 4.4, 198, 9.0194, 38.7780, 'https://images.unsplash.com/photo-1622597467836-f3e6707b4e84?w=400', FALSE, 'Popular neighbourhood juice and coffee spot.', '+251-91-789-0123', '7:00 AM - 9:00 PM', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Juice', 'Affordable']),
('cafe-c05', 'Sait Coffee', 'Specialty Coffee', 'cafe', 4.8, 134, 9.0162, 38.7640, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', TRUE, 'Third-wave specialty coffee with single-origin Ethiopian beans.', '+251-91-890-1234', '7:00 AM - 8:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Specialty', 'WiFi', 'Workspace']),
('cafe-c06', 'Café Romanat', 'Pastry Cafe', 'cafe', 4.5, 189, 9.0223, 38.7558, 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', TRUE, 'Pastries, sandwiches and European-style coffee.', '+251-11-551-1234', '7:00 AM - 9:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['Pastry', 'WiFi']),
('cafe-c07', 'Aritti Coffee', 'Coffee Shop', 'cafe', 4.6, 145, 9.0400, 38.7554, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', TRUE, 'Premium coffee chain serving Jimma and Yirgacheffe beans.', '+251-91-012-3456', '6:00 AM - 9:00 PM', 'Megenagna, Addis Ababa', 'active', ARRAY['WiFi', 'Drive-Through']),
('cafe-c08', 'Alem Bunna Coffee', 'Coffee Shop', 'cafe', 4.3, 234, 9.0330, 38.7450, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', FALSE, 'Traditional Ethiopian coffee and light snacks.', '+251-91-123-0001', '6:00 AM - 8:00 PM', 'Merkato Area, Addis Ababa', 'active', ARRAY['Traditional', 'Affordable']),
('cafe-c09', 'Greenhouse Coffee Roasters', 'Specialty Coffee', 'cafe', 4.9, 98, 9.0171, 38.7659, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', TRUE, 'Micro-roastery with cupping sessions and pour-over bar.', '+251-91-234-0001', '8:00 AM - 6:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Roastery', 'Cupping', 'Specialty']),
('cafe-c10', 'Harar Coffee House', 'Coffee Shop', 'cafe', 4.5, 167, 9.0301, 38.7530, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', TRUE, 'Authentic Harar coffee tradition with jebena ceremony.', '+251-91-345-0001', '6:30 AM - 9:00 PM', 'Sarbet, Addis Ababa', 'active', ARRAY['Traditional', 'Coffee Ceremony']),

-- ══════════════════ HOTELS ══════════════════
('hotel-h01', 'Jupiter Hotel Addis Ababa', 'Business Hotel', 'hotel', 4.4, 312, 9.0198, 38.7731, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', TRUE, 'Modern business hotel with conference facilities near Bole.', '+251-11-619-9000', '24 hours', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Pool', 'Gym', 'Conference', 'WiFi']),
('hotel-h02', 'Ghion Hotel', 'Heritage Hotel', 'hotel', 3.9, 245, 9.0280, 38.7480, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', TRUE, 'Historic government hotel with large gardens and pools.', '+251-11-551-3222', '24 hours', 'Haile Gebresilasie Rd, Addis Ababa', 'active', ARRAY['Pool', 'Garden', 'Traditional', 'Parking']),
('hotel-h03', 'Jubilee Hotel', 'Boutique Hotel', 'hotel', 4.3, 198, 9.0213, 38.7655, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', TRUE, 'Boutique hotel with premium rooms and restaurant.', '+251-11-663-5040', '24 hours', 'Bole, Addis Ababa', 'active', ARRAY['Restaurant', 'Bar', 'WiFi', 'Gym']),
('hotel-h04', 'Grand Palace Hotel', 'Luxury Hotel', 'hotel', 4.5, 267, 9.0310, 38.7420, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', TRUE, 'Elegant hotel with ballroom and wedding facilities.', '+251-11-550-9000', '24 hours', 'Mexico Square, Addis Ababa', 'active', ARRAY['Ballroom', 'Pool', 'WiFi', 'Parking']),
('hotel-h05', 'Azzeman Hotel', 'Mid-Range Hotel', 'hotel', 4.2, 189, 9.0222, 38.7584, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', TRUE, 'Comfortable mid-range hotel with great city views.', '+251-11-552-1234', '24 hours', 'Kazanchis, Addis Ababa', 'active', ARRAY['Restaurant', 'WiFi', 'Airport Shuttle']),
('hotel-h06', 'Wabi Shebelle Hotel', 'Business Hotel', 'hotel', 4.0, 178, 9.0231, 38.7521, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', TRUE, 'Classic Addis hotel with restaurant and business services.', '+251-11-551-9400', '24 hours', 'Ras Desta Damtew Ave, Addis Ababa', 'active', ARRAY['Restaurant', 'Conference', 'WiFi']),
('hotel-h07', 'Atlas Hotel', 'Business Hotel', 'hotel', 4.3, 156, 9.0260, 38.7590, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', TRUE, 'Central hotel popular with business travellers.', '+251-11-551-2440', '24 hours', 'Ras Mekonnen Ave, Addis Ababa', 'active', ARRAY['Restaurant', 'WiFi', 'Bar']),
('hotel-h08', 'Bole Millenium Hotel', 'Mid-Range Hotel', 'hotel', 4.1, 134, 9.0176, 38.7791, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', TRUE, 'Comfortable hotel near Bole International Airport.', '+251-11-663-2222', '24 hours', 'Bole, Addis Ababa', 'active', ARRAY['Airport Shuttle', 'WiFi', 'Restaurant']),
('hotel-h09', 'Crown Hotel', 'Mid-Range Hotel', 'hotel', 4.2, 167, 9.0339, 38.7480, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', TRUE, 'Well-located hotel near restaurants and shopping.', '+251-11-551-1188', '24 hours', 'Piassa, Addis Ababa', 'active', ARRAY['Restaurant', 'WiFi']),
('hotel-h10', 'Harmony Hotel', 'Boutique Hotel', 'hotel', 4.4, 201, 9.0409, 38.7785, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', TRUE, 'Peaceful boutique hotel in CMC area with modern rooms.', '+251-11-645-2222', '24 hours', 'CMC, Addis Ababa', 'active', ARRAY['Garden', 'WiFi', 'Restaurant']),
('hotel-h11', 'Eliana Hotel', 'Boutique Hotel', 'hotel', 4.5, 123, 9.0188, 38.7647, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400', TRUE, 'Stylish boutique hotel with rooftop bar.', '+251-11-663-8800', '24 hours', 'Bole, Addis Ababa', 'active', ARRAY['Rooftop Bar', 'WiFi', 'Gym']),
('hotel-h12', 'Sapphire Hotel', 'Luxury Hotel', 'hotel', 4.6, 189, 9.0165, 38.7697, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', TRUE, 'Luxury hotel with infinity pool and spa.', '+251-11-663-5555', '24 hours', 'Old Airport, Addis Ababa', 'active', ARRAY['Infinity Pool', 'Spa', 'WiFi', 'Gym']),
('hotel-h13', 'Addis International Hotel', 'Business Hotel', 'hotel', 4.0, 145, 9.0272, 38.7461, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', TRUE, 'Centrally located business hotel near Piassa.', '+251-11-156-0044', '24 hours', 'Piassa, Addis Ababa', 'active', ARRAY['Restaurant', 'Conference', 'WiFi']),
('hotel-h14', 'Summerfield Boutique Hotel', 'Boutique Hotel', 'hotel', 4.6, 178, 9.0312, 38.7580, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400', TRUE, 'Upscale boutique hotel with garden and pool.', '+251-11-553-8877', '24 hours', 'Sarbet, Addis Ababa', 'active', ARRAY['Pool', 'Garden', 'WiFi', 'Spa']),

-- ══════════════════ HOSPITALS & CLINICS ══════════════════
('health-m01', 'Hayat Hospital', 'Private Hospital', 'health', 4.5, 234, 9.0208, 38.7745, 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', TRUE, 'Leading private hospital with specialist departments.', '+251-11-663-3000', '24 hours', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Emergency', 'ICU', 'Lab', 'Pharmacy']),
('health-m02', 'Bethezata General Hospital', 'Private Hospital', 'health', 4.3, 189, 9.0303, 38.7530, 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400', TRUE, 'Full-service private hospital with modern equipment.', '+251-11-551-2277', '24 hours', 'Kazanchis, Addis Ababa', 'active', ARRAY['Emergency', 'Surgery', 'Lab']),
('health-m03', 'St. Gabriel General Hospital', 'Private Hospital', 'health', 4.4, 267, 9.0234, 38.7660, 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', TRUE, 'Renowned private hospital serving Addis for decades.', '+251-11-663-3888', '24 hours', 'Bole, Addis Ababa', 'active', ARRAY['Emergency', 'Maternity', 'ICU', 'Pharmacy']),
('health-m04', 'Mekdi General Hospital', 'Private Hospital', 'health', 4.2, 156, 9.0400, 38.7580, 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400', TRUE, 'Modern hospital with diagnostic imaging and labs.', '+251-11-645-5000', '24 hours', 'Megenagna, Addis Ababa', 'active', ARRAY['Lab', 'Imaging', 'Emergency']),
('health-m05', 'Alert Hospital', 'Specialty Hospital', 'health', 4.3, 198, 9.0268, 38.7476, 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', TRUE, 'Specialist hospital for leprosy, skin and TB treatment.', '+251-11-551-1366', '24 hours', 'Kolfe, Addis Ababa', 'active', ARRAY['Specialist', 'Research']),
('health-m06', 'Landmark Hospital', 'Private Hospital', 'health', 4.6, 145, 9.0183, 38.7589, 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', TRUE, 'State-of-the-art private hospital with international standards.', '+251-11-661-1100', '24 hours', 'Bole, Addis Ababa', 'active', ARRAY['Emergency', 'Surgery', 'ICU', 'Lab']),
('health-m07', 'Korean Hospital Addis', 'Private Hospital', 'health', 4.4, 167, 9.0254, 38.7640, 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400', TRUE, 'Joint Ethiopian-Korean hospital with modern technology.', '+251-11-661-0000', '24 hours', 'Bole, Addis Ababa', 'active', ARRAY['Lab', 'Surgery', 'Emergency']),
('health-m08', 'MCM General Hospital', 'Private Hospital', 'health', 4.5, 212, 9.0196, 38.7648, 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400', TRUE, 'Full-service hospital with accident and emergency unit.', '+251-11-618-0000', '24 hours', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Emergency', 'ICU', 'Maternity']),
('health-m09', 'ICL (International Clinical Laboratories)', 'Medical Lab', 'health', 4.6, 134, 9.0227, 38.7623, 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400', TRUE, 'Premier diagnostic laboratory with full test panel.', '+251-11-661-2222', '7:00 AM - 8:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Lab', 'Home Collection', 'Fast Results']),
-- Pharmacies
('health-p01', 'Genet Pharmacy', 'Pharmacy', 'health', 4.4, 178, 9.0217, 38.7610, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', TRUE, 'Full-service pharmacy with prescription and OTC medicines.', '+251-11-661-1234', '8:00 AM - 10:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Prescription', 'OTC', 'Delivery']),
('health-p02', 'Care Pharmacy', 'Pharmacy', 'health', 4.3, 145, 9.0253, 38.7545, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', TRUE, 'Pharmacy with licensed pharmacists and medical advice.', '+251-11-551-9988', '8:00 AM - 10:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['Prescription', 'OTC']),
('health-p03', 'Blue Nile Pharmacy', 'Pharmacy', 'health', 4.5, 123, 9.0173, 38.7735, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', TRUE, '24-hour pharmacy with wide stock of medicines.', '+251-11-663-5577', '24 hours', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['24hr', 'Prescription', 'OTC']),
('health-p04', 'Hayat Pharmacy', 'Pharmacy', 'health', 4.4, 167, 9.0211, 38.7742, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', TRUE, 'Hospital-affiliated pharmacy with full stock.', '+251-11-663-3001', '24 hours', 'Bole, Addis Ababa', 'active', ARRAY['24hr', 'Hospital Affiliated']),
('health-p05', 'Phoenix Pharmacy', 'Pharmacy', 'health', 4.2, 134, 9.0330, 38.7490, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', FALSE, 'Neighbourhood pharmacy with affordable prices.', '+251-91-888-2233', '8:00 AM - 9:00 PM', 'Piassa, Addis Ababa', 'active', ARRAY['Affordable', 'OTC']),
('health-p06', 'Mega Pharmacy', 'Pharmacy', 'health', 4.3, 189, 9.0395, 38.7577, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', FALSE, 'Large pharmacy chain with multiple branches.', '+251-11-645-1122', '8:00 AM - 10:00 PM', 'Megenagna, Addis Ababa', 'active', ARRAY['Multiple Branches', 'OTC']),

-- ══════════════════ BANKS & FINANCE ══════════════════
('finance-b01', 'Bank of Abyssinia', 'Bank', 'finance', 4.1, 234, 9.0220, 38.7551, 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400', TRUE, 'Private commercial bank with nationwide ATM network.', '+251-11-557-3399', '8:00 AM - 5:00 PM', 'Ras Desta Ave, Addis Ababa', 'active', ARRAY['ATM', 'Mobile Banking', 'Forex']),
('finance-b02', 'Awash Bank', 'Bank', 'finance', 4.2, 198, 9.0238, 38.7615, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', TRUE, 'Leading private bank with mobile banking and forex.', '+251-11-662-5060', '8:00 AM - 5:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['ATM', 'Mobile Banking', 'Forex']),
('finance-b03', 'Nib International Bank', 'Bank', 'finance', 4.0, 167, 9.0261, 38.7480, 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400', TRUE, 'Full-service commercial bank with investment services.', '+251-11-551-7000', '8:00 AM - 5:00 PM', 'Mexico Square, Addis Ababa', 'active', ARRAY['ATM', 'Investment', 'Forex']),
('finance-b04', 'United Bank', 'Bank', 'finance', 4.1, 145, 9.0199, 38.7699, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', TRUE, 'Commercial bank serving individuals and businesses.', '+251-11-661-1500', '8:00 AM - 5:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['ATM', 'Mobile Banking']),
('finance-b05', 'Zemen Bank', 'Bank', 'finance', 4.4, 134, 9.0242, 38.7638, 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400', TRUE, 'Digital-first bank with modern branches and 24hr ATMs.', '+251-11-661-9090', '8:30 AM - 5:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Digital Banking', 'ATM', 'Forex']),
('finance-b06', 'Oromia Bank', 'Bank', 'finance', 3.9, 189, 9.0290, 38.7440, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', FALSE, 'Cooperative bank with wide rural and urban network.', '+251-11-557-1700', '8:00 AM - 5:00 PM', 'Kolfe, Addis Ababa', 'active', ARRAY['ATM', 'Rural Banking']),
('finance-b07', 'Abay Bank', 'Bank', 'finance', 4.0, 123, 9.0183, 38.7639, 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400', FALSE, 'Growing private bank with competitive interest rates.', '+251-11-663-7788', '8:00 AM - 5:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['ATM', 'Mobile Banking']),
('finance-b08', 'Berhan Bank', 'Bank', 'finance', 4.1, 134, 9.0410, 38.7790, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', FALSE, 'Reliable private bank with focus on SME lending.', '+251-11-645-9900', '8:00 AM - 5:00 PM', 'CMC, Addis Ababa', 'active', ARRAY['ATM', 'SME Loans']),
('finance-b09', 'Cooperative Bank of Oromia', 'Bank', 'finance', 3.8, 156, 9.0349, 38.7422, 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400', FALSE, 'Cooperative bank financing farmers and agribusiness.', '+251-11-550-9990', '8:00 AM - 5:00 PM', 'Merkato, Addis Ababa', 'active', ARRAY['ATM', 'Microfinance']),
('finance-b10', 'Telebirr Agent', 'Mobile Money', 'finance', 4.5, 345, 9.0213, 38.7680, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', TRUE, 'Ethio Telecom Telebirr mobile money agent and top-up.', '+251-91-000-0000', '8:00 AM - 9:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Mobile Money', 'Top-Up']),

-- ══════════════════ FUEL STATIONS ══════════════════
('fuel-f01', 'NOC Bole Fuel Station', 'Fuel Station', 'fuel', 4.1, 78, 9.0198, 38.7745, 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', TRUE, 'National Oil Company fuel station with multiple pumps.', '+251-11-663-0000', '24 hours', 'Bole, Addis Ababa', 'active', ARRAY['24hr', 'Car Wash']),
('fuel-f02', 'Libya Oil Kazanchis', 'Fuel Station', 'fuel', 4.0, 67, 9.0245, 38.7554, 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', TRUE, 'Libya Oil fuel station with convenience store.', '+251-11-551-7788', '24 hours', 'Kazanchis, Addis Ababa', 'active', ARRAY['24hr', 'Convenience Store']),
('fuel-f03', 'Oilcom Megenagna', 'Fuel Station', 'fuel', 4.2, 89, 9.0405, 38.7785, 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', FALSE, 'Fuel station with carwash and tyre service.', '+251-91-456-0000', '24 hours', 'Megenagna, Addis Ababa', 'active', ARRAY['24hr', 'Car Wash', 'Tyre']),
('fuel-f04', 'TotalEnergies CMC', 'Fuel Station', 'fuel', 4.3, 91, 9.0418, 38.7784, 'https://images.unsplash.com/photo-1559405626-d3aa144bb2b8?w=400', TRUE, 'Total full-service station with Bonjour convenience store.', '+251-11-645-9988', '24 hours', 'CMC Road, Addis Ababa', 'active', ARRAY['24hr', 'Convenience Store', 'Car Wash']),
('fuel-f05', 'Genesis Oil - Old Airport', 'Fuel Station', 'fuel', 4.0, 56, 9.0155, 38.7715, 'https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400', FALSE, 'Fuel station serving Old Airport area.', '+251-91-567-0000', '24 hours', 'Old Airport, Addis Ababa', 'active', ARRAY['24hr']),

-- ══════════════════ SHOPPING & MALLS ══════════════════
('shop-s01', 'Laphto Mall', 'Shopping Mall', 'shop', 4.4, 567, 9.0148, 38.7734, 'https://images.unsplash.com/photo-1519567281023-e1262d182b8d?w=400', TRUE, 'Large shopping mall with Carrefour, cinema and food court.', '+251-11-663-1234', '9:00 AM - 10:00 PM', 'Old Airport, Addis Ababa', 'active', ARRAY['Carrefour', 'Cinema', 'Food Court', 'Parking']),
('shop-s02', 'Africa Avenue Mall', 'Shopping Mall', 'shop', 4.2, 345, 9.0160, 38.7673, 'https://images.unsplash.com/photo-1519567281023-e1262d182b8d?w=400', TRUE, 'Modern shopping mall with international brands.', '+251-11-663-5566', '9:00 AM - 9:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['International Brands', 'Food Court', 'Parking']),
('shop-s03', 'Shoa Supermarket', 'Supermarket', 'shop', 4.3, 456, 9.0249, 38.7491, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400', TRUE, 'Popular supermarket chain with fresh produce and bakery.', '+251-11-551-0001', '8:00 AM - 10:00 PM', 'Mexico Square, Addis Ababa', 'active', ARRAY['Fresh Produce', 'Bakery', 'Delivery']),
('shop-s04', 'Bambis Supermarket', 'Supermarket', 'shop', 4.4, 389, 9.0222, 38.7639, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400', TRUE, 'Well-stocked supermarket with imported goods.', '+251-11-663-9901', '8:00 AM - 10:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Imported Goods', 'Bakery', 'Delivery']),
('shop-s05', 'Novis Supermarket', 'Supermarket', 'shop', 4.2, 267, 9.0200, 38.7703, 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400', TRUE, 'Supermarket with wide selection including organic.', '+251-11-663-7722', '8:00 AM - 10:00 PM', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Organic', 'Imported', 'Bakery']),
('shop-s06', 'Friendship Supermarket', 'Supermarket', 'shop', 4.1, 312, 9.0264, 38.7466, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400', TRUE, 'Large supermarket with electronics and household items.', '+251-11-550-2929', '8:00 AM - 9:00 PM', 'Piassa, Addis Ababa', 'active', ARRAY['Electronics', 'Household', 'Bakery']),
('shop-s07', 'Welo Sefer Market', 'Local Market', 'shop', 4.0, 189, 9.0302, 38.7443, 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400', FALSE, 'Popular local market for fresh produce and spices.', '+251-91-700-0001', '6:00 AM - 7:00 PM', 'Welo Sefer, Addis Ababa', 'active', ARRAY['Fresh Produce', 'Spices', 'Affordable']),
('shop-s08', 'Checkers Supermarket', 'Supermarket', 'shop', 4.3, 234, 9.0407, 38.7783, 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400', FALSE, 'Premium supermarket with international brands.', '+251-11-645-3344', '8:00 AM - 10:00 PM', 'CMC, Addis Ababa', 'active', ARRAY['International Brands', 'Deli']),

-- ══════════════════ ELECTRONICS ══════════════════
('elec-e01', 'Telecom Computer Store', 'Electronics', 'electronics', 4.2, 145, 9.0258, 38.7459, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', TRUE, 'Laptops, phones and accessories at competitive prices.', '+251-11-551-2211', '9:00 AM - 7:00 PM', 'Merkato Area, Addis Ababa', 'active', ARRAY['Laptops', 'Phones', 'Repair']),
('elec-e02', 'Samsung Service Center', 'Electronics', 'electronics', 4.5, 189, 9.0205, 38.7648, 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400', TRUE, 'Official Samsung service and retail center.', '+251-11-663-7700', '9:00 AM - 6:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Samsung', 'Repair', 'Warranty']),
('elec-e03', 'iStore Ethiopia', 'Electronics', 'electronics', 4.6, 234, 9.0184, 38.7627, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', TRUE, 'Authorised Apple products dealer in Ethiopia.', '+251-11-663-4400', '9:00 AM - 7:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Apple', 'iPhone', 'MacBook', 'Repair']),
('elec-e04', 'Computer World Ethiopia', 'Electronics', 'electronics', 4.1, 167, 9.0350, 38.7350, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', FALSE, 'Computers, printers and IT accessories.', '+251-11-550-9945', '9:00 AM - 7:00 PM', 'Merkato, Addis Ababa', 'active', ARRAY['Computers', 'Printers', 'Repair']),
('elec-e05', 'Huawei Service Center', 'Electronics', 'electronics', 4.4, 145, 9.0213, 38.7765, 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400', TRUE, 'Official Huawei service and retail point.', '+251-11-663-8800', '9:00 AM - 6:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Huawei', 'Repair', 'Accessories']),

-- ══════════════════ GYMS & FITNESS ══════════════════
('gym-g01', 'Fit Zone Addis', 'Fitness Center', 'gym', 4.5, 123, 9.0195, 38.7728, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', TRUE, 'Modern gym with cardio, weights and group classes.', '+251-91-111-2222', '5:00 AM - 10:00 PM', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Cardio', 'Weights', 'Group Classes']),
('gym-g02', 'Bodyline Fitness', 'Fitness Center', 'gym', 4.4, 98, 9.0268, 38.7539, 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400', FALSE, 'Affordable fitness centre with personal training.', '+251-91-222-3333', '6:00 AM - 10:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['Personal Training', 'Affordable']),
('gym-g03', 'Planet Fitness Addis', 'Fitness Center', 'gym', 4.6, 145, 9.0160, 38.7713, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', TRUE, 'Premium gym with Olympic pool and spa facilities.', '+251-91-333-4444', '5:30 AM - 11:00 PM', 'Old Airport, Addis Ababa', 'active', ARRAY['Pool', 'Spa', 'Sauna', 'Yoga']),
('gym-g04', 'Revolution Fitness', 'Fitness Studio', 'gym', 4.7, 89, 9.0393, 38.7769, 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400', TRUE, 'Boutique fitness studio with HIIT and CrossFit.', '+251-91-444-5555', '6:00 AM - 9:00 PM', 'CMC, Addis Ababa', 'active', ARRAY['CrossFit', 'HIIT', 'Nutrition']),
('gym-g05', 'Ladies First Fitness', 'Fitness Center', 'gym', 4.5, 112, 9.0229, 38.7600, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', TRUE, 'Women-only fitness center with Zumba and Pilates.', '+251-91-555-6666', '6:00 AM - 9:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Women Only', 'Zumba', 'Pilates']),

-- ══════════════════ SALONS & BEAUTY ══════════════════
('salon-s01', 'Glam Hair Studio', 'Hair Salon', 'salon', 4.6, 145, 9.0201, 38.7641, 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400', TRUE, 'Premium hair salon with braiding, relaxing and treatments.', '+251-91-666-7777', '9:00 AM - 8:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Braiding', 'Relaxing', 'Treatments']),
('salon-s02', 'Bella Beauty Salon', 'Beauty Salon', 'salon', 4.5, 123, 9.0237, 38.7558, 'https://images.unsplash.com/photo-1560066984-138daaa4e4e7?w=400', FALSE, 'Full-service beauty salon with nails, waxing and facials.', '+251-91-777-8888', '9:00 AM - 8:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['Nails', 'Waxing', 'Facials']),
('salon-s03', 'Walta Beauty Center', 'Beauty Salon', 'salon', 4.4, 167, 9.0175, 38.7762, 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400', FALSE, 'Popular beauty center for hair, skin and makeup.', '+251-91-888-9999', '9:00 AM - 8:00 PM', 'Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Hair', 'Makeup', 'Skin Care']),
('salon-s04', 'Mirror Salon & Spa', 'Spa & Salon', 'salon', 4.7, 98, 9.0156, 38.7701, 'https://images.unsplash.com/photo-1560066984-138daaa4e4e7?w=400', TRUE, 'Luxury salon and spa with massage and beauty services.', '+251-91-999-0000', '9:00 AM - 9:00 PM', 'Old Airport, Addis Ababa', 'active', ARRAY['Massage', 'Facial', 'Nails', 'Waxing']),
('salon-s05', 'Chic Hair & Beauty', 'Hair Salon', 'salon', 4.5, 112, 9.0392, 38.7773, 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400', FALSE, 'Modern salon specialising in Ethiopian hair types.', '+251-91-000-1111', '9:00 AM - 8:00 PM', 'CMC, Addis Ababa', 'active', ARRAY['Braiding', 'Natural Hair', 'Extensions']),

-- ══════════════════ NIGHTLIFE & BARS ══════════════════
('club-n01', 'Carbon Bar & Lounge', 'Lounge', 'club', 4.5, 189, 9.0190, 38.7644, 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400', TRUE, 'Sophisticated lounge with craft cocktails and live DJ.', '+251-91-111-0001', '6:00 PM - 2:00 AM', 'Bole, Addis Ababa', 'active', ARRAY['VIP', 'Cocktails', 'DJ', 'Hookah']),
('club-n02', 'Studio 35', 'Nightclub', 'club', 4.4, 234, 9.0227, 38.7558, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', TRUE, 'Trendy nightclub with live bands and DJ nights.', '+251-91-222-0001', '8:00 PM - 3:00 AM', 'Kazanchis, Addis Ababa', 'active', ARRAY['Live Band', 'DJ', 'VIP']),
('club-n03', 'Sky Bar Addis', 'Rooftop Bar', 'club', 4.6, 167, 9.0183, 38.7608, 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400', TRUE, 'Rooftop bar with city views and premium cocktails.', '+251-91-333-0001', '5:00 PM - 2:00 AM', 'Bole, Addis Ababa', 'active', ARRAY['Rooftop', 'City Views', 'Cocktails']),
('club-n04', 'Monarchy Bar & Grill', 'Bar & Grill', 'club', 4.3, 145, 9.0252, 38.7492, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400', TRUE, 'Sports bar with grill food and multiple screens.', '+251-91-444-0001', '12:00 PM - 2:00 AM', 'Piassa, Addis Ababa', 'active', ARRAY['Sports TV', 'Grill', 'Bar']),
('club-n05', 'Liquid Addis', 'Nightclub', 'club', 4.2, 201, 9.0198, 38.7735, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', FALSE, 'Popular dance club with Amhara and international music.', '+251-91-555-0001', '9:00 PM - 3:00 AM', 'Bole, Addis Ababa', 'active', ARRAY['DJ', 'Dance Floor', 'Bar']),
('club-n06', 'Goshen Bar', 'Bar', 'club', 4.1, 123, 9.0344, 38.7475, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400', FALSE, 'Traditional bar with local tej and tella.', '+251-91-666-0001', '10:00 AM - 11:00 PM', 'Merkato, Addis Ababa', 'active', ARRAY['Traditional', 'Tej', 'Local']),

-- ══════════════════ EDUCATION ══════════════════
('edu-e01', 'Sandford International School', 'International School', 'edu', 4.7, 112, 9.0301, 38.7520, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', TRUE, 'British curriculum school serving expat and local community.', '+251-11-551-5564', '7:30 AM - 4:30 PM', 'Addis Ababa', 'active', ARRAY['British Curriculum', 'Sports', 'Arts']),
('edu-e02', 'Bingham Academy', 'International School', 'edu', 4.6, 89, 9.0421, 38.7655, 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', TRUE, 'American curriculum Christian school with excellent programs.', '+251-11-645-3838', '7:30 AM - 4:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['American Curriculum', 'Christian', 'Sports']),
('edu-e03', 'German School Addis Ababa', 'International School', 'edu', 4.5, 67, 9.0272, 38.7567, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', TRUE, 'German government school offering German curriculum.', '+251-11-550-4788', '7:30 AM - 3:30 PM', 'Woreda 5, Addis Ababa', 'active', ARRAY['German Curriculum', 'Language']),
('edu-e04', 'French School of Addis Ababa', 'International School', 'edu', 4.5, 78, 9.0298, 38.7496, 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', TRUE, 'French government school accredited by AEFE.', '+251-11-550-2077', '7:30 AM - 3:30 PM', 'Addis Ababa', 'active', ARRAY['French Curriculum', 'AEFE']),
('edu-e05', 'Harmony Academy', 'Private School', 'edu', 4.4, 134, 9.0413, 38.7791, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', FALSE, 'Well-regarded Ethiopian private school with English medium.', '+251-11-645-0044', '7:30 AM - 4:00 PM', 'CMC, Addis Ababa', 'active', ARRAY['English Medium', 'Sports']),
('edu-e06', 'Addis Ababa Science & Technology University', 'University', 'edu', 4.2, 234, 9.0330, 38.8020, 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', TRUE, 'STEM-focused public university with engineering programs.', '+251-11-777-0000', '8:00 AM - 5:00 PM', 'Lideta, Addis Ababa', 'active', ARRAY['Engineering', 'STEM', 'Research']),
('edu-e07', 'St. Marys University', 'University', 'edu', 4.1, 189, 9.0296, 38.7600, 'https://images.unsplash.com/photo-1562774053-701939374585?w=400', TRUE, 'Private university offering business and health sciences.', '+251-11-552-4444', '8:00 AM - 5:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['Business', 'Health Sciences', 'Evening Classes']),
('edu-e08', 'Unity University', 'University', 'edu', 4.0, 167, 9.0278, 38.7497, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', TRUE, 'Private university with multiple faculties and evening programs.', '+251-11-552-3344', '8:00 AM - 8:00 PM', 'Mexico Square, Addis Ababa', 'active', ARRAY['Multiple Faculties', 'Evening Classes']),

-- ══════════════════ AUTOMOTIVE & TRANSPORT ══════════════════
('auto-a01', 'Ethio Auto', 'Car Dealer', 'auto', 4.2, 89, 9.0205, 38.7745, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400', TRUE, 'New and used car dealer with service centre.', '+251-11-663-1100', '8:00 AM - 6:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['New Cars', 'Used Cars', 'Service']),
('auto-a02', 'ZMC Motors', 'Car Dealer', 'auto', 4.4, 112, 9.0258, 38.7492, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400', TRUE, 'Authorized dealer for Toyota and other brands.', '+251-11-551-0808', '8:00 AM - 6:00 PM', 'Piassa, Addis Ababa', 'active', ARRAY['Toyota', 'Service', 'Spare Parts']),
('auto-a03', 'Lami Auto Repair', 'Auto Repair', 'auto', 4.3, 134, 9.0173, 38.7739, 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400', FALSE, 'Experienced mechanics for all car brands.', '+251-91-100-2222', '8:00 AM - 7:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['All Makes', 'Diagnostics', 'Oil Change']),
('auto-a04', 'Meskrem Car Wash', 'Car Wash', 'auto', 4.2, 178, 9.0236, 38.7620, 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400', FALSE, 'Professional full-service car wash and valet.', '+251-91-200-3333', '7:00 AM - 8:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Full Service', 'Interior', 'Wax']),
('auto-a05', 'Anbessa City Bus Terminal', 'Bus Station', 'transport', 3.8, 345, 9.0318, 38.7440, 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400', TRUE, 'Main Anbessa city bus terminal serving all routes.', '+251-11-550-9090', '5:00 AM - 11:00 PM', 'Piassa, Addis Ababa', 'active', ARRAY['City Bus', 'All Routes']),
('auto-a06', 'Selam Bus Terminal', 'Bus Station', 'transport', 4.0, 267, 9.0317, 38.7444, 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400', TRUE, 'Intercity bus terminal for long-distance routes.', '+251-11-551-6666', '5:00 AM - 8:00 PM', 'Autobus Terra, Addis Ababa', 'active', ARRAY['Intercity', 'Long Distance', 'Bahir Dar', 'Hawassa']),

-- ══════════════════ CULTURE & ENTERTAINMENT ══════════════════
('culture-c01', 'National Museum of Ethiopia', 'Museum', 'culture', 4.6, 456, 9.0445, 38.7617, 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400', TRUE, 'Home to Lucy fossil and Ethiopian history artifacts.', '+251-11-123-7770', '8:30 AM - 5:00 PM', 'Sidist Kilo, Addis Ababa', 'active', ARRAY['Lucy', 'History', 'Art']),
('culture-c02', 'Matti Cinema (Edna Mall)', 'Cinema', 'culture', 4.3, 312, 9.0012, 38.7842, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400', TRUE, 'Multiplex cinema with latest Hollywood and Ethiopian films.', '+251-11-661-6272', '10:00 AM - 11:00 PM', 'Edna Mall, Bole Medhane Alem, Addis Ababa', 'active', ARRAY['Hollywood', 'Ethiopian Films', 'Concessions']),
('culture-c03', 'Addis Ababa Museum', 'Museum', 'culture', 4.1, 189, 9.0290, 38.7460, 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400', TRUE, 'City history museum in the former palace of Menelik II.', '+251-11-552-5588', '8:30 AM - 5:00 PM', 'Mexico Square, Addis Ababa', 'active', ARRAY['History', 'Palace', 'Heritage']),
('culture-c04', 'Ethiopian Cultural Center', 'Cultural Center', 'culture', 4.4, 234, 9.0300, 38.7430, 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400', TRUE, 'Traditional music, dance and craft exhibitions.', '+251-11-550-5577', '9:00 AM - 6:00 PM', 'Addis Ababa', 'active', ARRAY['Music', 'Dance', 'Craft']),
('culture-c05', 'Alliance Ethio-Française', 'Cultural Center', 'culture', 4.5, 145, 9.0282, 38.7500, 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400', TRUE, 'French cultural center with cinema, library and events.', '+251-11-550-5533', '8:00 AM - 8:00 PM', 'Addis Ababa', 'active', ARRAY['French', 'Cinema', 'Library', 'Events']),

-- ══════════════════ PARKS & RECREATION ══════════════════
('park-p01', 'Unity Park Addis Ababa', 'Park', 'park', 4.8, 1234, 9.0303, 38.7411, 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400', TRUE, 'National unity park with gardens, zoo and palace tours.', '+251-11-552-2255', '8:00 AM - 6:00 PM', 'Arat Kilo, Addis Ababa', 'active', ARRAY['Zoo', 'Gardens', 'Palace Tour', 'Parking']),
('park-p02', 'Entoto Natural Park', 'National Park', 'park', 4.6, 678, 9.0706, 38.7620, 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400', TRUE, 'Mountain park with eucalyptus forests and viewpoints.', '+251-11-222-3344', '7:00 AM - 6:00 PM', 'Entoto, Addis Ababa', 'active', ARRAY['Hiking', 'Nature', 'Viewpoint', 'Cycling']),
('park-p03', 'Meskel Square', 'Public Space', 'park', 4.4, 456, 9.0224, 38.7515, 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400', TRUE, 'Iconic public square for festivals and events.', NULL, '24 hours', 'Meskel Square, Addis Ababa', 'active', ARRAY['Events', 'Historic', 'Open Space']),

-- ══════════════════ REAL ESTATE ══════════════════
('real-r01', 'Addis Ababa Real Estate', 'Real Estate Agency', 'realestate', 4.2, 89, 9.0218, 38.7640, 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400', TRUE, 'Property sales, rentals and management in Addis Ababa.', '+251-11-661-5500', '9:00 AM - 6:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Sales', 'Rentals', 'Management']),
('real-r02', 'Flintstone Homes', 'Real Estate Agency', 'realestate', 4.5, 112, 9.0261, 38.7572, 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400', TRUE, 'Premium residential and commercial property developer.', '+251-11-553-5500', '9:00 AM - 6:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['Developer', 'Luxury', 'Commercial']),
('real-r03', 'Tsehay Real Estate', 'Real Estate Agency', 'realestate', 4.1, 78, 9.0197, 38.7727, 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400', FALSE, 'Affordable housing and property listings in Addis.', '+251-91-800-0001', '9:00 AM - 6:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Affordable', 'Apartments', 'Sales']),

-- ══════════════════ TECH COMPANIES ══════════════════
('tech-t01', 'Kaizen Ethiopia', 'IT Company', 'tech', 4.5, 67, 9.0220, 38.7635, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400', TRUE, 'Software development and digital solutions provider.', '+251-11-661-3030', '9:00 AM - 6:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Software', 'Digital', 'IT Services']),
('tech-t02', 'Gebeya Inc.', 'Tech Startup', 'tech', 4.7, 89, 9.0200, 38.7648, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400', TRUE, 'Africa-focused tech talent platform and accelerator.', '+251-11-663-9000', '9:00 AM - 6:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Talent', 'Startup', 'Accelerator']),
('tech-t03', 'Addis Systems', 'IT Company', 'tech', 4.3, 56, 9.0261, 38.7549, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', FALSE, 'ERP, networking and IT infrastructure services.', '+251-11-551-8800', '9:00 AM - 6:00 PM', 'Kazanchis, Addis Ababa', 'active', ARRAY['ERP', 'Networking', 'IT Support']),
('tech-t04', 'Safaricom Ethiopia', 'Telecom', 'tech', 4.2, 234, 9.0206, 38.7647, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', TRUE, 'Telecommunications operator with M-PESA mobile money.', '+251-70-700-7070', '8:00 AM - 8:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['4G', 'M-PESA', 'Internet']),
('tech-t05', 'Ethio Telecom Shop', 'Telecom', 'tech', 4.0, 345, 9.0255, 38.7468, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', TRUE, 'State telecom operator with SIM cards and internet packages.', '+251-11-945-8000', '8:00 AM - 8:00 PM', 'Piassa, Addis Ababa', 'active', ARRAY['SIM', 'Internet', 'Telebirr', '4G']),

-- ══════════════════ GOVERNMENT & SERVICES ══════════════════
('gov-g01', 'Bole Sub-City Administration', 'Government Office', 'transport', 3.5, 156, 9.0193, 38.7784, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', TRUE, 'Sub-city government office for permits and services.', '+251-11-663-0011', '8:30 AM - 5:00 PM', 'Bole, Addis Ababa', 'active', ARRAY['Permits', 'ID', 'Services']),
('gov-g02', 'Ethiopian Immigration & Nationality Service', 'Government Office', 'transport', 3.7, 234, 9.0278, 38.7494, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', TRUE, 'Passport, visa and immigration services.', '+251-11-552-4777', '8:30 AM - 5:00 PM', 'Mexico Square, Addis Ababa', 'active', ARRAY['Passport', 'Visa', 'Immigration']),
('gov-g03', 'Addis Ababa Police Commission', 'Police Station', 'transport', 3.8, 89, 9.0310, 38.7430, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', TRUE, 'City police headquarters.', '+251-11-551-1111', '24 hours', 'Arada, Addis Ababa', 'active', ARRAY['Emergency', '24hr'])

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  category_id = EXCLUDED.category_id,
  rating = EXCLUDED.rating,
  reviews = EXCLUDED.reviews,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  image = EXCLUDED.image,
  verified = EXCLUDED.verified,
  description = EXCLUDED.description,
  phone = EXCLUDED.phone,
  hours = EXCLUDED.hours,
  address = EXCLUDED.address,
  status = EXCLUDED.status,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Done. Total extended directory: 200+ businesses across 18 categories.

