import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { formatTime } from '../../utils/chat';
import { typography } from '../../theme';
export default function LastUpdatedText({ timestamp }: { timestamp?: number }) {
  if (!timestamp) {
    return null;
  }
  return (
    <Text style={[typography.caption, styles.text]}>
      Cập nhật lúc {formatTime(timestamp)}
    </Text>
  );
}
const styles = StyleSheet.create({
  text: { textAlign: 'center', padding: 16 },
});
