import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

const CATEGORIES = ['Restaurant', 'Cafe', 'Hotel', 'Clinic', 'Pharmacy', 'Bank', 'Shop', 'School', 'Fuel Stn'];

export const AddPlaceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Place</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Step {step} of 4</Text>
        </View>
        <Text style={[styles.headerStep, { color: colors.primary }]}>{step}/4</Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / 4) * 100}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>What's the place called?</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="business-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Business name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Select a category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.catItem,
                    {
                      backgroundColor: category === cat ? colors.primaryGlow : colors.card,
                      borderColor: category === cat ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.catText, { color: category === cat ? colors.primary : colors.textSub }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Contact & Description</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={18} color={colors.textMuted} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Phone number (optional)" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
            <View style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput style={[styles.textAreaInput, { color: colors.text }]} placeholder="Brief description" placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Almost done!</Text>
            <Text style={[styles.stepDesc, { color: colors.textSub }]}>
              Add a photo to help people recognize this place.
            </Text>
            <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.photoBtnText, { color: colors.textMuted }]}>Tap to add photo</Text>
            </TouchableOpacity>
            <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.reviewTitle, { color: colors.text }]}>Summary</Text>
              <Text style={[styles.reviewLine, { color: colors.textSub }]}>📍 {name || 'Business Name'}</Text>
              <Text style={[styles.reviewLine, { color: colors.textSub }]}>📂 {category || 'Category'}</Text>
              {phone && <Text style={[styles.reviewLine, { color: colors.textSub }]}>📞 {phone}</Text>}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + SPACING.lg }]}>
        <View style={styles.footerRow}>
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(step - 1)} style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.footerBtnText, { color: colors.textSub }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => step < 4 ? setStep(step + 1) : router.back()}
            style={[styles.footerBtn, styles.footerPrimary, { backgroundColor: colors.primary, marginLeft: step === 1 ? 0 : SPACING.sm }]}
          >
            <Text style={styles.footerPrimaryText}>{step === 4 ? 'Submit Place' : 'Continue'}</Text>
            {step < 4 && <Ionicons name="arrow-forward" size={16} color="#FFF" />}
          </TouchableOpacity>
        </View>
        <Text style={[styles.earnNote, { color: colors.accent }]}>Earn +50 points for adding a new place!</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  headerStep: { fontSize: 16, fontWeight: '800' },
  progressTrack: { height: 4, marginHorizontal: SPACING.xl, borderRadius: 2, marginBottom: SPACING.xl },
  progressFill: { height: 4, borderRadius: 2 },
  content: { paddingHorizontal: SPACING.xl, flexGrow: 1 },
  stepContent: { flex: 1, paddingTop: SPACING.xl },
  stepTitle: { fontSize: 20, fontWeight: '700', marginBottom: SPACING.lg },
  stepDesc: { fontSize: 14, fontWeight: '500', marginBottom: SPACING.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, borderWidth: 1 },
  input: { flex: 1, paddingVertical: SPACING.md + 2, fontSize: 15, fontWeight: '500' },
  textArea: { borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, marginTop: SPACING.md },
  textAreaInput: { fontSize: 15, fontWeight: '500', minHeight: 100 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  catItem: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderWidth: 1 },
  catText: { fontSize: 14, fontWeight: '600' },
  photoBtn: { borderRadius: RADIUS.xl, borderWidth: 1, borderStyle: 'dashed', paddingVertical: SPACING.huge, alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xl },
  photoBtnText: { fontSize: 13, fontWeight: '500' },
  reviewCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, gap: SPACING.sm },
  reviewTitle: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.xs },
  reviewLine: { fontSize: 14, fontWeight: '500' },
  footer: { borderTopWidth: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  footerRow: { flexDirection: 'row' },
  footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, borderWidth: 1 },
  footerPrimary: { borderWidth: 0 },
  footerBtnText: { fontSize: 14, fontWeight: '700' },
  footerPrimaryText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  earnNote: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: SPACING.md },
});
