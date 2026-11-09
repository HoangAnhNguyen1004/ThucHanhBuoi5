import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChatData } from '../context/ChatContext';
import type { RootStackParams } from '../types';
import { colors, typography } from '../theme';
import { formatConversationTime, messagePreview } from '../utils/chat';
import Screen from '../components/common/Screen';
import LoadingView from '../components/common/LoadingView';
import ErrorView from '../components/common/ErrorView';
import EmptyState from '../components/common/EmptyState';
import Avatar from '../components/common/Avatar';

export default function NotificationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { user } = useAuth();
  const data = useChatData();
  const notifications = data.conversations
    .flatMap(conversation =>
      conversation.messages
        .filter(message => message.senderId !== user?.uid)
        .map(message => ({
          message,
          peer: conversation.peer,
          unread: message.id > (conversation.room.reads?.[user!.uid] ?? ''),
        })),
    )
    .sort((a, b) => b.message.createdAt - a.message.createdAt);
  return (
    <Screen
      title="Thông báo"
      subtitle="Cập nhật từ những cuộc trò chuyện của bạn."
    >
      {data.loading ? (
        <LoadingView />
      ) : data.error ? (
        <ErrorView message={data.error} onRetry={data.retry} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.message.id}
          contentContainerStyle={!notifications.length && styles.empty}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('Chat', {
                  peerId: item.peer.uid,
                  peerName: item.peer.displayName,
                })
              }
              style={[styles.row, item.unread && styles.unread]}
            >
              <Avatar
                name={item.peer.displayName}
                seed={item.peer.uid}
                size={44}
              />
              <View style={styles.body}>
                <Text style={styles.title}>
                  {item.peer.displayName}{' '}
                  <Text style={styles.normal}>đã gửi tin nhắn</Text>
                </Text>
                <Text style={typography.subhead} numberOfLines={2}>
                  {messagePreview(item.message)}
                </Text>
                <Text style={typography.caption}>
                  {formatConversationTime(item.message.createdAt)}
                </Text>
              </View>
              {item.unread && <View style={styles.dot} />}
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Bell}
              title="Chưa có thông báo"
              description="Khi có người gửi tin nhắn, thông báo sẽ xuất hiện ở đây."
            />
          }
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  empty: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  unread: { backgroundColor: '#F6FAFF' },
  body: { flex: 1, gap: 5 },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 21,
  },
  normal: { fontWeight: '400' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
