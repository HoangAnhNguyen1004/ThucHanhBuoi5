import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  LogOut,
  Mail,
  Radio,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChatData } from '../context/ChatContext';
import { colors, layout, typography } from '../theme';
import { errorMessage } from '../services/errors';
import Screen from '../components/common/Screen';
import Avatar from '../components/common/Avatar';
import AppButton from '../components/common/AppButton';
import ErrorView from '../components/common/ErrorView';
import SyncBadge from '../components/common/SyncBadge';

export default function SettingsScreen() {
  const { user } = useAuth();
  const data = useChatData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const profile = user && data.profiles[user.uid];
  const logout = async () => {
    setBusy(true);
    setError('');
    try {
      await data.logout();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };
  const confirmLogout = () =>
    Alert.alert('Đăng xuất?', 'Bạn có thể đăng nhập lại bất cứ lúc nào.', [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  return (
    <Screen title="Cài đặt" subtitle="Một chút riêng tư, một chút của bạn.">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[layout.card, styles.profile]}>
          <Avatar
            name={profile?.displayName || user?.displayName || 'Bạn'}
            seed={user?.uid}
            size={76}
          />
          <Text style={typography.title}>
            {profile?.displayName || user?.displayName || 'Tài khoản của bạn'}
          </Text>
          <Text style={typography.subhead}>{user?.email}</Text>
          <SyncBadge offline={!data.connected} />
        </View>
        <Text style={styles.sectionLabel}>TÀI KHOẢN & KẾT NỐI</Text>
        <View style={layout.card}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Mail color={colors.primary} size={19} />
            </View>
            <Text style={styles.rowLabel}>Đăng nhập bằng email</Text>
            <ShieldCheck size={18} color={colors.green} />
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.greenIcon}>
              <Radio color={colors.green} size={19} />
            </View>
            <Text style={styles.rowLabel}>Kết nối realtime</Text>
            <Text style={[styles.value, data.connected && styles.greenText]}>
              {data.connected ? 'Đã kết nối' : 'Đang kết nối'}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.icon}>
              <LockKeyhole color={colors.primary} size={19} />
            </View>
            <Text style={styles.rowLabel}>Quyền riêng tư</Text>
            <Text style={styles.value}>Chat 1–1</Text>
          </View>
        </View>
        <View style={styles.note}>
          <CircleHelp size={17} color={colors.secondary} />
          <Text style={[typography.caption, styles.noteText]}>
            Chỉ bạn và người nhận có quyền truy cập nội dung cuộc trò chuyện. Vị
            trí chỉ được chia sẻ khi bạn nhấn gửi.
          </Text>
        </View>
        {!!data.error && (
          <ErrorView compact message={data.error} onRetry={data.retry} />
        )}
        {!!error && <ErrorView compact message={error} onRetry={logout} />}
        <View style={styles.logout}>
          <LogOut size={20} color={colors.red} />
          <AppButton
            title="Đăng xuất"
            onPress={confirmLogout}
            loading={busy}
            variant="danger"
            style={styles.logoutButton}
          />
          <ChevronRight size={16} color={colors.red} />
        </View>
        <Text style={styles.footer}>
          HELLO CHAT · BÀI THỰC HÀNH 05{'\n'}Được kết nối bằng Firebase
        </Text>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 6, paddingBottom: 40 },
  profile: { alignItems: 'center', padding: 26, gap: 11 },
  sectionLabel: {
    color: colors.secondary,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '600',
    marginTop: 28,
    marginBottom: 12,
    marginLeft: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, color: colors.text },
  value: { fontSize: 11, color: colors.secondary },
  greenText: { color: colors.green },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 62,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginVertical: 17,
    paddingHorizontal: 6,
  },
  noteText: { flex: 1, lineHeight: 19 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redSoft,
    borderRadius: 15,
    paddingHorizontal: 17,
    marginTop: 8,
  },
  logoutButton: { flex: 1 },
  footer: {
    color: colors.muted,
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 20,
    marginTop: 28,
  },
});
