import {
  normalizedSearch,
  roomIdFor,
  roomMessages,
  unreadCount,
} from '../src/utils/chat';
import { validateAuth } from '../src/utils/validation';
import type { Room } from '../src/types';

const room: Room = {
  id: 'a_b',
  userA: 'a',
  userB: 'b',
  createdAt: 1,
  messages: {
    '-000A': { senderId: 'b', type: 'text', text: 'Chào!', createdAt: 100 },
    '-000Z': { senderId: 'a', type: 'text', text: 'Xin chào!', createdAt: 100 },
    '-000a': {
      senderId: 'b',
      type: 'location',
      latitude: 10,
      longitude: 106,
      createdAt: 101,
    },
  },
};
test('both users open the same deterministic room', () => {
  expect(roomIdFor('a', 'b')).toBe(roomIdFor('b', 'a'));
});
test('message keys follow Firebase ordering even when timestamps are equal', () => {
  expect(roomMessages(room).map(message => message.id)).toEqual([
    '-000A',
    '-000Z',
    '-000a',
  ]);
});
test('unread excludes own messages, clears after opening, then increases on a new message', () => {
  expect(unreadCount(room, 'a')).toBe(2);
  const readRoom = { ...room, reads: { a: '-000a' } };
  expect(unreadCount(readRoom, 'a')).toBe(0);
  expect(
    unreadCount(
      {
        ...readRoom,
        messages: {
          ...room.messages,
          '-000b': { senderId: 'b', type: 'text', text: 'Mới', createdAt: 102 },
        },
      },
      'a',
    ),
  ).toBe(1);
});
test('Vietnamese name search handles accents and letter đ', () => {
  expect(normalizedSearch('  Đặng Hoàng Ánh ')).toBe('dang hoang anh');
});
test('registration rejects missing names, invalid email, short passwords, and mismatched confirmation', () => {
  const errors = validateAuth(
    {
      displayName: ' ',
      email: 'invalid',
      password: '123',
      confirmPassword: '456',
    },
    true,
  );
  expect(Object.keys(errors).sort()).toEqual([
    'confirmPassword',
    'displayName',
    'email',
    'password',
  ]);
  expect(
    validateAuth(
      {
        displayName: 'Hoàng Anh',
        email: 'anh@example.com',
        password: '123456',
        confirmPassword: '123456',
      },
      true,
    ),
  ).toEqual({});
});
