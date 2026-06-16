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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

export const ForgotPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>🔑</Text>
          <Text style={[styles.logoText, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.logoSub, { color: colors.textSub }]}>
            Enter your email and we'll send you an OTP to reset your password
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <TextInput style={[styles.input, { color: colors.text }]} placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <TouchableOpacity onPress={() => router.push('/auth/otp')} style={[styles.resetBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <Text style={styles.resetBtnText}>Send OTP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Back to Sign In</Text>
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
  logoSection: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoEmoji: { fontSize: 48, marginBottom: SPACING.md },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  logoSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 22, marginTop: SPACING.sm },
  form: { gap: SPACING.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, borderWidth: 1 },
  input: { flex: 1, paddingVertical: SPACING.md + 2, fontSize: 15, fontWeight: '500' },
  resetBtn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 2, alignItems: 'center' },
  resetBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  footer: { alignItems: 'center', marginTop: SPACING.xxl },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
