import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore, MOCK_REVIEWS_DATA, MOCK_GALLERY } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';
import CitySelector from '../components/CitySelector';

// ── Mock Data ────────────────────────────────────────────────────────────

const HERO_ACHIEVEMENTS = [
  { icon: '⭐', label: 'First Review', earned: true },
  { icon: '🏅', label: 'Top Reviewer', earned: true },
  { icon: '📸', label: 'Top Photographer', earned: false },
  { icon: '🌍', label: 'City Explorer', earned: true },
  { icon: '✅', label: 'Business Verifier', earned: false },
  { icon: '🤝', label: 'Community Hero', earned: false },
];

const MY_BUSINESSES = [
  { name: 'Nexyovi Coffee', status: 'Verified', icon: '☕' },
];

const SETTINGS_ITEMS = [
  { icon: 'person-outline', color: '#FAA330', label: 'Edit Profile', sub: 'Update your personal info' },
  { icon: 'notifications-outline', color: '#10B981', label: 'Notifications', sub: 'Push & email alerts' },
  { icon: 'shield-checkmark-outline', color: '#8B5CF6', label: 'Privacy', sub: 'Data & sharing preferences' },
  { icon: 'language-outline', color: '#3B82F6', label: 'Language', sub: 'English, Amharic, Oromo' },
  { icon: 'moon-outline', color: '#F59E0B', label: 'Dark Mode', sub: 'Dark theme active' },
  { icon: 'lock-closed-outline', color: '#EF4444', label: 'Security', sub: 'Password & 2FA' },
  { icon: 'help-circle-outline', color: '#FAA330', label: 'Help & Support', sub: 'FAQs & contact us' },
];

const SECURITY_ITEMS = [
  { icon: 'key-outline', color: '#8B5CF6', label: 'Change Password', sub: 'Update your password' },
  { icon: 'phone-portrait-outline', color: '#10B981', label: 'Phone Verification', sub: 'Connected: +251-91-234-5678' },
  { icon: 'mail-outline', color: '#3B82F6', label: 'Email Verification', sub: 'Verified: jonas@example.com' },
  { icon: 'finger-print-outline', color: '#F59E0B', label: 'Two-Factor Authentication', sub: 'Not enabled' },
  { icon: 'laptop-outline', color: '#EF4444', label: 'Active Sessions', sub: '2 active sessions' },
];  // ── Menu Row Component ───────────────────────────────────────────────────

  interface MenuRowProps {
    icon: string;
    iconColor: string;
    label: string;
    sublabel: string;
    right?: React.ReactNode;
    onPress?: () => void;
  }

  const MenuRow: React.FC<MenuRowProps> = ({ icon, iconColor, label, sublabel, right, onPress }) => {
    const { colors } = useTheme();

    return (
      <TouchableOpacity
        onPress={onPress || (() => Alert.alert(label, sublabel))}
        style={[styles.menuRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: iconColor + '18' }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.menuInfo}>
          <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.menuSublabel, { color: colors.textMuted }]}>{sublabel}</Text>
        </View>
        {right || <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      </TouchableOpacity>
    );
  };

// ── Main Screen ──────────────────────────────────────────────────────────

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, mode, toggleTheme } = useTheme();
  const { user, savedPlaces } = useAppStore();
  const selectedCity = useAppStore(s => s.selectedCity);
  const [notifications, setNotifications] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const myReviews = [...MOCK_REVIEWS_DATA].slice(0, 3);
  const myPhotos = MOCK_GALLERY.slice(0, 6);
  const level = user?.level || 1;
  const nextLevelPoints = (level + 1) * 500;
  const levelProgress = Math.min(((user?.points || 0) / nextLevelPoints) * 100, 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.bgGlow, { backgroundColor: colors.violetGlow }]} />

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
        {/* ──────────────── 1. PROFILE HEADER ──────────────── */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + SPACING.xl }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || 'Jonas'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSub }]}>
              {user?.email || 'jonas@example.com'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: colors.accentGlow }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.accent} />
                <Text style={[styles.badgeText, { color: colors.accent }]}>Verified</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.primaryGlow }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>Level {level}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.goldGlow }]}>
                <Text style={[styles.badgeText, { color: colors.gold }]}>📸 75</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ──────────────── 2. STATS ──────────────── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={[styles.statValue, { color: colors.gold }]}>{user?.points || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>Points</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{user?.reviewCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>Reviews</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statIcon}>📸</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{user?.photoCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>Photos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={[styles.statValue, { color: colors.violet }]}>{savedPlaces.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>Saved</Text>
          </View>
        </View>

        {/* ──────────────── 3. CONTRIBUTION SUMMARY ──────────────── */}
        <View style={[styles.contributionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.contributionHeader}>
            <Text style={[styles.contributionTitle, { color: colors.text }]}>📊 Contribution Summary</Text>
          </View>
          <View style={styles.contributionGrid}>
            <View style={styles.contributionItem}>
              <Text style={[styles.contributionVal, { color: colors.primary }]}>{user?.reviewCount || 0}</Text>
              <Text style={[styles.contributionLbl, { color: colors.textMuted }]}>Reviews</Text>
            </View>
            <View style={[styles.contributionDivider, { backgroundColor: colors.border }]} />
            <View style={styles.contributionItem}>
              <Text style={[styles.contributionVal, { color: colors.accent }]}>{user?.photoCount || 0}</Text>
              <Text style={[styles.contributionLbl, { color: colors.textMuted }]}>Photos</Text>
            </View>
            <View style={[styles.contributionDivider, { backgroundColor: colors.border }]} />
            <View style={styles.contributionItem}>
              <Text style={[styles.contributionVal, { color: colors.gold }]}>{savedPlaces.length}</Text>
              <Text style={[styles.contributionLbl, { color: colors.textMuted }]}>Saved</Text>
            </View>
            <View style={[styles.contributionDivider, { backgroundColor: colors.border }]} />
            <View style={styles.contributionItem}>
              <Text style={[styles.contributionVal, { color: colors.violet }]}>3</Text>
              <Text style={[styles.contributionLbl, { color: colors.textMuted }]}>Verified</Text>
            </View>
          </View>
          <View style={[styles.contributionFooter, { borderTopColor: colors.border }]}>
            <Ionicons name="eye" size={16} color={colors.textMuted} />
            <Text style={[styles.contributionFooterText, { color: colors.textSub }]}>
              Total Views Generated: <Text style={[styles.contributionBold, { color: colors.primary }]}>12,500</Text>
            </Text>
          </View>
        </View>

        {/* ──────────────── 4. BADGES ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🏅 Achievements</Text>              <TouchableOpacity onPress={() => Alert.alert('Achievements', 'Full achievement list coming in Phase 2.')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
            {HERO_ACHIEVEMENTS.map((ach, i) => (
              <View
                key={i}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: ach.earned ? colors.card : colors.surfaceAlt,
                    borderColor: ach.earned ? colors.border : 'transparent',
                    opacity: ach.earned ? 1 : 0.5,
                  },
                ]}
              >
                <Text style={styles.badgeCardIcon}>{ach.icon}</Text>
                <Text
                  style={[
                    styles.badgeCardLabel,
                    { color: ach.earned ? colors.text : colors.textMuted },
                  ]}
                >
                  {ach.label}
                </Text>
                {ach.earned && <Text style={[styles.badgeCardCheck, { color: colors.accent }]}>✓</Text>}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ──────────────── 5. LEADERBOARD POSITION ──────────────── */}
        <TouchableOpacity
          style={[styles.rankCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={styles.rankIcon}>🏆</Text>
          <View style={styles.rankInfo}>
            <Text style={[styles.rankTitle, { color: colors.text }]}>Your Ranking</Text>
            <View style={styles.rankRow}>
              <View style={[styles.rankPill, { backgroundColor: colors.goldGlow }]}>
                <Text style={[styles.rankPillText, { color: colors.gold }]}>#42 in Addis Ababa</Text>
              </View>
              <View style={[styles.rankPill, { backgroundColor: colors.violetGlow }]}>
                <Text style={[styles.rankPillText, { color: colors.violet }]}>#380 Nationwide</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* ──────────────── 6. REWARDS SUMMARY ──────────────── */}
        <TouchableOpacity
          style={[styles.rewardsCard, { backgroundColor: colors.goldGlow, borderColor: colors.gold + '44' }]}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/rewards' as any)}
        >
          <View style={styles.rewardsCardTop}>
            <Text style={styles.rewardsEmoji}>🎁</Text>
            <View style={styles.rewardsInfo}>
              <Text style={[styles.rewardsTitle, { color: colors.text }]}>Rewards Summary</Text>
              <Text style={[styles.rewardsBalance, { color: colors.gold }]}>
                {user?.points || 0} Points — ≈ {Math.round((user?.points || 0) / 10)} ETB
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
          <View style={styles.rewardsProgressRow}>
            <Text style={[styles.rewardsLevel, { color: colors.textSub }]}>Level {level} → {level + 1}</Text>
            <Text style={[styles.rewardsLevelPct, { color: colors.textMuted }]}>
              {Math.round(levelProgress)}%
            </Text>
          </View>
          <View style={[styles.rewardsTrack, { backgroundColor: colors.surfaceAlt }]}>
            <View
              style={[styles.rewardsFill, { backgroundColor: colors.gold, width: `${levelProgress}%` }]}
            />
          </View>
        </TouchableOpacity>

        {/* ──────────────── 7. MY REVIEWS ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⭐ My Reviews</Text>                <TouchableOpacity onPress={() => Alert.alert('My Reviews', 'Full review history coming soon.')}>
                  <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
                </TouchableOpacity>
              
          </View>
          {myReviews.map((review) => (
            <View
              key={review.id}
              style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.reviewTop}>
                <Text style={styles.reviewBizIcon}>🏪</Text>
                <View style={styles.reviewInfo}>
                  <Text style={[styles.reviewBizName, { color: colors.text }]}>
                    {review.id === 'rev1' ? 'Yod Abyssinia Restaurant' :
                     review.id === 'rev2' ? 'Yod Abyssinia Restaurant' :
                     review.id === 'rev6' ? 'Tomoca Coffee' : 'Coffee House'}
                  </Text>
                  <View style={styles.reviewStars}>
                    {Array.from({ length: review.rating }).map((_, si) => (
                      <Text key={si} style={styles.starIcon}>⭐</Text>
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewTime, { color: colors.textMuted }]}>{review.createdAt}</Text>
              </View>
              <Text style={[styles.reviewText, { color: colors.textSub }]} numberOfLines={2}>
                {review.text}
              </Text>
            </View>
          ))}
        </View>

        {/* ──────────────── 8. MY PHOTOS ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📸 My Photos</Text>
              <TouchableOpacity onPress={() => Alert.alert('My Photos', 'Full photo gallery coming soon.')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            
          </View>
          <View style={styles.photoGrid}>
            {myPhotos.map((photo, i) => (
              <TouchableOpacity key={i} style={styles.photoWrap} activeOpacity={0.8}>
                <Image source={{ uri: photo }} style={styles.photoThumb} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ──────────────── 9. SAVED COLLECTIONS ──────────────── */}
        <TouchableOpacity
          style={[styles.collectionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/saved' as any)}
        >
          <View style={[styles.collectionsIcon, { backgroundColor: colors.primaryGlow }]}>
            <Ionicons name="bookmark" size={20} color={colors.primary} />
          </View>
          <View style={styles.collectionsInfo}>
            <Text style={[styles.collectionsTitle, { color: colors.text }]}>Saved Collections</Text>
            <Text style={[styles.collectionsSub, { color: colors.textSub }]}>
              {savedPlaces.length} saved places · 6 collections
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* ──────────────── 10. ACTIVITY TIMELINE ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📜 Activity Timeline</Text>
              <TouchableOpacity onPress={() => Alert.alert('Activity Timeline', 'Full activity history coming in Phase 2.')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            
          </View>
          <View style={styles.activityTimeline}>
            {[
              { icon: '⭐', label: 'Reviewed Yod Abyssinia Restaurant', time: '2h ago', color: '#F59E0B' },
              { icon: '📸', label: 'Uploaded a photo at Tomoca Coffee', time: '5h ago', color: '#3B82F6' },
              { icon: '📍', label: 'Checked in at Kaldi\'s Coffee', time: '1d ago', color: '#10B981' },
              { icon: '❤️', label: 'Saved Kuriftu Resort', time: '2d ago', color: '#EF4444' },
              { icon: '🏢', label: 'Verified YeGesha Specialty Cafe', time: '3d ago', color: '#8B5CF6' },
            ].map((act, i) => (
              <View key={i} style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: act.color }]} />
                <View style={[styles.activityContent, { borderLeftColor: colors.border }]}>
                  <View style={[styles.activityIconWrap, { backgroundColor: act.color + '22' }]}>
                    <Text style={styles.activityEmoji}>{act.icon}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityLabel, { color: colors.text }]}>{act.label}</Text>
                    <Text style={[styles.activityTime, { color: colors.textMuted }]}>{act.time}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ──────────────── 11. BUSINESS SECTION ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🏢 My Businesses</Text>
          </View>
          {MY_BUSINESSES.map((biz, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.businessCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={styles.businessIcon}>{biz.icon}</Text>
              <View style={styles.businessInfo}>
                <Text style={[styles.businessName, { color: colors.text }]}>{biz.name}</Text>
                <View style={styles.businessStatusRow}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.accent} />
                  <Text style={[styles.businessStatus, { color: colors.accent }]}>{biz.status}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.manageBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => Alert.alert('Business Dashboard', 'Full business management coming soon.')}
              >
                <Text style={styles.manageBtnText}>Dashboard</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.addBusinessBtn, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.addBusinessText, { color: colors.primary }]}>Add Business</Text>
          </TouchableOpacity>
        </View>

        {/* ──────────────── 12. SECURITY ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🔒 Security</Text>
          </View>
          {SECURITY_ITEMS.map((item, i) => (
            <MenuRow
              key={i}
              icon={item.icon}
              iconColor={item.color}
              label={item.label}
              sublabel={item.sub}
            />
          ))}
        </View>

        {/* ──────────────── 13. SETTINGS ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⚙ Settings</Text>
          </View>

          {/* City Selector Row */}
          <MenuRow
            icon="location-outline"
            iconColor="#10B981"
            label="Current City"
            sublabel={selectedCity || 'Addis Ababa'}
            onPress={() => setShowCitySelector(true)}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
          {SETTINGS_ITEMS.map((item, i) => {
            if (item.label === 'Notifications') {
              return (
                <View
                  key={i}
                  style={[styles.menuRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.menuSublabel, { color: colors.textMuted }]}>{item.sub}</Text>
                  </View>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: colors.border, true: item.color }}
                    thumbColor={colors.text}
                    ios_backgroundColor={colors.border}
                  />
                </View>
              );
            }
            if (item.label === 'Dark Mode') {
              return (
                <View
                  key={i}
                  style={[styles.menuRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={20} color={item.color} />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.menuSublabel, { color: colors.textMuted }]}>
                      {mode === 'dark' ? 'Dark theme active' : 'Light theme active'}
                    </Text>
                  </View>
                  <Switch
                    value={mode === 'dark'}
                    onValueChange={toggleTheme}
                    trackColor={{ false: colors.border, true: item.color }}
                    thumbColor={colors.text}
                    ios_backgroundColor={colors.border}
                  />
                </View>
              );
            }
            return (
              <MenuRow
                key={i}
                icon={item.icon}
                iconColor={item.color}
                label={item.label}
                sublabel={item.sub}
              />
            );
          })}
        </View>

        {/* ──────────────── FUTURE CREATOR SECTION ──────────────── */}
        <View style={[styles.creatorCard, { backgroundColor: colors.violetGlow, borderColor: colors.violet + '44' }]}>
          <View style={styles.creatorHeader}>
            <Text style={styles.creatorEmoji}>✨</Text>
            <Text style={[styles.creatorTitle, { color: colors.text }]}>Creator Mode (Phase 2)</Text>
          </View>
          <Text style={[styles.creatorSub, { color: colors.textSub }]}>
            Upload videos and grow your following. Track your content analytics, earnings, and audience.
          </Text>
          <View style={styles.creatorPreview}>
            {[
              { value: '0', label: 'Followers' },
              { value: '0', label: 'Following' },
              { value: '0', label: 'Views' },
              { value: '0', label: 'Earnings' },
            ].map((s, i) => (
              <View key={i} style={styles.creatorStat}>
                <Text style={[styles.creatorStatVal, { color: colors.violet }]}>{s.value}</Text>
                <Text style={[styles.creatorStatLbl, { color: colors.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>

      {/* City Selector Modal */}
      <CitySelector
        visible={showCitySelector}
        onClose={() => setShowCitySelector(false)}
      />
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGlow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
    transform: [{ scale: 1.5 }],
  },
  scrollContent: { paddingHorizontal: SPACING.xl },

  // ── Profile Header ──
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarEmoji: { fontSize: 32 },
  profileInfo: { flex: 1, gap: SPACING.xs },
  userName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  userEmail: { fontSize: 13, fontWeight: '500' },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    gap: SPACING.xs,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600' },

  // ── Contribution ──
  contributionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
    overflow: 'hidden',
  },
  contributionHeader: { padding: SPACING.lg, paddingBottom: 0 },
  contributionTitle: { fontSize: 15, fontWeight: '700' },
  contributionGrid: {
    flexDirection: 'row',
    padding: SPACING.lg,
  },
  contributionItem: { flex: 1, alignItems: 'center', gap: SPACING.xs },
  contributionVal: { fontSize: 22, fontWeight: '900' },
  contributionLbl: { fontSize: 11, fontWeight: '600' },
  contributionDivider: { width: 1, marginVertical: SPACING.xs },
  contributionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  contributionFooterText: { fontSize: 12, fontWeight: '600' },
  contributionBold: { fontSize: 13, fontWeight: '800' },

  // ── Badges ──
  section: { marginBottom: SPACING.xxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  viewAll: { fontSize: 13, fontWeight: '700' },
  badgesRow: { gap: SPACING.md, paddingBottom: SPACING.xs },
  badgeCard: {
    width: 90,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badgeCardIcon: { fontSize: 28 },
  badgeCardLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  badgeCardCheck: { fontSize: 14, fontWeight: '900', position: 'absolute', top: 8, right: 8 },

  // ── Rankings ──
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
  },
  rankIcon: { fontSize: 32 },
  rankInfo: { flex: 1, gap: SPACING.sm },
  rankTitle: { fontSize: 16, fontWeight: '700' },
  rankRow: { flexDirection: 'row', gap: SPACING.sm },
  rankPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  rankPillText: { fontSize: 11, fontWeight: '700' },

  // ── Rewards Summary ──
  rewardsCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
  },
  rewardsCardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  rewardsEmoji: { fontSize: 28 },
  rewardsInfo: { flex: 1 },
  rewardsTitle: { fontSize: 15, fontWeight: '700' },
  rewardsBalance: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  rewardsProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  rewardsLevel: { fontSize: 12, fontWeight: '600' },
  rewardsLevelPct: { fontSize: 12, fontWeight: '700' },
  rewardsTrack: { height: 6, borderRadius: 3 },
  rewardsFill: { height: 6, borderRadius: 3 },

  // ── My Reviews ──
  reviewCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  reviewBizIcon: { fontSize: 24 },
  reviewInfo: { flex: 1 },
  reviewBizName: { fontSize: 14, fontWeight: '700' },
  reviewStars: { flexDirection: 'row', gap: 1, marginTop: 2 },
  starIcon: { fontSize: 12 },
  reviewTime: { fontSize: 11, fontWeight: '500' },
  reviewText: { fontSize: 13, fontWeight: '500', lineHeight: 20 },

  // ── My Photos ──
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoWrap: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  photoThumb: { width: '100%', height: '100%', borderRadius: RADIUS.md },

  // ── Saved Collections ──
  collectionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
  },
  collectionsIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionsInfo: { flex: 1 },
  collectionsTitle: { fontSize: 15, fontWeight: '700' },
  collectionsSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // ── Activity Timeline ──
  activityTimeline: { gap: SPACING.xs, paddingLeft: 4 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingLeft: SPACING.md,
    borderLeftWidth: 1,
    marginLeft: -1,
  },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmoji: { fontSize: 16 },
  activityInfo: { flex: 1 },
  activityLabel: { fontSize: 13, fontWeight: '600' },
  activityTime: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  // ── Business Section ──
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  businessIcon: { fontSize: 32 },
  businessInfo: { flex: 1 },
  businessName: { fontSize: 15, fontWeight: '700' },
  businessStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  businessStatus: { fontSize: 12, fontWeight: '700' },
  manageBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  manageBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  addBusinessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addBusinessText: { fontSize: 14, fontWeight: '700' },

  // ── Menu Rows ──
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuSublabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // ── Creator Preview ──
  creatorCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  creatorHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  creatorEmoji: { fontSize: 24 },
  creatorTitle: { fontSize: 16, fontWeight: '800' },
  creatorSub: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
  creatorPreview: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.sm },
  creatorStat: { alignItems: 'center', gap: 4, width: 70 },
  creatorStatVal: { fontSize: 18, fontWeight: '900' },
  creatorStatLbl: { fontSize: 10, fontWeight: '600' },
});
