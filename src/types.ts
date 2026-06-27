
export interface Speaker {
  id: string;
  name: string;
  role: string;
  isSpeaking: boolean;
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  isVerified?: boolean;
  isOnline?: boolean;
}

export interface Poll {
  question: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  votedOption?: number; 
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  poll?: Poll;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

export type NotificationType = 'like' | 'repost' | 'mention' | 'follow' | 'debate_invite';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actor: User;
  targetContent?: string;
  timestamp: string;
  isRead: boolean;
}
