import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, SPACING, RADIUS } from '../theme/colors';
import { supabase } from '../services/supabase';

export const ChangePasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const [hasPassword, setHasPassword] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Detect if user has an email/password identity or only OAuth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const identities = data.user?.identities ?? [];
      const hasEmailIdentity = identities.some((id) => id.provider === 'email');
      setHasPassword(hasEmailIdentity);
      setCheckingAuth(false);
    }).catch(() => setCheckingAuth(false));
  }, []);

  const screenTitle = hasPassword ? 'Change Password' : 'Set Password';

  const handleUpdatePassword = useCallback(async () => {
    // Validate
    if (hasPassword && !currentPassword) {
      Alert.alert('Required', 'Please enter your current password.');
      return;
    }
    if (!newPassword) {
      Alert.alert('Required', 'Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Verify current password if user has one
      if (hasPassword) {
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email;
        if (!email) {
          Alert.alert('Error', 'Could not verify your session. Please sign in again.');
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });

        if (signInError) {
          Alert.alert('Incorrect Password', 'The current password you entered is incorrect.');
          return;
        }
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        Alert.alert('Update Failed', updateError.message);
        return;
      }

      Alert.alert(
        hasPassword ? 'Password Updated' : 'Password Set',
        hasPassword
          ? 'Your password has been changed successfully.'
          : 'Your password has been set successfully. You can now sign in with email and password.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [hasPassword, currentPassword, newPassword, confirmPassword, router]);

  const isFormValid = hasPassword
    ? currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword
    : newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{screenTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      {checkingAuth ? (
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 120 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.violetGlow, borderColor: colors.violet + '33' }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.violet} />
          <Text style={[styles.infoText, { color: colors.textSub }]}>
            {hasPassword
              ? 'Choose a strong password with at least 6 characters. Use a mix of letters, numbers, and symbols.'
              : 'You signed in with Google and don\'t have a password yet. Set one now to also sign in with email and password.'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Current Password (only shown if user has an existing password) */}
          {hasPassword && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Current Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  <Ionicons
                    name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>New Password</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="lock-open-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showNew}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {/* Password strength indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthRow}>
                <View
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor: newPassword.length < 6 ? colors.danger : newPassword.length < 8 ? colors.gold : colors.accent,
                      width: newPassword.length < 6 ? '33%' : newPassword.length < 8 ? '66%' : '100%',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.strengthText,
                    {
                      color: newPassword.length < 6 ? colors.danger : newPassword.length < 8 ? colors.gold : colors.accent,
                    },
                  ]}
                >
                  {newPassword.length < 6 ? 'Weak' : newPassword.length < 8 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm New Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Confirm New Password</Text>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: colors.card,
                  borderColor: confirmPassword.length > 0 && newPassword !== confirmPassword
                    ? colors.danger
                    : confirmPassword.length > 0 && newPassword === confirmPassword
                    ? colors.accent
                    : colors.border,
                },
              ]}
            >
              <Ionicons name="lock-open-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={[styles.errorText, { color: colors.danger }]}>Passwords do not match</Text>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <Text style={[styles.successText, { color: colors.accent }]}>Passwords match ✓</Text>
            )}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleUpdatePassword}
          disabled={loading || !isFormValid}
          style={[
            styles.submitBtn,
            {
              backgroundColor: isFormValid ? colors.primary : colors.surfaceAlt,
              opacity: loading || !isFormValid ? 0.5 : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>Update Password</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.huge },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Info Card ──
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
  },
  infoText: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 19 },

  // ── Form ──
  form: { gap: SPACING.xl, marginBottom: SPACING.xxl },
  fieldGroup: { gap: SPACING.sm },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: SPACING.md + 2,
  },

  // ── Strength Indicator ──
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  strengthBar: { height: 4, borderRadius: 2, flex: 1 },
  strengthText: { fontSize: 11, fontWeight: '700', width: 40, textAlign: 'right' },

  // ── Validation Feedback ──
  errorText: { fontSize: 12, fontWeight: '600', marginLeft: 2 },
  successText: { fontSize: 12, fontWeight: '600', marginLeft: 2 },

  // ── Submit ──
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
