import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { colors, typography } from '../../theme';
import AppButton from './AppButton';
export default function ErrorView({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, !compact && styles.full]}
    >
      <View style={styles.icon}>
        <CircleAlert size={26} color={colors.red} />
      </View>
      {!compact && <Text style={typography.heading}>Chưa thể hoàn tất</Text>}
      <Text style={[typography.subhead, styles.message]}>{message}</Text>
      <AppButton title="Thử lại" onPress={onRetry} variant="secondary" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', gap: 12 },
  full: { flex: 1, justifyContent: 'center', minHeight: 200 },
  icon: { padding: 12, backgroundColor: colors.redSoft, borderRadius: 20 },
  message: { textAlign: 'center', maxWidth: 340 },
});
