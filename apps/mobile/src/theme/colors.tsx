// ─── Nexi Locate Theme System ────────────────────────────────────────────
// Full light & dark modes with glassmorphism tokens, AI-vibe gradients & motion tokens

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ── Color Palettes ───────────────────────────────────────────────────────

export const darkPalette = {
  // Core
  bg: '#0A0E1A',
  surface: '#111827',
  surfaceAlt: '#1A2236',
  card: '#1A2236',
  cardElevated: '#1E2A40',
  border: '#1E293B',
  borderLight: '#263045',

  // Brand — #FAA330
  primary: '#FAA330',
  primaryLight: '#FBBF5A',
  primaryDark: '#E08A1A',
  primaryGlow: 'rgba(250,163,48,0.15)',
  primaryGlowStrong: 'rgba(250,163,48,0.25)',

  // Accent
  accent: '#10B981',
  accentLight: '#34D399',
  accentDark: '#059669',
  accentGlow: 'rgba(16,185,129,0.12)',

  // Gold / Warning
  gold: '#F59E0B',
  goldLight: '#FCD34D',
  goldDark: '#D97706',
  goldGlow: 'rgba(245,158,11,0.12)',

  // Danger
  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  dangerDark: '#DC2626',
  dangerGlow: 'rgba(239,68,68,0.12)',

  // Violet (AI vibe)
  violet: '#8B5CF6',
  violetLight: '#A78BFA',
  violetDark: '#7C3AED',
  violetGlow: 'rgba(139,92,246,0.15)',

  // Text
  text: '#F9FAFB',
  textSub: '#9CA3AF',
  textMuted: '#6B7280',

  // Glass
  glassBg: 'rgba(26,34,54,0.6)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassHighlight: 'rgba(255,255,255,0.04)',

  // Shadows
  shadow: 'rgba(0,0,0,0.4)',
  shadowGlow: 'rgba(59,130,246,0.15)',
} as const;

export const lightPalette = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',

  primary: '#E89228',
  primaryLight: '#FAAF4A',
  primaryDark: '#C47A1A',
  primaryGlow: 'rgba(232,146,40,0.08)',
  primaryGlowStrong: 'rgba(232,146,40,0.15)',

  accent: '#059669',
  accentLight: '#10B981',
  accentDark: '#047857',
  accentGlow: 'rgba(5,150,105,0.08)',

  gold: '#D97706',
  goldLight: '#F59E0B',
  goldDark: '#B45309',
  goldGlow: 'rgba(217,119,6,0.08)',

  danger: '#DC2626',
  dangerLight: '#EF4444',
  dangerDark: '#B91C1C',
  dangerGlow: 'rgba(220,38,38,0.08)',

  violet: '#7C3AED',
  violetLight: '#8B5CF6',
  violetDark: '#6D28D9',
  violetGlow: 'rgba(124,58,237,0.08)',

  text: '#0F172A',
  textSub: '#475569',
  textMuted: '#94A3B8',

  glassBg: 'rgba(255,255,255,0.7)',
  glassBorder: 'rgba(0,0,0,0.06)',
  glassHighlight: 'rgba(255,255,255,0.5)',

  shadow: 'rgba(0,0,0,0.08)',
  shadowGlow: 'rgba(37,99,235,0.1)',
} as const;

export type ThemePalette = {
  [K in keyof typeof darkPalette]: string;
};

// ── Spacing & Radius Tokens ──────────────────────────────────────────────

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '800', lineHeight: 36 } as const,
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 } as const,
  h3: { fontSize: 20, fontWeight: '700', lineHeight: 28 } as const,
  body: { fontSize: 15, fontWeight: '500', lineHeight: 24 } as const,
  bodySmall: { fontSize: 13, fontWeight: '500', lineHeight: 20 } as const,
  caption: { fontSize: 11, fontWeight: '600', lineHeight: 16 } as const,
  label: { fontSize: 12, fontWeight: '700', lineHeight: 16 } as const,
  number: { fontSize: 32, fontWeight: '900', lineHeight: 36 } as const,
  huge: { fontSize: 48, fontWeight: '900', lineHeight: 52 } as const,
} as const;

// ── Theme Context ────────────────────────────────────────────────────────

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemePalette;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: mode === 'dark' ? darkPalette : lightPalette,
      isDark: mode === 'dark',
      toggleTheme,
      setMode,
    }),
    [mode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
