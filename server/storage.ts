import { users, chatRooms, messages, chatParticipants, type User, type InsertUser, type ChatRoom, type InsertChatRoom, type Message, type InsertMessage, type ChatParticipant, type InsertParticipant } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count } from "drizzle-orm";

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


export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Chat room methods
  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    const [chatRoom] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return chatRoom || undefined;
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    return await db.select().from(chatRooms).orderBy(desc(chatRooms.createdAt));
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    const [chatRoom] = await db
      .insert(chatRooms)
      .values(insertChatRoom)
      .returning();
    return chatRoom;
  }

  async updateChatRoom(id: string, updates: Partial<ChatRoom>): Promise<ChatRoom | undefined> {
    const [updatedRoom] = await db
      .update(chatRooms)
      .set(updates)
      .where(eq(chatRooms.id, id))
      .returning();
    return updatedRoom || undefined;
  }

  async deleteChatRoom(id: string): Promise<boolean> {
    // Delete related data first
    await db.delete(messages).where(eq(messages.chatRoomId, id));
    await db.delete(chatParticipants).where(eq(chatParticipants.chatRoomId, id));
    
    const result = await db.delete(chatRooms).where(eq(chatRooms.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Message methods
  async getMessages(chatRoomId: string, limit: number = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatRoomId, chatRoomId))
      .orderBy(desc(messages.timestamp))
      .limit(limit)
      .then(msgs => msgs.reverse()); // Return in chronological order
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const messageData = {
      ...insertMessage,
      messageType: insertMessage.messageType || 'user'
    };
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getMessageCount(chatRoomId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.chatRoomId, chatRoomId));
    return result[0]?.count || 0;
  }

  // Participant methods
  async getParticipants(chatRoomId: string): Promise<ChatParticipant[]> {
    return await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.chatRoomId, chatRoomId));
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<ChatParticipant> {
    // Remove existing participant with same name if exists
    await db
      .delete(chatParticipants)
      .where(and(
        eq(chatParticipants.chatRoomId, insertParticipant.chatRoomId),
        eq(chatParticipants.userName, insertParticipant.userName)
      ));

    const participantData = {
      ...insertParticipant,
      isActive: insertParticipant.isActive ?? true
    };
    const [participant] = await db
      .insert(chatParticipants)
      .values(participantData)
      .returning();
    return participant;
  }

  async removeParticipant(chatRoomId: string, userName: string): Promise<boolean> {
    const result = await db
      .delete(chatParticipants)
      .where(and(
        eq(chatParticipants.chatRoomId, chatRoomId),
        eq(chatParticipants.userName, userName)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getActiveParticipantCount(chatRoomId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(chatParticipants)
      .where(and(
        eq(chatParticipants.chatRoomId, chatRoomId),
        eq(chatParticipants.isActive, true)
      ));
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
