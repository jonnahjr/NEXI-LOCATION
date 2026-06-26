import React, { useEffect, useRef } from 'react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/colors';
import { useAppStore } from '../src/store/appStore';
import { notificationService } from '../src/services/notifications';
import { getCurrentSession } from '../src/services/authService';
import { supabase } from '../src/services/supabase';
import { realtimeService } from '../src/services/realtimeService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import errorTracking from '../src/services/errorTracking';

// Keep splash visible until we are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// Init error tracking as early as possible
errorTracking.init();

const ONBOARDING_KEY = 'nexi_onboarding_done';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppShell() {
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();

  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authLoading = useAppStore((s) => s.authLoading);
  const user = useAppStore((s) => s.user);
  const login = useAppStore((s) => s.login);
  const logout = useAppStore((s) => s.logout);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);
  const syncFromBackend = useAppStore((s) => s.syncFromBackend);
  const setNotifications = useAppStore((s) => s.setNotifications);
  const setUnreadCount = useAppStore((s) => s.setUnreadCount);

  const mounted = useRef(false);
  const navDone = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ── 1. Check session on app start ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Safety timeout: if auth check takes > 5 seconds, force-proceed
    const timeout = setTimeout(() => {
      if (!cancelled && mounted.current) {
        console.warn('[Auth] Session check timed out. Proceeding as unauthenticated.');
        setAuthLoading(false);
      }
    }, 5000);

    const init = async () => {
      try {
        const { user: sessionUser } = await getCurrentSession();
        if (cancelled || !mounted.current) return;

        if (sessionUser) {
          login(sessionUser);
          errorTracking.setUserContext(sessionUser.id, sessionUser.email, sessionUser.name);
        }
      } catch {
        // Silently handle — user will see login/onboarding screen
      } finally {
        clearTimeout(timeout);
        if (!cancelled && mounted.current) {
          setAuthLoading(false);
        }
      }
    };

    init();

    // Listen for auth state changes ONLY after login/logout events (not initial load)
    let initialized = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip the first INITIAL_SESSION or SIGNED_OUT fired on startup —
        // that's handled by init() above to avoid a race condition.
        if (!initialized) {
          initialized = true;
          return;
        }

        if (cancelled || !mounted.current) return;

        if (event === 'SIGNED_OUT' || !session) {
          errorTracking.clearUserContext();
          // Don't call logout() here (it calls Supabase signOut again) — just clear state
          setAuthLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { getCurrentSession: getSession } = await import('../src/services/authService');
          const { user: refreshedUser } = await getSession();
          if (refreshedUser && mounted.current) {
            login(refreshedUser);
          }
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // ── 2. Navigation guard: redirect based on auth state ─────────────
  useEffect(() => {
    if (authLoading) return;
    if (navDone.current) return;
    navDone.current = true;

    // Hide splash screen now that we know where to go
    SplashScreen.hideAsync().catch(() => {});

    const currentRoute = segments[0];

    if (isAuthenticated) {
      if (currentRoute === 'auth' || currentRoute === 'onboarding' || !currentRoute) {
        router.replace('/(tabs)');
      }
    } else {
      AsyncStorage.getItem(ONBOARDING_KEY)
        .then((done) => {
          if (!mounted.current) return;
          if (!done) {
            router.replace('/onboarding');
          } else {
            if (currentRoute !== 'auth') {
              router.replace('/auth/login');
            }
          }
        })
        .catch(() => {
          if (!mounted.current) return;
          router.replace('/onboarding');
        });
    }
  }, [authLoading, isAuthenticated]);

  // ── 3. Reset navDone when auth state changes (for logout/login) ───
  const prevAuth = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuth.current !== isAuthenticated && !authLoading) {
      navDone.current = false;
      prevAuth.current = isAuthenticated;
    }
  }, [isAuthenticated, authLoading]);

  // ── 4. Data sync + real-time after login ───────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    syncFromBackend();

    const unsub1 = notificationService.onNotificationsListReceived((list) => {
      if (mounted.current) setNotifications(list);
    });
    const unsub2 = notificationService.onUnreadCountChange((count) => {
      if (mounted.current) setUnreadCount(count);
    });
    notificationService.connect(user.id);

    realtimeService.subscribeToNotifications(user.id, (notification) => {
      if (mounted.current) {
        useAppStore.getState().addNotification(notification);
        useAppStore.getState().setUnreadCount(
          useAppStore.getState().unreadCount + 1
        );
      }
    });

    return () => {
      unsub1();
      unsub2();
      notificationService.disconnect();
      realtimeService.unsubscribeAll();
    };
  }, [isAuthenticated, user?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <StatusBar style={colors.bg === '#F8FAFC' ? 'dark' : 'light'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
