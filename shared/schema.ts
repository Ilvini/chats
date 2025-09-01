// Type definitions for our chat application

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: Date;
  settings?: string;
}

export interface Message {
  id: string;
  chatRoomId: string;
  userName: string;
  content: string;
  messageType: string;
  timestamp: Date;
}

export interface ChatParticipant {
  id: string;
  chatRoomId: string;
  userName: string;
  joinedAt: Date;
  isActive?: boolean;
}

export interface User {
  id: string;
  username: string;
  password: string;
}

// Insert types for forms
export type InsertChatRoom = {
  id: string;
  name: string;
  description?: string;
  status: string;
  settings?: string;
};

export type InsertMessage = {
  chatRoomId: string;
  userName: string;
  content: string;
  messageType?: string;
};

export type InsertParticipant = {
  chatRoomId: string;
  userName: string;
  isActive?: boolean;
};

export type InsertUser = {
  username: string;
  password: string;
};