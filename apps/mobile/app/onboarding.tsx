import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  ScrollView,
  BackHandler,
  ToastAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/theme/colors';

const ONBOARDING_KEY = 'nexi_onboarding_done';

const SLIDES = [
  {
    id: 1,
    emoji: '📍',
    title: 'Discover Amazing Places',
    subtitle: 'Find the best restaurants, hotels, clinics, and more in Addis Ababa — all on an interactive map.',
    accent: '#FAA330',
    features: ['Real-time map with live pins', 'Verified business listings', 'GPS distance & directions'],
  },
  {
    id: 2,
    emoji: '🔍',
    title: 'Smart Search in Amharic & English',
    subtitle: 'Search naturally — "Best coffee near Bole" or "24-hour pharmacy" — and get instant results powered by AI.',
    accent: '#3B82F6',
    features: ['Full-text search in seconds', 'Category filters', 'Trending & popular nearby'],
  },
  {
    id: 3,
    emoji: '🏆',
    title: 'Earn Nexi Points & Rewards',
    subtitle: 'Check in, write reviews, and share places to earn points. Redeem for free coffee, rides, and more!',
    accent: '#10B981',
    features: ['50 pts for each review', '10 pts per check-in', 'Redeem for real rewards'],
  },
  {
    id: 4,
    emoji: '🌍',
    title: 'Built for Ethiopia',
    subtitle: 'Works offline-first. Fast on 2G. Available across Addis, Dire Dawa, Bahir Dar, and more cities.',
    accent: '#8B5CF6',
    features: ['Offline support', 'Works on low-end devices', 'Multi-city support'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const slide = SLIDES[currentIndex];

  const goToLogin = useCallback(() => {
    try {
      console.log('Navigating to login...');
      AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
      router.replace('/auth/login');
    } catch (e) {
      console.warn('goToLogin error:', e);
    }
  }, [router]);

  const handleNext = useCallback(() => {
    try {
      console.log('Next button pressed...');
      if (currentIndex < SLIDES.length - 1) {
        const next = currentIndex + 1;
        setCurrentIndex(next);
        scrollRef.current?.scrollTo({ x: next * windowWidth, y: 0, animated: true });
      } else {
        goToLogin();
      }
    } catch (e) {
      console.warn('handleNext error:', e);
    }
  }, [currentIndex, goToLogin, windowWidth]);

  const handleMomentumEnd = useCallback((e: any) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
    if (newIndex >= 0 && newIndex < SLIDES.length && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, windowWidth]);

  // Intercept Android hardware back button — no back stack exists here
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let pressCount = 0;
    let timer: ReturnType<typeof setTimeout>;
    const onBack = () => {
      if (pressCount === 0) {
        pressCount = 1;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        timer = setTimeout(() => { pressCount = 0; }, 2000);
        return true;
      }
      clearTimeout(timer);
      BackHandler.exitApp();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => { sub.remove(); clearTimeout(timer); };
  }, []);



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 1. ScrollView is placed FIRST in the view tree so it sits underneath everything */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        bounces={false}
        style={StyleSheet.absoluteFillObject}
      >
        {SLIDES.map((s, i) => (
          <View key={s.id} style={[styles.slide, { width: windowWidth, height: windowHeight }]}>
            <View style={styles.slideContent}>
              <View style={[styles.emojiCircle, { backgroundColor: s.accent + '15', borderColor: s.accent + '30' }]}>
                <Text style={styles.emoji}>{s.emoji}</Text>
              </View>
              <View style={[styles.slideNumBadge, { backgroundColor: s.accent + '20' }]}>
                <Text style={[styles.slideNum, { color: s.accent }]}>STEP {i + 1} OF {SLIDES.length}</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{s.title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSub }]}>{s.subtitle}</Text>
              
              <View style={styles.features}>
                {s.features.map((feat, fi) => (
                  <View key={fi} style={[styles.featureRow, { 
                    borderColor: s.accent + '20', 
                    backgroundColor: isDark ? s.accent + '08' : s.accent + '10',
                  }]}>
                    <View style={[styles.featureDot, { backgroundColor: s.accent }]} />
                    <Text style={[styles.featureText, { color: colors.text }]}>{feat}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 2. Skip Button placed AFTER ScrollView, absolutely positioned TOP RIGHT */}
      <View style={[styles.headerAbsolute]}>
        <Pressable 
          onPress={goToLogin}
          style={({ pressed }) => [styles.skipBtn, { 
            opacity: pressed ? 0.5 : 1,
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
          }]}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={[styles.skipText, { color: slide.accent }]}>Skip</Text>
        </Pressable>
      </View>

      {/* 3. Bottom Area placed AFTER ScrollView, absolutely positioned BOTTOM */}
      <View style={[styles.bottomAbsolute, { backgroundColor: colors.bg }]}>
        {/* Indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? slide.accent : slide.accent + '25',
                  width: i === currentIndex ? 32 : 10,
                },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        {currentIndex === SLIDES.length - 1 ? (
          <View style={styles.actionColumn}>
            <Pressable
              onPress={goToLogin}
              style={({ pressed }) => [styles.ctaBtn, { backgroundColor: slide.accent, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.ctaBtnText}>Get Started Now</Text>
            </Pressable>
            
            <Pressable onPress={goToLogin} style={({ pressed }) => [styles.loginRow, { opacity: pressed ? 0.5 : 1 }]}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <Text style={[styles.loginLinkHighlight, { color: slide.accent }]}>Login</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [styles.ctaBtn, { backgroundColor: slide.accent, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.ctaBtnText}>Next Step</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  headerAbsolute: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 100,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  slide: { 
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -80, // Offset for absolute bottom area
  },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  emoji: { fontSize: 60 },
  slideNumBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  slideNum: { 
    fontSize: 11, 
    fontWeight: '900', 
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F9FAFB',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '500',
  },
  features: { 
    alignSelf: 'stretch', 
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  featureDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4,
  },
  featureText: { 
    color: '#F3F4F6', 
    fontSize: 15, 
    fontWeight: '600',
  },
  bottomAbsolute: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24, 
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: '#0A0E1A',
    zIndex: 100,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  actionColumn: {
    width: '100%',
    gap: 16,
  },
  ctaBtn: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#ffffff',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  loginLinkHighlight: {
    fontSize: 15,
    fontWeight: '800',
  },
});
