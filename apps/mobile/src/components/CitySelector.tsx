// ═══════════════════════════════════════════════════════════════════════════
// CitySelector — Modal city picker with search
// Used by: ProfileScreen, SettingsScreen
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, SPACING, RADIUS } from '../theme/colors';
import { useAppStore } from '../store/appStore';

// ── Ethiopian cities data ─────────────────────────────────────────────────
export const ETHIOPIAN_CITIES = [
  { id: 'addis_ababa',  name: 'Addis Ababa',  emoji: '🏙️', population: '5.0M', region: 'Addis Ababa City' },
  { id: 'dire_dawa',    name: 'Dire Dawa',    emoji: '🌆', population: '440K', region: 'Dire Dawa City' },
  { id: 'mekelle',      name: 'Mekelle',      emoji: '🏔️', population: '323K', region: 'Tigray' },
  { id: 'gondar',       name: 'Gondar',       emoji: '🏰', population: '323K', region: 'Amhara' },
  { id: 'hawassa',      name: 'Hawassa',      emoji: '🌊', population: '258K', region: 'Sidama' },
  { id: 'bahir_dar',    name: 'Bahir Dar',    emoji: '🌅', population: '248K', region: 'Amhara' },
  { id: 'dessie',       name: 'Dessie',       emoji: '🏘️', population: '220K', region: 'Amhara' },
  { id: 'jimma',        name: 'Jimma',        emoji: '☕', population: '206K', region: 'Oromia' },
  { id: 'adama',        name: 'Adama (Nazret)', emoji: '🌿', population: '202K', region: 'Oromia' },
  { id: 'bishoftu',     name: 'Bishoftu',     emoji: '🦅', population: '100K', region: 'Oromia' },
  { id: 'shashamane',   name: 'Shashamane',   emoji: '🌾', population: '100K', region: 'Oromia' },
  { id: 'arba_minch',   name: 'Arba Minch',   emoji: '🌴', population: '90K',  region: 'SNNPR' },
  { id: 'harar',        name: 'Harar',        emoji: '🕌', population: '99K',  region: 'Harari' },
  { id: 'dilla',        name: 'Dilla',        emoji: '🌿', population: '80K',  region: 'SNNPR' },
  { id: 'nekemte',      name: 'Nekemte',      emoji: '🏡', population: '76K',  region: 'Oromia' },
];

// ── Props ─────────────────────────────────────────────────────────────────
interface CitySelectorProps {
  visible: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────
export default function CitySelector({ visible, onClose }: CitySelectorProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const selectedCity = useAppStore(s => s.selectedCity);
  const setSelectedCity = useAppStore(s => s.setSelectedCity);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return ETHIOPIAN_CITIES;
    const q = search.toLowerCase();
    return ETHIOPIAN_CITIES.filter(
      c => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q),
    );
  }, [search]);

  const handleSelect = (cityName: string) => {
    setSelectedCity(cityName);
    setSearch('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top + 8 }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Choose City</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textSub} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSub} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search cities..."
            placeholderTextColor={colors.textSub}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSub} />
            </TouchableOpacity>
          )}
        </View>

        {/* City List */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {filtered.map(city => {
            const isSelected = selectedCity === city.name;
            return (
              <Pressable
                key={city.id}
                onPress={() => handleSelect(city.name)}
                style={({ pressed }) => [
                  styles.cityRow,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + '15'
                      : pressed
                      ? colors.card
                      : 'transparent',
                    borderColor: isSelected ? colors.primary + '40' : colors.border,
                  },
                ]}
              >
                <Text style={styles.cityEmoji}>{city.emoji}</Text>
                <View style={styles.cityInfo}>
                  <Text style={[styles.cityName, {
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? '800' : '600',
                  }]}>
                    {city.name}
                  </Text>
                  <Text style={[styles.cityMeta, { color: colors.textSub }]}>
                    {city.region} · {city.population}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </Pressable>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
              <Text style={[styles.emptyText, { color: colors.textSub }]}>
                No cities match "{search}"
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  closeBtn: {
    padding: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  list: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 8,
    gap: 14,
  },
  cityEmoji: {
    fontSize: 26,
    width: 36,
    textAlign: 'center',
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    marginBottom: 2,
  },
  cityMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
