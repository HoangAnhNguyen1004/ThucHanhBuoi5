import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../../theme';
export default function SyncBadge({
  pending = false,
  offline = false,
}: {
  pending?: boolean;
  offline?: boolean;
}) {
  return (
    <View style={[styles.badge, (pending || offline) && styles.pending]}>
      {pending ? (
        <ActivityIndicator size="small" color={colors.orange} />
      ) : (
        <Check size={12} color={offline ? colors.orange : colors.green} />
      )}
      <Text style={[styles.text, (pending || offline) && styles.pendingText]}>
        {offline ? 'Chưa kết nối' : pending ? 'Đang gửi…' : 'Đã đồng bộ'}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.greenSoft,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  pending: { backgroundColor: colors.orangeSoft },
  text: { fontSize: 10, color: colors.green, fontWeight: '500' },
  pendingText: { color: colors.orange },
});
