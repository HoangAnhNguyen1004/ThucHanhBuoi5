import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageCircle, type LucideIcon } from 'lucide-react-native';
import { colors, typography } from '../../theme';
import AppButton from './AppButton';
type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
};
export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = MessageCircle,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Icon size={34} color={colors.primary} strokeWidth={1.6} />
      </View>
      <Text style={[typography.title, styles.text]}>{title}</Text>
      <Text style={[typography.subhead, styles.description]}>
        {description}
      </Text>
      {onAction && actionLabel ? (
        <AppButton title={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  icon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  text: { textAlign: 'center' },
  description: { textAlign: 'center', maxWidth: 290, marginBottom: 8 },
});
