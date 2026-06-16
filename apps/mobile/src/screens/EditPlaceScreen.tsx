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
import { useTheme, SPACING, RADIUS } from '../theme/colors';

const ISSUE_TYPES = [
  { icon: '📞', label: 'Wrong Phone Number', desc: 'The phone number is incorrect or out of date' },
  { icon: '📍', label: 'Wrong Address', desc: 'The location or address is not right' },
  { icon: '🕐', label: 'Wrong Hours', desc: 'The opening hours are incorrect' },
  { icon: '📋', label: 'Duplicate Listing', desc: 'This place already exists in the database' },
  { icon: '🚫', label: 'Place Closed', desc: 'This business has permanently closed' },
  { icon: '📷', label: 'Wrong Photo', desc: 'The photo doesn\'t match this business' },
];

export const EditPlaceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedIssue, setSelectedIssue] = useState('');
  const [details, setDetails] = useState('');

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Suggest Edit</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[styles.mainDesc, { color: colors.textSub }]}>
          Help us keep business information accurate. Select what needs to be fixed.
        </Text>

        <View style={styles.issuesGrid}>
          {ISSUE_TYPES.map((issue, i) => {
            const isSelected = selectedIssue === issue.label;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedIssue(issue.label)}
                style={[
                  styles.issueCard,
                  {
                    backgroundColor: isSelected ? colors.primaryGlow : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.issueIcon}>{issue.icon}</Text>
                <View style={styles.issueInfo}>
                  <Text style={[styles.issueLabel, { color: isSelected ? colors.primary : colors.text }]}>
                    {issue.label}
                  </Text>
                  <Text style={[styles.issueDesc, { color: colors.textMuted }]}>{issue.desc}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedIssue ? (
          <View style={[styles.detailsWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.detailsLabel, { color: colors.text }]}>Tell us more</Text>
            <TextInput
              style={[styles.detailsInput, { color: colors.text }]}
              placeholder="Describe what's wrong and what the correct info should be..."
              placeholderTextColor={colors.textMuted}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => {
                if (!details.trim()) {
                  Alert.alert('Details required', 'Please describe what needs to be fixed.');
                  return;
                }
                Alert.alert('Thank you!', 'Your suggestion has been submitted for review. You earned +5 points!', [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              }}
            >
              <Ionicons name="send" size={16} color="#FFF" />
              <Text style={styles.submitBtnText}>Submit Suggestion</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: SPACING.huge + SPACING.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm },
  mainDesc: { fontSize: 14, fontWeight: '500', lineHeight: 22, marginBottom: SPACING.xl },
  issuesGrid: { gap: SPACING.md, marginBottom: SPACING.xl },
  issueCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1 },
  issueIcon: { fontSize: 24 },
  issueInfo: { flex: 1 },
  issueLabel: { fontSize: 14, fontWeight: '700' },
  issueDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  detailsWrap: { borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, gap: SPACING.md },
  detailsLabel: { fontSize: 15, fontWeight: '700' },
  detailsInput: { fontSize: 14, fontWeight: '500', minHeight: 100, lineHeight: 20 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderRadius: RADIUS.lg, paddingVertical: SPACING.md },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
