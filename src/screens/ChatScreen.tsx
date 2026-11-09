import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ArrowUp,
  CheckCheck,
  ExternalLink,
  MapPin,
  MessageCircle,
  Navigation,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChatData } from '../context/ChatContext';
import type { ChatMessage, Room, RootStackParams } from '../types';
import { ensureRoom, markRead, sendMessage, watchRoom } from '../services/chat';
import { getCurrentLocation } from '../services/location';
import { errorMessage } from '../services/errors';
import { formatDay, formatTime, roomIdFor, roomMessages } from '../utils/chat';
import { colors, layout, typography } from '../theme';
import Avatar from '../components/common/Avatar';
import LoadingView from '../components/common/LoadingView';
import ErrorView from '../components/common/ErrorView';
import EmptyState from '../components/common/EmptyState';
import OfflineBanner from '../components/common/OfflineBanner';
import SyncBadge from '../components/common/SyncBadge';

export default function ChatScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParams, 'Chat'>) {
  const { user } = useAuth();
  const data = useChatData();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { peerId, peerName } = route.params;
  const roomId = roomIdFor(user!.uid, peerId);
  const name = data.profiles[peerId]?.displayName ?? peerName;
  const online = !!data.online[peerId];
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [version, setVersion] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState<'text' | 'location' | null>(null);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const retryAction = useRef<() => void>(() => {});
  const list = useRef<FlatList<ChatMessage>>(null);
  const scrollFrame = useRef<number | undefined>(undefined);
  const scrollToLatest = useCallback((animated = true) => {
    if (scrollFrame.current !== undefined) {
      cancelAnimationFrame(scrollFrame.current);
    }
    scrollFrame.current = requestAnimationFrame(() => {
      // Inverted chat lists anchor the newest message at offset zero, including tall location cards.
      list.current?.scrollToOffset({ offset: 0, animated });
    });
  }, []);
  useEffect(
    () => () => {
      if (scrollFrame.current !== undefined) {
        cancelAnimationFrame(scrollFrame.current);
      }
    },
    [],
  );
  const messages = roomMessages(room);
  const latestFirst = [...messages].reverse();
  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setActive(state === 'active'),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!data.connected) {
      setLoading(false);
      return;
    }
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    setError('');
    ensureRoom(user!.uid, peerId)
      .then(() => {
        if (disposed) {
          return;
        }
        unsubscribe = watchRoom(
          roomId,
          value => {
            setRoom(value);
            setLoading(false);
          },
          failure => {
            setError(errorMessage(failure));
            setLoading(false);
          },
        );
      })
      .catch(failure => {
        if (!disposed) {
          setError(errorMessage(failure));
          setLoading(false);
        }
      });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [user, peerId, roomId, data.connected, version]);
  useEffect(() => {
    if (!lastId || !focused || !active || !data.connected || !user) {
      return;
    }
    if ((room?.reads?.[user.uid] ?? '') >= lastId) {
      return;
    }
    let disposed = false;
    markRead(roomId, user.uid, lastId).catch(failure => {
      if (!disposed) {
        setActionError(errorMessage(failure));
        retryAction.current = () => {
          setActionError('');
          setVersion(value => value + 1);
        };
      }
    });
    return () => {
      disposed = true;
    };
  }, [
    lastId,
    focused,
    active,
    roomId,
    user,
    data.connected,
    room?.reads,
    version,
  ]);

  const sendText = async () => {
    if (!text.trim() || sending) {
      return;
    }
    if (!data.connected || !room) {
      setActionError(
        'Chưa kết nối với máy chủ. Vui lòng đợi kết nối rồi gửi lại.',
      );
      return;
    }
    setSending('text');
    setActionError('');
    try {
      await sendMessage(roomId, user!.uid, { type: 'text', text });
      setText('');
    } catch (failure) {
      setActionError(errorMessage(failure));
      retryAction.current = () => {
        void sendText();
      };
    } finally {
      setSending(null);
    }
  };
  const sendLocation = async () => {
    if (sending) {
      return;
    }
    if (!data.connected || !room) {
      setActionError(
        'Chưa kết nối với máy chủ. Vui lòng đợi kết nối rồi gửi lại.',
      );
      return;
    }
    setSending('location');
    setActionError('');
    try {
      const location = await getCurrentLocation();
      await sendMessage(roomId, user!.uid, { type: 'location', ...location });
    } catch (failure) {
      setActionError(errorMessage(failure));
      retryAction.current = () => {
        void sendLocation();
      };
    } finally {
      setSending(null);
    }
  };
  const openLocation = (message: ChatMessage) => {
    void Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${message.latitude},${message.longitude}`,
    ).catch(() => {
      setActionError(
        'Không mở được bản đồ. Hãy kiểm tra ứng dụng trình duyệt.',
      );
      retryAction.current = () => openLocation(message);
    });
  };
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={layout.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Quay lại"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <ArrowLeft color={colors.primary} size={25} />
        </Pressable>
        <Avatar name={name} seed={peerId} online={online} size={40} />
        <View style={styles.headerBody}>
          <Text numberOfLines={1} style={typography.heading}>
            {name}
          </Text>
          <View style={layout.row}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: online ? colors.green : colors.muted },
              ]}
            />
            <Text style={[styles.statusText, online && styles.onlineText]}>
              {online ? 'Đang hoạt động' : 'Ngoại tuyến'}
            </Text>
          </View>
        </View>
        <MessageCircle size={22} color={colors.primary} strokeWidth={1.6} />
      </View>
      <OfflineBanner
        visible={!data.connected || data.offline}
        connecting={!data.offline}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView
            message={error}
            onRetry={() => setVersion(value => value + 1)}
          />
        ) : (
          <FlatList
            ref={list}
            data={latestFirst}
            inverted
            keyExtractor={item => item.id}
            style={styles.flex}
            contentContainerStyle={
              messages.length ? styles.messages : styles.empty
            }
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => scrollToLatest()}
            onLayout={() => scrollToLatest(false)}
            ListFooterComponent={
              messages.length ? (
                <Text style={styles.startText}>
                  Cuộc trò chuyện riêng giữa bạn và người ấy.
                </Text>
              ) : undefined
            }
            ListEmptyComponent={
              <EmptyState
                title={`Chào ${name.split(' ').slice(-1)[0]} 👋`}
                description="Một tin nhắn nhỏ có thể bắt đầu một câu chuyện thật hay."
              />
            }
            renderItem={({ item, index }) => {
              const mine = item.senderId === user?.uid;
              const previousMessage = latestFirst[index + 1];
              const newDay =
                !previousMessage ||
                new Date(item.createdAt).toDateString() !==
                  new Date(previousMessage.createdAt).toDateString();
              const read = mine && (room?.reads?.[peerId] ?? '') >= item.id;
              return (
                <View>
                  {newDay && (
                    <Text style={styles.day}>{formatDay(item.createdAt)}</Text>
                  )}
                  <View style={[styles.messageRow, mine && styles.myRow]}>
                    {!mine && <Avatar name={name} seed={peerId} size={28} />}
                    <View style={styles.messageColumn}>
                      <View
                        style={[
                          styles.bubble,
                          mine ? styles.myBubble : styles.theirBubble,
                          item.type === 'location' && styles.locationBubble,
                        ]}
                      >
                        {item.type === 'location' ? (
                          <Pressable
                            accessibilityLabel="Mở vị trí trong bản đồ"
                            onPress={() => openLocation(item)}
                          >
                            <View style={styles.mapPreview}>
                              <View style={styles.mapRoadOne} />
                              <View style={styles.mapRoadTwo} />
                              <View style={styles.mapPark} />
                              <View style={styles.pin}>
                                <MapPin
                                  color="white"
                                  fill={colors.primary}
                                  size={33}
                                  strokeWidth={1.8}
                                />
                              </View>
                              <View style={styles.mapLabel}>
                                <Navigation size={11} color={colors.primary} />
                                <Text style={styles.mapLabelText}>
                                  VỊ TRÍ ĐƯỢC CHIA SẺ
                                </Text>
                              </View>
                            </View>
                            <View style={styles.locationInfo}>
                              <View style={styles.flex}>
                                <Text style={styles.locationTitle}>
                                  Vị trí hiện tại
                                </Text>
                                <Text style={styles.coordinates}>
                                  {item.latitude?.toFixed(5)},{' '}
                                  {item.longitude?.toFixed(5)}
                                </Text>
                              </View>
                              <ExternalLink size={16} color={colors.primary} />
                            </View>
                            <Text style={styles.openMap}>
                              Chạm để mở bản đồ
                            </Text>
                          </Pressable>
                        ) : (
                          <Text
                            style={[styles.messageText, mine && styles.myText]}
                          >
                            {item.text}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.messageMeta, mine && styles.myMeta]}>
                        <Text style={styles.messageTime}>
                          {formatTime(item.createdAt)}
                        </Text>
                        {mine && (
                          <>
                            <CheckCheck
                              size={12}
                              color={read ? colors.primary : colors.muted}
                            />
                            <Text style={styles.messageTime}>
                              {sending && item.id === lastId
                                ? 'Đang gửi'
                                : read
                                ? 'Đã đọc'
                                : 'Đã gửi'}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
        {!!actionError && (
          <ErrorView
            compact
            message={actionError}
            onRetry={() => retryAction.current()}
          />
        )}
        {sending && (
          <View style={styles.sync}>
            <SyncBadge pending />
          </View>
        )}
        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi vị trí hiện tại"
            disabled={!!sending || !data.connected || !room}
            onPress={() => {
              void sendLocation();
            }}
            style={[
              styles.locationButton,
              (!!sending || !data.connected || !room) && styles.disabled,
            ]}
          >
            <MapPin size={24} color={colors.primary} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.inputWrap}>
            <TextInput
              accessibilityLabel="Nội dung tin nhắn"
              style={styles.input}
              placeholder="Nhắn một lời…"
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={4000}
              editable={!sending}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            disabled={!text.trim() || !!sending || !data.connected || !room}
            onPress={() => {
              void sendText();
            }}
            style={[
              styles.send,
              (!text.trim() || !!sending || !data.connected || !room) &&
                styles.disabled,
            ]}
          >
            <ArrowUp color="white" size={22} strokeWidth={2.5} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  back: { marginRight: 2 },
  headerBody: { flex: 1, gap: 5 },
  statusDot: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 11, color: colors.secondary },
  onlineText: { color: colors.green },
  messages: { padding: 18, paddingBottom: 12 },
  empty: { flexGrow: 1 },
  startText: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 15,
  },
  day: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
    color: colors.secondary,
    marginTop: 10,
    marginBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    marginBottom: 17,
  },
  myRow: { justifyContent: 'flex-end' },
  messageColumn: { maxWidth: '80%' },
  bubble: {
    borderRadius: 19,
    paddingHorizontal: 15,
    paddingVertical: 11,
    minWidth: 50,
  },
  myBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 5 },
  theirBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 5 },
  messageText: { fontSize: 15, lineHeight: 22, color: colors.text },
  myText: { color: colors.surface },
  messageMeta: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginTop: 5,
    marginHorizontal: 3,
  },
  myMeta: { justifyContent: 'flex-end' },
  messageTime: { fontSize: 9, color: colors.muted },
  locationBubble: {
    padding: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    width: 245,
    maxWidth: '100%',
  },
  mapPreview: {
    height: 122,
    backgroundColor: '#EDF1E8',
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapRoadOne: {
    position: 'absolute',
    width: 300,
    height: 20,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-30deg' }],
  },
  mapRoadTwo: {
    position: 'absolute',
    width: 300,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  mapPark: {
    position: 'absolute',
    width: 54,
    height: 44,
    backgroundColor: '#D3E5CE',
    borderRadius: 13,
    top: 9,
    left: 14,
  },
  pin: {
    width: 55,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#007AFF19',
  },
  mapLabel: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFFE8',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  mapLabelText: {
    fontSize: 7,
    color: colors.primary,
    letterSpacing: 0.7,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  locationTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  coordinates: { color: colors.secondary, fontSize: 10, marginTop: 4 },
  openMap: {
    fontSize: 10,
    color: colors.primary,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  sync: { alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 8 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 15,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  locationButton: {
    width: 36,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 22,
    minHeight: 43,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 120,
  },
  send: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  disabled: { opacity: 0.35 },
});
