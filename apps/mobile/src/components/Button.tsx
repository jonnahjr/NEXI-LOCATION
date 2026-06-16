import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme, SPACING, RADIUS } from '../theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const SIZE_DIMENSIONS = {
  sm: { py: SPACING.sm, px: SPACING.lg, fontSize: 12, iconGap: 4 },
  md: { py: SPACING.md, px: SPACING.xl, fontSize: 14, iconGap: 6 },
  lg: { py: SPACING.lg, px: SPACING.xxl, fontSize: 16, iconGap: 8 },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  icon,
  fullWidth = false,
}) => {
  const { colors } = useTheme();

  const dim = SIZE_DIMENSIONS[size];

  const getStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: colors.accent,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: colors.primaryGlow,
          borderWidth: 0,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
          borderWidth: 0,
        };
    }
  };

  const textColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <View style={fullWidth ? { width: '100%' } : undefined}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.button,
          getStyle(),
          {
            paddingVertical: dim.py,
            paddingHorizontal: dim.px,
            opacity: disabled ? 0.4 : 1,
            borderRadius: variant === 'ghost' ? RADIUS.md : RADIUS.lg,
          },
          style,
        ]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={textColor()} size="small" />
        ) : (
          <>
            {icon && <>{icon}</>}
            <Text
              style={[
                styles.text,
                {
                  color: textColor(),
                  fontSize: dim.fontSize,
                  marginLeft: icon ? dim.iconGap : 0,
                },
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
