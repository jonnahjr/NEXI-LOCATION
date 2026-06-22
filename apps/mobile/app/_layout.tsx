import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme, ThemeProvider } from '../src/theme/colors';
import { useAppStore } from '../src/store/appStore';
import { notificationService } from '../src/services/notifications';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell() {
  const { colors, isDark } = useTheme();
  const user = useAppStore((state) => state.user);
  const isLoading = useAppStore((state) => state.isLoading);
  const isOnline = useAppStore((state) => state.isOnline);
  const syncFromBackend = useAppStore((state) => state.syncFromBackend);
  const mounted = useRef(false);
  const hasSynced = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Sync data from backend on app start ──────────────────────────
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncFromBackend();
    }
  }, []);

  // ── Start REST polling for real-time notifications ─────────────────
  useEffect(() => {
    if (user?.id) {
      const uid = user.id;

      // Wire up event handlers to the Zustand store
      const unsub1 = notificationService.onNotificationsListReceived((list) => {
        if (mounted.current) {
          useAppStore.getState().setNotifications(list);
        }
      });

      const unsub2 = notificationService.onUnreadCountChange((count) => {
        if (mounted.current) {
          useAppStore.getState().setUnreadCount(count);
        }
      });

      // Start REST polling (connects immediately, polls every 10s)
      notificationService.connect(uid);

      return () => {
        unsub1();
        unsub2();
        notificationService.disconnect();
      };
    }
  }, [user?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
