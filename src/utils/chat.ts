import type { ChatMessage, Room } from '../types';

export function roomIdFor(a: string, b: string) {
  return [a, b].sort().join('_');
}

export function roomMessages(room?: Room | null): ChatMessage[] {
  return Object.entries(room?.messages ?? {})
    .map(([id, message]) => ({ ...message, id }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function unreadCount(room: Room, uid: string) {
  const lastRead = room.reads?.[uid] ?? '';
  return roomMessages(room).filter(
    message => message.senderId !== uid && message.id > lastRead,
  ).length;
}

export function messagePreview(message: ChatMessage) {
  return message.type === 'location'
    ? '📍 Đã chia sẻ vị trí'
    : message.text ?? '';
}

export function normalizedSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function formatTime(timestamp?: number) {
  if (!timestamp) {
    return '';
  }
  return new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatConversationTime(timestamp: number) {
  const date = new Date(timestamp);
  if (date.toDateString() === new Date().toDateString()) {
    return formatTime(timestamp);
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function formatDay(timestamp: number) {
  const date = new Date(timestamp);
  if (date.toDateString() === new Date().toDateString()) {
    return 'Hôm nay';
  }
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
