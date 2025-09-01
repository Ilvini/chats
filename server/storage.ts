import { 
  UserModel, ChatRoomModel, MessageModel, ChatParticipantModel,
  type User, type InsertUser, type ChatRoom, type InsertChatRoom, 
  type Message, type InsertMessage, type ChatParticipant, type InsertParticipant 
} from "@shared/schema";
import { randomUUID } from "crypto";
import { isMongoConnected } from "./db";

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


export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ id }).exec();
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).exec();
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userData = {
      ...insertUser,
      id: randomUUID()
    };
    const user = new UserModel(userData);
    await user.save();
    return user;
  }

  // Chat room methods
  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    const chatRoom = await ChatRoomModel.findOne({ id }).exec();
    return chatRoom || undefined;
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    return await ChatRoomModel.find({}).sort({ createdAt: -1 }).exec();
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    const chatRoom = new ChatRoomModel(insertChatRoom);
    await chatRoom.save();
    return chatRoom;
  }

  async updateChatRoom(id: string, updates: Partial<ChatRoom>): Promise<ChatRoom | undefined> {
    const updatedRoom = await ChatRoomModel.findOneAndUpdate(
      { id }, 
      updates, 
      { new: true }
    ).exec();
    return updatedRoom || undefined;
  }

  async deleteChatRoom(id: string): Promise<boolean> {
    // Delete related data first
    await MessageModel.deleteMany({ chatRoomId: id }).exec();
    await ChatParticipantModel.deleteMany({ chatRoomId: id }).exec();
    
    const result = await ChatRoomModel.deleteOne({ id }).exec();
    return result.deletedCount > 0;
  }

  // Message methods
  async getMessages(chatRoomId: string, limit: number = 50): Promise<Message[]> {
    return await MessageModel
      .find({ chatRoomId })
      .sort({ timestamp: 1 }) // Chronological order
      .limit(limit)
      .exec();
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const messageData = {
      ...insertMessage,
      id: randomUUID(),
      messageType: insertMessage.messageType || 'user'
    };
    const message = new MessageModel(messageData);
    await message.save();
    return message;
  }

  async getMessageCount(chatRoomId: string): Promise<number> {
    return await MessageModel.countDocuments({ chatRoomId }).exec();
  }

  // Participant methods
  async getParticipants(chatRoomId: string): Promise<ChatParticipant[]> {
    return await ChatParticipantModel.find({ chatRoomId }).exec();
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<ChatParticipant> {
    // Remove existing participant with same name if exists
    await ChatParticipantModel.deleteMany({ 
      chatRoomId: insertParticipant.chatRoomId,
      userName: insertParticipant.userName 
    }).exec();

    const participantData = {
      ...insertParticipant,
      id: randomUUID(),
      isActive: insertParticipant.isActive ?? true
    };
    const participant = new ChatParticipantModel(participantData);
    await participant.save();
    return participant;
  }

  async removeParticipant(chatRoomId: string, userName: string): Promise<boolean> {
    const result = await ChatParticipantModel.deleteMany({ 
      chatRoomId, 
      userName 
    }).exec();
    return result.deletedCount > 0;
  }

  async getActiveParticipantCount(chatRoomId: string): Promise<number> {
    return await ChatParticipantModel.countDocuments({ 
      chatRoomId, 
      isActive: true 
    }).exec();
  }
}

// In-memory storage for development/fallback
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private chatRooms = new Map<string, ChatRoom>();
  private messages = new Map<string, Message[]>();
  private participants = new Map<string, ChatParticipant[]>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const [_, user] of this.users.entries()) {
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
    
    const updated = { ...existing, ...updates } as ChatRoom;
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

// Create storage instance based on MongoDB connection
function createStorage(): IStorage {
  // This will be determined at runtime based on MongoDB connection success
  return new MemStorage();
}

export let storage: IStorage = createStorage();

// Function to update storage after MongoDB connection attempt
export function updateStorage(useMongoStorage: boolean) {
  if (useMongoStorage) {
    storage = new MongoStorage();
    console.log("📚 Using MongoDB storage");
  } else {
    storage = new MemStorage();
    console.log("💾 Using in-memory storage");
  }
}
