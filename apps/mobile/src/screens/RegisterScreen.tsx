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

export const RegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAppStore();

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please fill in all required fields');
      return;
    }
    login({
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role: 'user',
      points: 0,
      totalEarned: 0,
      level: 1,
      verified: false,
      createdAt: new Date().toISOString().split('T')[0],
      reviewCount: 0,
      photoCount: 0,
    });
    Alert.alert('Welcome to Nexi Locate!', 'Your account has been created.', [
      { text: 'Get Started', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>🚀</Text>
          <Text style={[styles.logoText, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.logoSub, { color: colors.textSub }]}>Join the Nexi Locate community</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            <TextInput style={[styles.input, { color: colors.text }]} placeholder="Full Name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
          </View>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <TextInput style={[styles.input, { color: colors.text }]} placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.textMuted} />
            <TextInput style={[styles.input, { color: colors.text }]} placeholder="Phone Number" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            <TextInput style={[styles.input, { color: colors.text }]} placeholder="Password" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity onPress={handleRegister} style={[styles.registerBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <Text style={styles.registerBtnText}>Create Account</Text>
          </TouchableOpacity>

          <View style={styles.terms}>
            <Text style={[styles.termsText, { color: colors.textMuted }]}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSub }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
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
  header: { marginBottom: SPACING.xxl },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  logoSection: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoEmoji: { fontSize: 48, marginBottom: SPACING.md },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  logoSub: { fontSize: 14, fontWeight: '500', marginTop: SPACING.sm },
  form: { gap: SPACING.md },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, borderWidth: 1 },
  input: { flex: 1, paddingVertical: SPACING.md + 2, fontSize: 15, fontWeight: '500' },
  registerBtn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 2, alignItems: 'center', marginTop: SPACING.md },
  registerBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  terms: { alignItems: 'center', marginTop: SPACING.md },
  termsText: { fontSize: 12, fontWeight: '500', textAlign: 'center', lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerLink: { fontSize: 13, fontWeight: '700' },
});
