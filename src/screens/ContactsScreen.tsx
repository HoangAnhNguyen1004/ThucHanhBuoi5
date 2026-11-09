import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, UsersRound } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChatData } from '../context/ChatContext';
import type { RootStackParams } from '../types';
import { colors, typography } from '../theme';
import { normalizedSearch } from '../utils/chat';
import Screen from '../components/common/Screen';
import SearchBar from '../components/common/SearchBar';
import Avatar from '../components/common/Avatar';
import LoadingView from '../components/common/LoadingView';
import ErrorView from '../components/common/ErrorView';
import EmptyState from '../components/common/EmptyState';
import LastUpdatedText from '../components/common/LastUpdatedText';

export default function ContactsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { user } = useAuth();
  const data = useChatData();
  const [search, setSearch] = useState('');
  const contacts = useMemo(
    () =>
      Object.values(data.profiles)
        .filter(
          profile =>
            profile.uid !== user?.uid &&
            normalizedSearch(profile.displayName).includes(
              normalizedSearch(search),
            ),
        )
        .sort(
          (a, b) =>
            Number(!!data.online[b.uid]) - Number(!!data.online[a.uid]) ||
            a.displayName.localeCompare(b.displayName, 'vi'),
        ),
    [data.profiles, data.online, user?.uid, search],
  );
  const count = Object.keys(data.profiles).filter(
    uid => uid !== user?.uid,
  ).length;
  return (
    <Screen
      title="Danh bạ"
      subtitle={`${count} người bạn · Luôn sẵn sàng kết nối`}
    >
      <View style={styles.search}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm tên người dùng"
        />
      </View>
      {data.loading ? (
        <LoadingView />
      ) : data.error ? (
        <ErrorView message={data.error} onRetry={data.retry} />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => item.uid}
          contentContainerStyle={contacts.length ? styles.list : styles.empty}
          ListHeaderComponent={
            contacts.length ? (
              <Text style={styles.label}>MỌI NGƯỜI</Text>
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityLabel={`Nhắn tin cho ${item.displayName}`}
              onPress={() =>
                navigation.navigate('Chat', {
                  peerId: item.uid,
                  peerName: item.displayName,
                })
              }
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Avatar
                name={item.displayName}
                seed={item.uid}
                online={!!data.online[item.uid]}
              />
              <View style={styles.body}>
                <Text style={typography.heading} numberOfLines={1}>
                  {item.displayName}
                </Text>
                <Text
                  style={[
                    styles.status,
                    data.online[item.uid] && styles.active,
                  ]}
                >
                  {data.online[item.uid] ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={UsersRound}
              title={
                search ? 'Không tìm thấy người dùng' : 'Danh bạ đang chờ bạn bè'
              }
              description={
                search
                  ? 'Thử tìm bằng tên khác. Bạn có thể tìm tên có dấu hoặc không dấu.'
                  : 'Những người đăng ký ứng dụng sẽ xuất hiện ở đây. Hãy mời một người bạn tạo tài khoản.'
              }
              actionLabel={search ? 'Xóa tìm kiếm' : 'Tải lại danh bạ'}
              onAction={() => (search ? setSearch('') : data.retry())}
            />
          }
          ListFooterComponent={
            contacts.length ? (
              <LastUpdatedText timestamp={data.updatedAt} />
            ) : undefined
          }
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  search: { marginHorizontal: 24, marginBottom: 16 },
  list: { paddingBottom: 20 },
  empty: { flexGrow: 1 },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.secondary,
    paddingHorizontal: 26,
    paddingVertical: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.primarySoft },
  body: { flex: 1, gap: 6 },
  status: { fontSize: 12, color: colors.secondary },
  active: { color: colors.green },
});
