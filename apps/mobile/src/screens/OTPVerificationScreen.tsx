import React, { useState, useRef } from 'react';
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
import { useTheme, SPACING, RADIUS } from '../theme/colors';

export const OTPVerificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (text && index === 5) {
      setTimeout(() => {
        Alert.alert('Verified!', 'Your code has been accepted.', [
          { text: 'Continue', onPress: () => router.replace('/(tabs)') },
        ]);
      }, 300);
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Alert.alert('Incomplete', 'Please enter all 6 digits');
      return;
    }
    Alert.alert('Verified!', 'Your code has been accepted.', [
      { text: 'Continue', onPress: () => router.replace('/(tabs)') },
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
          <Text style={styles.logoEmoji}>📱</Text>
          <Text style={[styles.logoText, { color: colors.text }]}>Verify Code</Text>
          <Text style={[styles.logoSub, { color: colors.textSub }]}>
            Enter the 6-digit code sent to your phone
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleVerify} style={[styles.verifyBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
          <Text style={styles.verifyBtnText}>Verify</Text>
        </TouchableOpacity>

        <View style={styles.resend}>
          <Text style={[styles.resendText, { color: colors.textSub }]}>Didn't receive code? </Text>
          <TouchableOpacity>
            <Text style={[styles.resendLink, { color: colors.primary }]}>Resend</Text>
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
  logoSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: SPACING.sm },
  otpRow: { flexDirection: 'row', gap: SPACING.md, justifyContent: 'center', marginBottom: SPACING.xxl },
  otpInput: { width: 48, height: 56, borderRadius: RADIUS.md, borderWidth: 1, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  verifyBtn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 2, alignItems: 'center' },
  verifyBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  resend: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  resendText: { fontSize: 13, fontWeight: '500' },
  resendLink: { fontSize: 13, fontWeight: '700' },
});
