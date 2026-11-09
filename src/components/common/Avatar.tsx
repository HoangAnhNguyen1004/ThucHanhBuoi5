import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
const palette = [
  ['#E3EFFF', '#3978CD'],
  ['#F0E8FF', '#8B61BC'],
  ['#FFE9E4', '#C77463'],
  ['#E1F2EC', '#4A907C'],
  ['#FFF0CF', '#B88B37'],
];
export default function Avatar({
  name,
  size = 52,
  online,
  seed = name,
}: {
  name: string;
  size?: number;
  online?: boolean;
  seed?: string;
}) {
  const index =
    Array.from(seed).reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0,
    ) % palette.length;
  const [backgroundColor, color] = palette[index];
  const words = name.trim().split(/\s+/);
  const initials = (
    words.length > 1
      ? words[words.length - 2][0] + words[words.length - 1][0]
      : words[0]?.slice(0, 2) || '?'
  ).toUpperCase();
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
          },
        ]}
      >
        <Text style={{ fontSize: size * 0.31, fontWeight: '600', color }}>
          {initials}
        </Text>
      </View>
      {online !== undefined && (
        <View
          accessibilityLabel={online ? 'Đang hoạt động' : 'Ngoại tuyến'}
          style={[
            styles.dot,
            { backgroundColor: online ? colors.green : colors.muted },
          ]}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: colors.surface,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
