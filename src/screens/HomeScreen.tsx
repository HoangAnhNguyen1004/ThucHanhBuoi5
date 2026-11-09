import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CheckCheck, MessageCircle, SquarePen } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChatData } from '../context/ChatContext';
import type { Profile, RootStackParams, TabParams } from '../types';
import { colors, layout, typography } from '../theme';
import {
  formatConversationTime,
  messagePreview,
  normalizedSearch,
} from '../utils/chat';
import Screen from '../components/common/Screen';
import SearchBar from '../components/common/SearchBar';
import Avatar from '../components/common/Avatar';
import LoadingView from '../components/common/LoadingView';
import ErrorView from '../components/common/ErrorView';
import EmptyState from '../components/common/EmptyState';
import LastUpdatedText from '../components/common/LastUpdatedText';

export default function HomeScreen({
  navigation: tabs,
}: BottomTabScreenProps<TabParams, 'Home'>) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { user } = useAuth();
  const data = useChatData();
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const conversations = useMemo(
    () =>
      data.conversations.filter(
        item =>
          (!unreadOnly || item.unread > 0) &&
          normalizedSearch(item.peer.displayName).includes(
            normalizedSearch(search),
          ),
      ),
    [data.conversations, search, unreadOnly],
  );
  const activePeople = Object.values(data.profiles).filter(
    profile => profile.uid !== user?.uid && data.online[profile.uid],
  );
  const open = (peer: Profile) =>
    navigation.navigate('Chat', {
      peerId: peer.uid,
      peerName: peer.displayName,
    });
  return (
    <Screen
      title="Tin nhắn"
      subtitle="Những câu chuyện luôn ở đây."
      actionIcon={SquarePen}
      actionLabel="Cuộc trò chuyện mới"
      onAction={() => tabs.navigate('Contacts')}
    >
      <View style={styles.search}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm cuộc trò chuyện"
        />
      </View>
      {data.loading ? (
        <LoadingView />
      ) : data.error ? (
        <ErrorView message={data.error} onRetry={data.retry} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.room.id}
          contentContainerStyle={
            conversations.length ? styles.list : styles.emptyList
          }
          ListHeaderComponent={
            <View>
              {activePeople.length > 0 && !search && (
                <View style={styles.onlineSection}>
                  <View style={styles.sectionTitle}>
                    <Text style={styles.sectionLabel}>ĐANG HOẠT ĐỘNG</Text>
                    <View style={styles.onlineCount}>
                      <View style={styles.tinyDot} />
                      <Text style={styles.onlineCountText}>
                        {activePeople.length} online
                      </Text>
                    </View>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.people}
                  >
                    {activePeople.map(peer => (
                      <Pressable
                        key={peer.uid}
                        accessibilityLabel={`Chat với ${peer.displayName}`}
                        style={styles.person}
                        onPress={() => open(peer)}
                      >
                        <Avatar
                          name={peer.displayName}
                          seed={peer.uid}
                          size={56}
                          online
                        />
                        <Text numberOfLines={1} style={styles.personName}>
                          {peer.displayName.split(' ').slice(-1)[0]}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={styles.filters}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: !unreadOnly }}
                  onPress={() => setUnreadOnly(false)}
                  style={[styles.filter, !unreadOnly && styles.selectedFilter]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      !unreadOnly && styles.selectedText,
                    ]}
                  >
                    Tất cả
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: unreadOnly }}
                  onPress={() => setUnreadOnly(true)}
                  style={[styles.filter, unreadOnly && styles.selectedFilter]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      unreadOnly && styles.selectedText,
                    ]}
                  >
                    Chưa đọc{data.unread ? `  ${data.unread}` : ''}
                  </Text>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item.peer)}
              style={({ pressed }) => [
                styles.conversation,
                pressed && styles.pressed,
              ]}
              accessibilityLabel={`${item.peer.displayName}, ${item.unread} tin chưa đọc`}
            >
              <Avatar
                name={item.peer.displayName}
                seed={item.peer.uid}
                online={!!data.online[item.peer.uid]}
              />
              <View style={styles.conversationBody}>
                <View style={layout.row}>
                  <Text
                    numberOfLines={1}
                    style={[typography.heading, styles.name]}
                  >
                    {item.peer.displayName}
                  </Text>
                  <Text
                    style={[styles.time, item.unread > 0 && styles.unreadTime]}
                  >
                    {formatConversationTime(item.lastMessage.createdAt)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  {item.lastMessage.senderId === user?.uid && (
                    <CheckCheck size={15} color={colors.muted} />
                  )}
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.preview,
                      item.unread > 0 && styles.unreadPreview,
                    ]}
                  >
                    {item.lastMessage.senderId === user?.uid ? 'Bạn: ' : ''}
                    {messagePreview(item.lastMessage)}
                  </Text>
                  {item.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.unread > 99 ? '99+' : item.unread}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={MessageCircle}
              title={
                search
                  ? 'Không tìm thấy cuộc trò chuyện'
                  : unreadOnly
                  ? 'Bạn đã đọc hết rồi'
                  : 'Bắt đầu bằng một lời chào'
              }
              description={
                search
                  ? 'Thử tìm bằng tên khác hoặc xóa nội dung tìm kiếm.'
                  : unreadOnly
                  ? 'Những tin nhắn mới sẽ xuất hiện ở đây.'
                  : 'Chọn một người trong danh bạ và gửi tin nhắn đầu tiên nhé.'
              }
              actionLabel={search || unreadOnly ? 'Xem tất cả' : 'Mở danh bạ'}
              onAction={() => {
                if (search || unreadOnly) {
                  setSearch('');
                  setUnreadOnly(false);
                } else {
                  tabs.navigate('Contacts');
                }
              }}
            />
          }
          ListFooterComponent={
            conversations.length ? (
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
  list: { paddingBottom: 16 },
  emptyList: { flexGrow: 1 },
  onlineSection: { paddingTop: 5, paddingBottom: 14 },
  sectionTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '600',
    color: colors.secondary,
  },
  onlineCount: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tinyDot: {
    height: 5,
    width: 5,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  onlineCountText: { fontSize: 10, color: colors.green },
  people: { paddingHorizontal: 24, gap: 21 },
  person: { width: 58, alignItems: 'center', gap: 8 },
  personName: { fontSize: 12, color: colors.secondary },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 4,
  },
  filter: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18 },
  selectedFilter: { backgroundColor: colors.primarySoft },
  filterText: { color: colors.secondary, fontSize: 13, fontWeight: '500' },
  selectedText: { color: colors.primary, fontWeight: '600' },
  conversation: {
    flexDirection: 'row',
    paddingLeft: 24,
    paddingRight: 22,
    paddingVertical: 17,
    gap: 13,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.primarySoft },
  conversationBody: { flex: 1, justifyContent: 'center', gap: 7 },
  name: { flex: 1, marginRight: 8, fontSize: 16 },
  time: { fontSize: 11, color: colors.muted },
  unreadTime: { color: colors.primary },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 21,
  },
  preview: { flex: 1, color: colors.secondary, fontSize: 13 },
  unreadPreview: { color: colors.text, fontWeight: '500' },
  badge: {
    minWidth: 21,
    paddingHorizontal: 5,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
});
