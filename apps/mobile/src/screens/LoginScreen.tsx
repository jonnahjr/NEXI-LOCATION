import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAppStore();

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password');
      return;
    }
    login({
      id: 'user-1',
      name: email.split('@')[0] || 'User',
      email: email.trim(),
      role: 'user',
      points: 1240,
      totalEarned: 2450,
      level: 5,
      verified: true,
      createdAt: '2025-01-15',
      reviewCount: 24,
      photoCount: 48,
    });
    Alert.alert('Welcome back!', 'You are now signed in.', [
      { text: 'Continue', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Back + Logo */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>📍</Text>
          <Text style={[styles.logoText, { color: colors.text }]}>
            Nexi<Text style={{ color: colors.primary }}>Locate</Text>
          </Text>
          <Text style={[styles.logoSub, { color: colors.textSub }]}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} style={styles.forgotRow}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} style={[styles.loginBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Login */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.socialIcon}>📧</Text>
              <Text style={[styles.socialText, { color: colors.text }]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.socialIcon}>📱</Text>
              <Text style={[styles.socialText, { color: colors.text }]}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.socialIcon}>🅶</Text>
              <Text style={[styles.socialText, { color: colors.text }]}>Google</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSub }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, flexGrow: 1 },
  header: { marginBottom: SPACING.xxl },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  logoSection: { alignItems: 'center', marginBottom: SPACING.huge },
  logoEmoji: { fontSize: 48, marginBottom: SPACING.md },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  logoSub: { fontSize: 14, fontWeight: '500', marginTop: SPACING.sm },
  form: { gap: SPACING.md },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, borderWidth: 1 },
  input: { flex: 1, paddingVertical: SPACING.md + 2, fontSize: 15, fontWeight: '500' },
  forgotRow: { alignItems: 'flex-end', marginBottom: SPACING.sm },
  forgotText: { fontSize: 13, fontWeight: '700' },
  loginBtn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 2, alignItems: 'center', marginTop: SPACING.sm },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginVertical: SPACING.xxl },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: SPACING.md },
  socialBtn: { flex: 1, alignItems: 'center', gap: 4, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, borderWidth: 1 },
  socialIcon: { fontSize: 20 },
  socialText: { fontSize: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerLink: { fontSize: 13, fontWeight: '700' },
});
