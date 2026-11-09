import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LucideIcon } from 'lucide-react-native';
import { useChatData } from '../../context/ChatContext';
import { colors, layout, typography } from '../../theme';
import OfflineBanner from './OfflineBanner';
export default function Screen({
  title,
  subtitle,
  children,
  actionIcon: Icon,
  onAction,
  actionLabel,
}: React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  actionLabel?: string;
}>) {
  const { connected, offline } = useChatData();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={layout.screen}>
      <OfflineBanner visible={!connected || offline} connecting={!offline} />
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={typography.largeTitle}>{title}</Text>
          {subtitle ? <Text style={typography.subhead}>{subtitle}</Text> : null}
        </View>
        {Icon && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
            style={styles.action}
          >
            <Icon size={23} color={colors.primary} strokeWidth={1.8} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titles: { flex: 1, gap: 6 },
  action: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
