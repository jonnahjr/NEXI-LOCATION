import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  BackHandler,
  ToastAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/theme/colors';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
} from 'react-native-reanimated';

const ONBOARDING_KEY = 'nexi_onboarding_done';
const ACCENT = '#FAA330'; // Constant cocoa color throughout

const SLIDES = [
  {
    id: 1,
    emoji: '📍',
    title: 'Discover Amazing Places',
    subtitle:
      'Find the best restaurants, hotels, clinics, and more in Addis Ababa — all on an interactive map.',
    features: ['Real-time map with live pins', 'Verified business listings', 'GPS distance & directions'],
  },
  {
    id: 2,
    emoji: '🔍',
    title: 'Smart Search in Amharic & English',
    subtitle:
      'Search naturally — "Best coffee near Bole" or "24-hour pharmacy" — and get instant results powered by AI.',
    features: ['Full-text search in seconds', 'Category filters', 'Trending & popular nearby'],
  },
  {
    id: 3,
    emoji: '🏆',
    title: 'Earn Nexi Points & Rewards',
    subtitle:
      'Check in, write reviews, and share places to earn points. Redeem for free coffee, rides, and more!',
    features: ['50 pts for each review', '10 pts per check-in', 'Redeem for real rewards'],
  },
  {
    id: 4,
    emoji: '🌍',
    title: 'Built for Ethiopia',
    subtitle:
      'Works offline-first. Fast on 2G. Available across Addis, Dire Dawa, Bahir Dar, and more cities.',
    features: ['Offline support', 'Works on low-end devices', 'Multi-city support'],
  },
];

// ── Animated Slide Content ────────────────────────────────────────────────

function SlideView({
  slide,
  index,
  windowWidth,
  windowHeight,
  scrollX,
  colors,
  isDark,
}: {
  slide: (typeof SLIDES)[0];
  index: number;
  windowWidth: number;
  windowHeight: number;
  scrollX: SharedValue<number>;
  colors: any;
  isDark: boolean;
}) {
  const input = [
    (index - 1) * windowWidth,
    index * windowWidth,
    (index + 1) * windowWidth,
  ];

  const emojiAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, input, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(scrollX.value, input, [0.4, 1, 0.4], Extrapolation.CLAMP),
      },
    ],
  }));

  const titleAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, input, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollX.value, input, [50, 0, -50], Extrapolation.CLAMP),
      },
    ],
  }));

  const subtitleAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, input, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollX.value, input, [30, 0, -30], Extrapolation.CLAMP),
      },
    ],
  }));

  const featuresAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, input, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollX.value, input, [20, 0, -20], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View style={[styles.slide, { width: windowWidth, height: windowHeight }]}>
      <View style={styles.slideContent}>
        <Animated.Text style={[styles.emoji, emojiAnim]}>
          {slide.emoji}
        </Animated.Text>

        <Animated.Text style={[styles.title, { color: colors.text }, titleAnim]}>
          {slide.title}
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { color: colors.textSub }, subtitleAnim]}>
          {slide.subtitle}
        </Animated.Text>

        <Animated.View style={[styles.features, { gap: 12 }, featuresAnim]}>
          {slide.features.map((feat, fi) => (
            <View
              key={fi}
              style={[
                styles.featureRow,
                {
                  borderColor: ACCENT + '20',
                  backgroundColor: isDark ? ACCENT + '08' : ACCENT + '10',
                },
              ]}
            >
              <View style={[styles.featureDot, { backgroundColor: ACCENT }]} />
              <Text style={[styles.featureText, { color: colors.text }]}>{feat}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

// ── Animated Dot Indicator ────────────────────────────────────────────────

function DotIndicator({
  index,
  scrollX,
  windowWidth,
}: {
  index: number;
  scrollX: SharedValue<number>;
  windowWidth: number;
}) {
  const input =
    index === 0
      ? [-windowWidth, 0, windowWidth]
      : [(index - 1) * windowWidth, index * windowWidth, (index + 1) * windowWidth];

  const dotAnim = useAnimatedStyle(() => {
    const w = interpolate(scrollX.value, input, [10, 32, 10], Extrapolation.CLAMP);
    const o = interpolate(scrollX.value, input, [0.25, 1, 0.25], Extrapolation.CLAMP);
    return {
      width: withSpring(w, { stiffness: 200, damping: 20 }),
      opacity: o,
    };
  });

  return <Animated.View style={[styles.dot, { backgroundColor: ACCENT }, dotAnim]} />;
}

// ── Main Screen ───────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const goToLogin = useCallback(() => {
    try {
      AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
      router.replace('/auth/login');
    } catch (e) {
      console.warn('goToLogin error:', e);
    }
  }, [router]);

  const handleNext = useCallback(() => {
    try {
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

  const handleMomentumEnd = useCallback(
    (e: any) => {
      const newIndex = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
      if (newIndex >= 0 && newIndex < SLIDES.length && newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex, windowWidth],
  );

  // Intercept Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let pressCount = 0;
    let timer: ReturnType<typeof setTimeout>;
    const onBack = () => {
      if (pressCount === 0) {
        pressCount = 1;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        timer = setTimeout(() => {
          pressCount = 0;
        }, 2000);
        return true;
      }
      clearTimeout(timer);
      BackHandler.exitApp();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Animated horizontal scroll */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumEnd}
        bounces={false}
        style={StyleSheet.absoluteFill}
      >
        {SLIDES.map((s, i) => (
          <SlideView
            key={s.id}
            slide={s}
            index={i}
            windowWidth={windowWidth}
            windowHeight={windowHeight}
            scrollX={scrollX}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </Animated.ScrollView>

      {/* Skip button */}
      <View style={styles.headerAbsolute}>
        <Pressable
          onPress={goToLogin}
          style={({ pressed }) => [
            styles.skipBtn,
            {
              opacity: pressed ? 0.5 : 1,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
            },
          ]}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={[styles.skipText, { color: ACCENT }]}>Skip</Text>
        </Pressable>
      </View>

      {/* Bottom: dots + CTA */}
      <View style={[styles.bottomAbsolute, { backgroundColor: colors.bg }]}>
        {/* Animated dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <DotIndicator key={i} index={i} scrollX={scrollX} windowWidth={windowWidth} />
          ))}
        </View>

        {/* CTA buttons */}
        {currentIndex === SLIDES.length - 1 ? (
          <View style={styles.actionColumn}>
            <Pressable
              onPress={goToLogin}
              style={({ pressed }) => [
                styles.ctaBtn,
                { backgroundColor: ACCENT, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.ctaBtnText}>Get Started Now</Text>
            </Pressable>

            <Pressable
              onPress={goToLogin}
              style={({ pressed }) => [styles.loginRow, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <Text style={[styles.loginLinkHighlight, { color: ACCENT }]}>Login</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: ACCENT, opacity: pressed ? 0.8 : 1 },
            ]}
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
    marginTop: -80,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
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
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontSize: 16,
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
