import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from './AuthContext';
import { ensureProfile, logoutAccount } from '../services/auth';
import { errorMessage } from '../services/errors';
import { setDatabaseActive, useRealtime } from '../services/realtime';
import { startPresence } from '../services/presence';
import { watchRoom } from '../services/chat';
import type { Conversation, Profile, Room } from '../types';
import { roomMessages, unreadCount } from '../utils/chat';

const EMPTY_OBJECT = {};
type ChatData = {
  profiles: Record<string, Profile>;
  online: Record<string, boolean>;
  lastOnline: Record<string, number>;
  conversations: Conversation[];
  unread: number;
  loading: boolean;
  error: string;
  connected: boolean;
  offline: boolean;
  updatedAt?: number;
  retry: () => void;
  logout: () => Promise<void>;
};
const ChatContext = createContext<ChatData | null>(null);

export function ChatProvider({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState('');
  const [bootstrapVersion, setBootstrapVersion] = useState(0);
  const [offline, setOffline] = useState(false);
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active',
  );
  const [presenceError, setPresenceError] = useState('');
  const stopPresence = useRef<(() => Promise<void>) | null>(null);
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsUpdatedAt, setRoomsUpdatedAt] = useState(0);
  const [roomsError, setRoomsError] = useState('');
  const [roomsVersion, setRoomsVersion] = useState(0);
  const connection = useRealtime<boolean>('.info/connected', false);
  const users = useRealtime<Record<string, Omit<Profile, 'uid'>>>(
    ready ? 'users' : null,
    EMPTY_OBJECT,
  );
  const presence = useRealtime<Record<string, Record<string, boolean>>>(
    ready ? 'presence' : null,
    EMPTY_OBJECT,
  );
  const lastOnline = useRealtime<Record<string, number>>(
    ready ? 'lastOnline' : null,
    EMPTY_OBJECT,
  );
  const index = useRealtime<Record<string, boolean>>(
    ready && user ? `userRooms/${user.uid}` : null,
    EMPTY_OBJECT,
  );
  const idsKey = Object.keys(index.value).sort().join('|');

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    setReady(false);
    setBootstrapError('');
    ensureProfile(user)
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(failure => {
        if (!cancelled) {
          setBootstrapError(errorMessage(failure));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, bootstrapVersion]);

  useEffect(
    () =>
      NetInfo.addEventListener(state => {
        setOffline(
          state.isConnected === false || state.isInternetReachable === false,
        );
      }),
    [],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      const active = state === 'active';
      setAppActive(active);
      setDatabaseActive(active);
    });
    return () => {
      subscription.remove();
      setDatabaseActive(true);
    };
  }, []);

  useEffect(() => {
    if (!ready || !user || !appActive) {
      return;
    }
    setPresenceError('');
    const stop = startPresence(user.uid, failure =>
      setPresenceError(errorMessage(failure)),
    );
    stopPresence.current = stop;
    return () => {
      stopPresence.current = null;
      void stop().catch(() => {
        /* onDisconnect remains responsible if already disconnected. */
      });
    };
  }, [ready, user, appActive, bootstrapVersion]);

  useEffect(() => {
    const ids = idsKey ? idsKey.split('|') : [];
    setRooms({});
    setRoomsError('');
    setRoomsLoading(ids.length > 0);
    const pending = new Set(ids);
    const cleanup = ids.map(id =>
      watchRoom(
        id,
        room => {
          setRooms(previous => {
            const next = { ...previous };
            if (room) {
              next[id] = room;
            } else {
              delete next[id];
            }
            return next;
          });
          pending.delete(id);
          setRoomsUpdatedAt(Date.now());
          setRoomsLoading(pending.size > 0);
        },
        failure => {
          setRoomsError(errorMessage(failure));
          setRoomsLoading(false);
        },
      ),
    );
    return () => cleanup.forEach(unsubscribe => unsubscribe());
  }, [idsKey, roomsVersion]);

  const profiles = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(users.value).map(([uid, profile]) => [
          uid,
          { ...profile, uid },
        ]),
      ),
    [users.value],
  );
  const online = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(presence.value).map(([uid, connections]) => [
          uid,
          Object.keys(connections).length > 0,
        ]),
      ),
    [presence.value],
  );
  const conversations = useMemo<Conversation[]>(() => {
    if (!user) {
      return [];
    }
    return Object.values(rooms)
      .flatMap(room => {
        const messages = roomMessages(room);
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) {
          return [];
        }
        const peerId = room.userA === user.uid ? room.userB : room.userA;
        const peer = profiles[peerId] ?? {
          uid: peerId,
          displayName: 'Người dùng',
          email: '',
          createdAt: 0,
        };
        return [
          {
            room,
            peer,
            messages,
            lastMessage,
            unread: unreadCount(room, user.uid),
          },
        ];
      })
      .sort(
        (a, b) =>
          b.lastMessage.createdAt - a.lastMessage.createdAt ||
          b.lastMessage.id.localeCompare(a.lastMessage.id),
      );
  }, [rooms, user, profiles]);

  const retryUsers = users.retry;
  const retryPresence = presence.retry;
  const retryLastOnline = lastOnline.retry;
  const retryIndex = index.retry;
  const retry = useCallback(() => {
    setDatabaseActive(true);
    setBootstrapVersion(value => value + 1);
    setRoomsVersion(value => value + 1);
    retryUsers();
    retryPresence();
    retryLastOnline();
    retryIndex();
  }, [retryUsers, retryPresence, retryLastOnline, retryIndex]);

  const logout = async () => {
    if (stopPresence.current && connection.value) {
      await stopPresence.current();
    }
    await logoutAccount();
  };

  return (
    <ChatContext.Provider
      value={{
        profiles,
        online,
        lastOnline: lastOnline.value,
        conversations,
        unread: conversations.reduce(
          (total, conversation) => total + conversation.unread,
          0,
        ),
        connected: connection.value,
        offline,
        loading:
          (!ready && !bootstrapError) ||
          users.loading ||
          index.loading ||
          roomsLoading,
        error:
          bootstrapError ||
          users.error ||
          index.error ||
          roomsError ||
          presence.error ||
          lastOnline.error ||
          presenceError,
        updatedAt: Math.max(users.updatedAt ?? 0, roomsUpdatedAt) || undefined,
        retry,
        logout,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatData() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('ChatProvider chưa được khởi tạo.');
  }
  return context;
}
