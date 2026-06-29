import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../store/appStore';
import { useTheme, SPACING, RADIUS } from '../theme/colors';
import { updateProfile, uploadAvatar } from '../services/authService';

export const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user, refreshProfile } = useAppStore();

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const currentAvatar = previewAvatar || user?.avatar || null;

  const handlePickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photo library to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setAvatarUploading(true);
    try {
      // Upload first, then show preview
      const { url, error } = await uploadAvatar(user!.id, result.assets[0].uri);
      if (error) {
        Alert.alert('Upload Failed', error);
      } else if (url) {
        setPreviewAvatar(url);
        await refreshProfile();
      }
    } catch {
      Alert.alert('Error', 'Something went wrong uploading your photo.');
    } finally {
      setAvatarUploading(false);
    }
  }, [user, refreshProfile]);

  const handleSave = useCallback(async () => {
    if (!user?.id) return;

    if (!name.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const { success, error } = await updateProfile(user.id, {
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        avatar: currentAvatar ?? undefined,
      });

      if (!success) {
        Alert.alert('Save Failed', error ?? 'Something went wrong.');
        return;
      }

      await refreshProfile();
      router.back();
    } catch {
      Alert.alert('Error', 'Something went wrong saving your profile.');
    } finally {
      setSaving(false);
    }
  }, [user?.id, name, bio, phone, currentAvatar, refreshProfile, router]);

  const hasChanges =
    name !== (user?.name ?? '') ||
    bio !== (user?.bio ?? '') ||
    phone !== (user?.phone ?? '');

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || (!hasChanges && !previewAvatar)}
          style={[
            styles.saveBtn,
            {
              backgroundColor: hasChanges || previewAvatar ? colors.primary : colors.surfaceAlt,
              opacity: saving || (!hasChanges && !previewAvatar) ? 0.5 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            disabled={avatarUploading}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}>
              {currentAvatar ? (
                <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>👤</Text>
              )}
              {avatarUploading && (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              )}
            </View>
            <View style={[styles.avatarBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>
            Tap to change photo
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Bio</Text>
            <TextInput
              style={[
                styles.input,
                styles.bioInput,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>{bio.length}/200</Text>
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+251-XX-XXX-XXXX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          {/* Email (read-only) */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Email</Text>
            <View style={[styles.input, styles.emailInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[styles.emailText, { color: colors.textMuted }]}>
                {user?.email || 'No email'}
              </Text>
              <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
            </View>
          </View>
        </View>
      </ScrollView>
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
  saveBtn: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.huge },

  // ── Avatar ──
  avatarSection: { alignItems: 'center', marginBottom: SPACING.xxl, marginTop: SPACING.lg },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarEmoji: { fontSize: 40 },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: { fontSize: 12, fontWeight: '500', marginTop: SPACING.sm },

  // ── Form ──
  form: { gap: SPACING.xl },
  fieldGroup: { gap: SPACING.sm },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginLeft: 2 },
  input: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    fontSize: 15,
    fontWeight: '500',
  },
  bioInput: { minHeight: 100, paddingTop: SPACING.md + 2 },
  charCount: { fontSize: 11, fontWeight: '500', textAlign: 'right', marginTop: 2 },
  emailInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailText: { fontSize: 15, fontWeight: '500', flex: 1 },
});
