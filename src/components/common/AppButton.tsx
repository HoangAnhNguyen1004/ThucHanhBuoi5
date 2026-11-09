import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
};
export default function AppButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  const filled = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        filled ? styles.primary : styles.secondary,
        variant === 'danger' && styles.danger,
        (pressed || disabled || loading) && styles.faded,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={filled ? colors.surface : colors.primary} />
      ) : null}
      <Text
        style={[
          styles.label,
          {
            color: filled
              ? colors.surface
              : variant === 'danger'
              ? colors.red
              : colors.primary,
          },
        ]}
      >
        {loading ? 'Đang xử lý…' : title}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  danger: { backgroundColor: colors.redSoft },
  label: { fontSize: 16, fontWeight: '600' },
  faded: { opacity: 0.55 },
});
