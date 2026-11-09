import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { colors } from '../../theme';
export default function OfflineBanner({
  visible,
  connecting = false,
}: {
  visible: boolean;
  connecting?: boolean;
}) {
  if (!visible) {
    return null;
  }
  return (
    <View accessibilityLiveRegion="polite" style={styles.banner}>
      <WifiOff size={15} color={colors.orange} />
      <Text style={styles.text}>
        {connecting
          ? 'Đang kết nối lại với máy chủ…'
          : 'Bạn đang ngoại tuyến. Hãy kiểm tra kết nối Internet.'}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.orangeSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  text: { flex: 1, fontSize: 12, color: colors.orange, lineHeight: 18 },
});
