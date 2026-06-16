import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

interface BusinessCardProps {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  image: string;
  verified: boolean;
  isSaved?: boolean;
  onPress?: () => void;
  onSaveToggle?: (id: string) => void;
  style?: ViewStyle;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  id,
  name,
  category,
  rating,
  reviews,
  distance,
  image,
  verified,
  isSaved = false,
  onPress,
  onSaveToggle,
  style,
}) => {
  const { colors } = useTheme();

  const handleSave = () => {
    onSaveToggle?.(id);
  };

  const cardStyle: ViewStyle = { marginBottom: SPACING.lg, overflow: 'hidden', padding: 0 };

  return (
    <Card onPress={onPress} style={[cardStyle, style as ViewStyle]} elevated>
      <View
        style={{
          position: 'relative',
          width: '100%',
          height: 200,
          backgroundColor: colors.surface,
          borderTopLeftRadius: RADIUS.lg,
          borderTopRightRadius: RADIUS.lg,
          overflow: 'hidden',
        }}
      >
        <Image
          source={{ uri: image }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Gradient overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        />

        {/* Verified badge */}
        {verified && (
          <View
            style={{
              position: 'absolute',
              top: SPACING.md,
              left: SPACING.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderRadius: RADIUS.full,
              paddingHorizontal: SPACING.sm,
              paddingVertical: 4,
              backgroundColor: colors.accentGlow,
            }}
          >
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>
              Verified
            </Text>
          </View>
        )}

        {/* Distance chip */}
        <View
          style={{
            position: 'absolute',
            bottom: SPACING.md,
            left: SPACING.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderRadius: RADIUS.full,
            paddingHorizontal: SPACING.md,
            paddingVertical: 4,
            backgroundColor: colors.glassBg,
          }}
        >
          <Ionicons name="location" size={11} color={colors.textSub} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSub }}>
            {distance}
          </Text>
        </View>

        {/* Save button */}
        <View style={{ position: 'absolute', top: SPACING.md, right: SPACING.md }}>
          <TouchableOpacity
            onPress={handleSave}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.shadow,
              opacity: 0.85,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={20}
              color={isSaved ? colors.danger : '#FFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ padding: SPACING.lg, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              lineHeight: 22,
              flex: 1,
              color: colors.text,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '500', lineHeight: 18, color: colors.textSub }}>
          {category}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: SPACING.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={13} color={colors.gold} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
              {rating.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textMuted }}>
              ({reviews})
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};
