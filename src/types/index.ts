export type Profile = {
  uid: string;
  displayName: string;
  email: string;
  createdAt: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  type: 'text' | 'location';
  text?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
};

export type Room = {
  id: string;
  userA: string;
  userB: string;
  createdAt: number;
  messages?: Record<string, Omit<ChatMessage, 'id'>>;
  reads?: Record<string, string>;
};

export type Conversation = {
  room: Room;
  peer: Profile;
  messages: ChatMessage[];
  lastMessage: ChatMessage;
  unread: number;
};

export type MessageDraft =
  | { type: 'text'; text: string }
  | { type: 'location'; latitude: number; longitude: number };

export type RootStackParams = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Chat: { peerId: string; peerName: string };
};

export type TabParams = {
  Home: undefined;
  Contacts: undefined;
  Notifications: undefined;
  Settings: undefined;
};
