import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/colors';

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
