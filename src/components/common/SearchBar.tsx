import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '../../theme';
export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Tìm kiếm',
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.bar}>
      <Search size={18} color={colors.secondary} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        autoCorrect={false}
      />
      {!!value && (
        <Pressable
          accessibilityLabel="Xóa tìm kiếm"
          onPress={() => onChangeText('')}
          hitSlop={10}
        >
          <X size={16} color={colors.secondary} />
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#E8EAF0',
    borderRadius: 12,
    minHeight: 42,
    gap: 8,
  },
  input: { flex: 1, paddingVertical: 9, fontSize: 16, color: colors.text },
});
