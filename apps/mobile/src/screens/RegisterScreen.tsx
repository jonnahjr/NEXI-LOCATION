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
import { useTheme, SPACING, RADIUS } from '../theme/colors';
import { signUp } from '../services/authService';
import { validateEmail, validateUsername, validateEthiopianPhone } from '../services/moderation';

export const RegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; phone?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    
    const nameCheck = validateUsername(name);
    if (!nameCheck.valid) errors.name = nameCheck.reason;

    if (!email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(email)) errors.email = 'Enter a valid email address';

    if (phone.trim() && !validateEthiopianPhone(phone)) {
      errors.phone = 'Enter a valid Ethiopian phone number';
    }

    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);

    const { user, error } = await signUp(email.trim(), password, name.trim(), phone.trim() || undefined);

    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error, [{ text: 'OK' }]);
      return;
    }

    if (user) {
      // Typically require email confirmation, redirect to OTP or login
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account before logging in.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
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

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>Join NexiLocate and start exploring.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View>
            <View style={[
              styles.inputWrap,
              { backgroundColor: colors.card, borderColor: fieldErrors.name ? colors.danger : colors.border }
            ]}>
              <Ionicons name="person-outline" size={18} color={fieldErrors.name ? colors.danger : colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(t) => { setName(t); setFieldErrors((e) => ({ ...e, name: undefined })); }}
                editable={!loading}
              />
            </View>
            {fieldErrors.name && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{fieldErrors.name}</Text>
            )}
          </View>

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

          {/* Phone (Optional) */}
          <View>
            <View style={[
              styles.inputWrap,
              { backgroundColor: colors.card, borderColor: fieldErrors.phone ? colors.danger : colors.border }
            ]}>
              <Ionicons name="call-outline" size={18} color={fieldErrors.phone ? colors.danger : colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Phone (Optional, e.g. 09...)"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={(t) => { setPhone(t); setFieldErrors((e) => ({ ...e, phone: undefined })); }}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
            {fieldErrors.phone && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{fieldErrors.phone}</Text>
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

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleRegister}
            style={[styles.loginBtn, { backgroundColor: loading ? colors.primaryGlow : colors.primary }]}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.loginBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

        </View>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSub }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, flexGrow: 1 },
  header: { marginBottom: SPACING.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  titleSection: { marginBottom: SPACING.xl },
  title: { fontSize: 28, fontWeight: '800', marginBottom: SPACING.xs },
  subtitle: { fontSize: 15, fontWeight: '500' },
  form: { gap: SPACING.md },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, borderWidth: 1,
  },
  input: { flex: 1, paddingVertical: SPACING.md + 2, fontSize: 15, fontWeight: '500' },
  errorText: { fontSize: 12, fontWeight: '500', marginTop: 4, marginLeft: 4 },
  loginBtn: {
    borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 4,
    alignItems: 'center', marginTop: SPACING.sm,
  },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl, marginBottom: SPACING.xl },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerLink: { fontSize: 13, fontWeight: '700' },
});
