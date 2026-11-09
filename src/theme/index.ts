import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#007AFF',
  primarySoft: '#EAF3FF',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#16171B',
  secondary: '#737984',
  muted: '#A0A5AE',
  border: '#E8EAF0',
  green: '#30B96A',
  greenSoft: '#E9F8EF',
  red: '#E5484D',
  redSoft: '#FFF0F0',
  orange: '#C27C16',
  orangeSoft: '#FFF5DE',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const typography = StyleSheet.create({
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.1,
    color: colors.text,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.text,
  },
  heading: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  subhead: { fontSize: 14, lineHeight: 20, color: colors.secondary },
  caption: { fontSize: 12, lineHeight: 17, color: colors.secondary },
});

export const layout = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
