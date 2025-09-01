import { 
  type User, type InsertUser, type ChatRoom, type InsertChatRoom, 
  type Message, type InsertMessage, type ChatParticipant, type InsertParticipant 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods (existing)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chat room methods
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  getAllChatRooms(): Promise<ChatRoom[]>;
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  updateChatRoom(id: string, updates: Partial<ChatRoom>): Promise<ChatRoom | undefined>;
  deleteChatRoom(id: string): Promise<boolean>;

  // Message methods
  getMessages(chatRoomId: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageCount(chatRoomId: string): Promise<number>;

  // Participant methods
  getParticipants(chatRoomId: string): Promise<ChatParticipant[]>;
  addParticipant(participant: InsertParticipant): Promise<ChatParticipant>;
  removeParticipant(chatRoomId: string, userName: string): Promise<boolean>;
  getActiveParticipantCount(chatRoomId: string): Promise<number>;
}


// In-memory storage for development
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private chatRooms = new Map<string, ChatRoom>();
  private messages = new Map<string, Message[]>();
  private participants = new Map<string, ChatParticipant[]>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = {
      id: randomUUID(),
      ...insertUser,
      createdAt: new Date()
    } as User;
    this.users.set(user.id, user);
    return user;
  }

  // Chat room methods
  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    const chatRoom = {
      ...insertChatRoom,
      createdAt: new Date()
    } as ChatRoom;
    this.chatRooms.set(chatRoom.id, chatRoom);
    return chatRoom;
  }

  async updateChatRoom(id: string, updates: Partial<ChatRoom>): Promise<ChatRoom | undefined> {
    const existing = this.chatRooms.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.chatRooms.set(id, updated);
    return updated;
  }

  async deleteChatRoom(id: string): Promise<boolean> {
    const deleted = this.chatRooms.delete(id);
    if (deleted) {
      this.messages.delete(id);
      this.participants.delete(id);
    }
    return deleted;
  }

  // Message methods
  async getMessages(chatRoomId: string, limit: number = 50): Promise<Message[]> {
    const roomMessages = this.messages.get(chatRoomId) || [];
    return roomMessages.slice(-limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message = {
      id: randomUUID(),
      ...insertMessage,
      messageType: insertMessage.messageType || 'user',
      timestamp: new Date()
    } as Message;
    
    const roomMessages = this.messages.get(insertMessage.chatRoomId) || [];
    roomMessages.push(message);
    this.messages.set(insertMessage.chatRoomId, roomMessages);
    
    return message;
  }

  async getMessageCount(chatRoomId: string): Promise<number> {
    return (this.messages.get(chatRoomId) || []).length;
  }

  // Participant methods
  async getParticipants(chatRoomId: string): Promise<ChatParticipant[]> {
    return this.participants.get(chatRoomId) || [];
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<ChatParticipant> {
    const participant = {
      id: randomUUID(),
      ...insertParticipant,
      joinedAt: new Date(),
      isActive: insertParticipant.isActive ?? true
    } as ChatParticipant;
    
    const roomParticipants = this.participants.get(insertParticipant.chatRoomId) || [];
    
    // Remove existing participant with same name
    const filtered = roomParticipants.filter(p => p.userName !== insertParticipant.userName);
    filtered.push(participant);
    
    this.participants.set(insertParticipant.chatRoomId, filtered);
    return participant;
  }

  async removeParticipant(chatRoomId: string, userName: string): Promise<boolean> {
    const roomParticipants = this.participants.get(chatRoomId) || [];
    const originalLength = roomParticipants.length;
    
    const filtered = roomParticipants.filter(p => p.userName !== userName);
    this.participants.set(chatRoomId, filtered);
    
    return filtered.length < originalLength;
  }

  async getActiveParticipantCount(chatRoomId: string): Promise<number> {
    const roomParticipants = this.participants.get(chatRoomId) || [];
    return roomParticipants.filter(p => p.isActive).length;
  }
}

export const storage = new MemStorage();
