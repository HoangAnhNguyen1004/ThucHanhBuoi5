import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../theme';
export default function LoadingView({
  message = 'Đang tải…',
}: {
  message?: string;
}) {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={typography.subhead}>{message}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
});
