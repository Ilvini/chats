import { type User, type InsertUser, type ChatRoom, type InsertChatRoom, type Message, type InsertMessage, type ChatParticipant, type InsertParticipant } from "@shared/schema";
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatRooms: Map<string, ChatRoom>;
  private messages: Map<string, Message[]>;
  private participants: Map<string, ChatParticipant[]>;

  constructor() {
    this.users = new Map();
    this.chatRooms = new Map();
    this.messages = new Map();
    this.participants = new Map();

    // Initialize with some default chat rooms
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    const defaultChats = [
      {
        id: "cs-support-001",
        name: "Customer Support Chat",
        description: "General customer inquiries and support",
        status: "active" as const,
        settings: JSON.stringify({ theme: "blue", welcomeMessage: "Hello! How can we help you today?" })
      },
      {
        id: "sales-inquiry-002",
        name: "Sales Inquiry Chat",
        description: "Pre-sales questions and product demos",
        status: "active" as const,
        settings: JSON.stringify({ theme: "green", welcomeMessage: "Welcome to sales! What can we help you with?" })
      },
      {
        id: "course-help-003",
        name: "Course Help Chat",
        description: "Student support and course assistance",
        status: "paused" as const,
        settings: JSON.stringify({ theme: "purple", welcomeMessage: "Hi! Need help with your course?" })
      }
    ];

    for (const chat of defaultChats) {
      const chatRoom: ChatRoom = {
        ...chat,
        createdAt: new Date()
      };
      this.chatRooms.set(chat.id, chatRoom);
      this.messages.set(chat.id, []);
      this.participants.set(chat.id, []);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Chat room methods
  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values());
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    const chatRoom: ChatRoom = {
      ...insertChatRoom,
      createdAt: new Date()
    };
    this.chatRooms.set(chatRoom.id, chatRoom);
    this.messages.set(chatRoom.id, []);
    this.participants.set(chatRoom.id, []);
    return chatRoom;
  }

  async updateChatRoom(id: string, updates: Partial<ChatRoom>): Promise<ChatRoom | undefined> {
    const existingRoom = this.chatRooms.get(id);
    if (!existingRoom) return undefined;

    const updatedRoom = { ...existingRoom, ...updates };
    this.chatRooms.set(id, updatedRoom);
    return updatedRoom;
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
    const messages = this.messages.get(chatRoomId) || [];
    return messages.slice(-limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      ...insertMessage,
      timestamp: new Date()
    };

    const messages = this.messages.get(insertMessage.chatRoomId) || [];
    messages.push(message);
    this.messages.set(insertMessage.chatRoomId, messages);

    return message;
  }

  async getMessageCount(chatRoomId: string): Promise<number> {
    const messages = this.messages.get(chatRoomId) || [];
    return messages.length;
  }

  // Participant methods
  async getParticipants(chatRoomId: string): Promise<ChatParticipant[]> {
    return this.participants.get(chatRoomId) || [];
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<ChatParticipant> {
    const participant: ChatParticipant = {
      id: randomUUID(),
      ...insertParticipant,
      joinedAt: new Date()
    };

    const participants = this.participants.get(insertParticipant.chatRoomId) || [];
    
    // Remove existing participant with same name if exists
    const filteredParticipants = participants.filter(p => p.userName !== insertParticipant.userName);
    filteredParticipants.push(participant);
    
    this.participants.set(insertParticipant.chatRoomId, filteredParticipants);

    return participant;
  }

  async removeParticipant(chatRoomId: string, userName: string): Promise<boolean> {
    const participants = this.participants.get(chatRoomId) || [];
    const filtered = participants.filter(p => p.userName !== userName);
    
    if (filtered.length !== participants.length) {
      this.participants.set(chatRoomId, filtered);
      return true;
    }
    return false;
  }

  async getActiveParticipantCount(chatRoomId: string): Promise<number> {
    const participants = this.participants.get(chatRoomId) || [];
    return participants.filter(p => p.isActive).length;
  }
}

export const storage = new MemStorage();
