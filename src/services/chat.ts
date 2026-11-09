import {
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
  push,
  update,
  type Unsubscribe,
} from 'firebase/database';
import type { MessageDraft, Room } from '../types';
import { roomIdFor } from '../utils/chat';
import { database } from './firebase';

export async function ensureRoom(uid: string, peerId: string) {
  if (uid === peerId) {
    throw new Error('Vui lòng chọn một người khác để trò chuyện.');
  }
  const id = roomIdFor(uid, peerId);
  const [userA, userB] = [uid, peerId].sort();
  await runTransaction(ref(database, `rooms/${id}`), current => {
    if (current) {
      return;
    }
    return { userA, userB, createdAt: serverTimestamp() };
  });
  // Membership exists before creating either user's index; rules verify both participants.
  await update(ref(database), {
    [`userRooms/${uid}/${id}`]: true,
    [`userRooms/${peerId}/${id}`]: true,
  });
  return id;
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  draft: MessageDraft,
) {
  if (draft.type === 'text' && !draft.text.trim()) {
    throw new Error('Vui lòng nhập nội dung tin nhắn.');
  }
  if (draft.type === 'text' && draft.text.trim().length > 4000) {
    throw new Error('Tin nhắn không được quá 4.000 ký tự.');
  }
  const messageRef = push(ref(database, `rooms/${roomId}/messages`));
  const body =
    draft.type === 'text' ? { ...draft, text: draft.text.trim() } : draft;
  await update(messageRef, { ...body, senderId, createdAt: serverTimestamp() });
  return messageRef.key!;
}

export function watchRoom(
  id: string,
  callback: (room: Room | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onValue(
    ref(database, `rooms/${id}`),
    snapshot => callback(snapshot.exists() ? { ...snapshot.val(), id } : null),
    onError,
  );
}

export async function markRead(roomId: string, uid: string, messageId: string) {
  await runTransaction(
    ref(database, `rooms/${roomId}/reads/${uid}`),
    current => {
      if (current && current >= messageId) {
        return;
      }
      return messageId;
    },
  );
}
