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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';
import { signIn, signInWithGoogle } from '../services/authService';
import { validateEmail } from '../services/moderation';

// ── Local moderation helper ────────────────────────────────────────────────
function _validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const login = useAppStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!_validateEmail(email)) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    const { user, error } = await signInWithGoogle();

    setLoading(false);

    if (error === 'cancelled') {
      return; // User cancelled — no need to show an alert
    }

    if (error) {
      Alert.alert('Google Sign-In Failed', error, [{ text: 'OK' }]);
      return;
    }

    if (user) {
      login(user);
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    const { user, error } = await signIn(email.trim(), password);

    setLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error, [{ text: 'OK' }]);
      return;
    }

    if (user) {
      login(user);
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Back Button */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>📍</Text>
          <Text style={[styles.logoText, { color: colors.text }]}>
            Nexi<Text style={{ color: colors.primary }}>Locate</Text>
          </Text>
          <Text style={[styles.logoSub, { color: colors.textSub }]}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View>
            <View style={[
              styles.inputWrap,
              { backgroundColor: colors.card, borderColor: fieldErrors.email ? colors.danger : colors.border }
            ]}>
              <Ionicons name="mail-outline" size={18} color={fieldErrors.email ? colors.danger : colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(t) => { setEmail(t); setFieldErrors((e) => ({ ...e, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
            {fieldErrors.email && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{fieldErrors.email}</Text>
            )}
          </View>

          {/* Password */}
          <View>
            <View style={[
              styles.inputWrap,
              { backgroundColor: colors.card, borderColor: fieldErrors.password ? colors.danger : colors.border }
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color={fieldErrors.password ? colors.danger : colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); setFieldErrors((e) => ({ ...e, password: undefined })); }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {fieldErrors.password && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{fieldErrors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotRow}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.loginBtn, { backgroundColor: loading ? colors.primaryGlow : colors.primary }]}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Login Scaffold */}
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Text style={styles.socialIcon}>🅶</Text>
                <Text style={[styles.socialText, { color: colors.text }]}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
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
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, borderWidth: 1,
  },
  input: { flex: 1, paddingVertical: SPACING.md + 2, fontSize: 15, fontWeight: '500' },
  errorText: { fontSize: 12, fontWeight: '500', marginTop: 4, marginLeft: 4 },
  forgotRow: { alignItems: 'flex-end' },
  forgotText: { fontSize: 13, fontWeight: '700' },
  loginBtn: {
    borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 4,
    alignItems: 'center', marginTop: SPACING.sm,
  },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginVertical: SPACING.md },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '600' },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.md, borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 2, borderWidth: 1,
  },
  socialIcon: { fontSize: 20 },
  socialText: { fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerLink: { fontSize: 13, fontWeight: '700' },
});
