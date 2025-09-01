import { Schema, model, Document } from "mongoose";

// Chat Room Schema
export interface ChatRoom extends Document {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: Date;
  settings?: string;
}

const chatRoomSchema = new Schema<ChatRoom>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, required: true, default: "active" },
  createdAt: { type: Date, default: Date.now },
  settings: { type: String }
});

export const ChatRoomModel = model<ChatRoom>("ChatRoom", chatRoomSchema);

// Message Schema
export interface Message extends Document {
  id: string;
  chatRoomId: string;
  userName: string;
  content: string;
  messageType: string;
  timestamp: Date;
}

const messageSchema = new Schema<Message>({
  id: { type: String, required: true, unique: true },
  chatRoomId: { type: String, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  messageType: { type: String, required: true, default: "user" },
  timestamp: { type: Date, default: Date.now }
});

export const MessageModel = model<Message>("Message", messageSchema);

// Chat Participant Schema
export interface ChatParticipant extends Document {
  id: string;
  chatRoomId: string;
  userName: string;
  joinedAt: Date;
  isActive?: boolean;
}

const chatParticipantSchema = new Schema<ChatParticipant>({
  id: { type: String, required: true, unique: true },
  chatRoomId: { type: String, required: true },
  userName: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

export const ChatParticipantModel = model<ChatParticipant>("ChatParticipant", chatParticipantSchema);

// User Schema (for compatibility)
export interface User extends Document {
  id: string;
  username: string;
  password: string;
}

const userSchema = new Schema<User>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

export const UserModel = model<User>("User", userSchema);

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