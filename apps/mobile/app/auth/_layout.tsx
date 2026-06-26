import React, { useEffect } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/colors';

export default function AuthLayout() {
  const { colors } = useTheme();

  // Handle Android hardware back button on auth screens.
  // Since auth screens are reached via router.replace() there is no back stack,
  // so we intercept the back press and exit the app gracefully.
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let backPressCount = 0;
    let backPressTimer: ReturnType<typeof setTimeout>;

    const onBackPress = () => {
      if (backPressCount === 0) {
        backPressCount = 1;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        backPressTimer = setTimeout(() => {
          backPressCount = 0;
        }, 2000);
        return true; // Consume the event (don't crash)
      } else {
        clearTimeout(backPressTimer);
        BackHandler.exitApp(); // Second press → exit app
        return true;
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
      clearTimeout(backPressTimer);
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
