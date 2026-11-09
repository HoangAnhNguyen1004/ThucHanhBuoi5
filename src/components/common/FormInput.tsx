import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';
type Props = TextInputProps & {
  label: string;
  error?: string;
  icon: LucideIcon;
};
export default function FormInput({
  label,
  error,
  icon: Icon,
  secureTextEntry,
  ...props
}: Props) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.focused,
          !!error && styles.invalid,
        ]}
      >
        <Icon size={19} color={focused ? colors.primary : colors.muted} />
        <TextInput
          {...props}
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry && hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
            onPress={() => setHidden(value => !value)}
            hitSlop={10}
          >
            {hidden ? (
              <Eye size={18} color={colors.secondary} />
            ) : (
              <EyeOff size={18} color={colors.secondary} />
            )}
          </Pressable>
        ) : null}
      </View>
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: 7 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    minHeight: 54,
  },
  focused: { borderColor: colors.primary },
  invalid: { borderColor: colors.red },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 13 },
  error: { color: colors.red, fontSize: 12, lineHeight: 17, marginLeft: 2 },
});
