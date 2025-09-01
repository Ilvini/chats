import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";

// Validation schemas
const insertChatRoomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.string().default("active"),
  settings: z.string().optional(),
});

const insertMessageSchema = z.object({
  chatRoomId: z.string().min(1),
  userName: z.string().min(1),
  content: z.string().min(1),
  messageType: z.string().optional(),
});

const insertParticipantSchema = z.object({
  chatRoomId: z.string().min(1),
  userName: z.string().min(1),
  isActive: z.boolean().optional(),
});

interface WebSocketMessage {
  type: "join" | "leave" | "message" | "typing";
  chatRoomId: string;
  userName?: string;
  content?: string;
  messageType?: string;
}

interface ExtendedWebSocket extends WebSocket {
  chatRoomId?: string;
  userName?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Chat rooms API routes
  app.get("/api/chatrooms", async (req, res) => {
    try {
      const chatRooms = await storage.getAllChatRooms();

      // Add statistics to each chat room
      const chatRoomsWithStats = await Promise.all(
        chatRooms.map(async (room) => {
          const messageCount = await storage.getMessageCount(room.id);
          const activeParticipants = await storage.getActiveParticipantCount(
            room.id
          );

          // Convert Mongoose document to plain object
          const roomData = room.toObject ? room.toObject() : room;

          return {
            id: roomData.id,
            name: roomData.name,
            description: roomData.description,
            status: roomData.status,
            settings: roomData.settings,
            createdAt: roomData.createdAt,
            messageCount,
            activeParticipants,
          };
        })
      );

      res.json(chatRoomsWithStats);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  app.get("/api/chatrooms/:id", async (req, res) => {
    try {
      const chatRoom = await storage.getChatRoom(req.params.id);
      if (!chatRoom) {
        return res.status(404).json({ message: "Chat room not found" });
      }

      // Convert Mongoose document to plain object
      const roomData = chatRoom.toObject ? chatRoom.toObject() : chatRoom;
      const response = {
        id: roomData.id,
        name: roomData.name,
        description: roomData.description,
        status: roomData.status,
        settings: roomData.settings,
        createdAt: roomData.createdAt,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching chat room:", error);
      res.status(500).json({ message: "Failed to fetch chat room" });
    }
  });

  app.post("/api/chatrooms", async (req, res) => {
    try {
      const validatedData = insertChatRoomSchema.parse(req.body);
      const chatRoom = await storage.createChatRoom(validatedData);

      // Convert Mongoose document to plain object
      const roomData = chatRoom.toObject ? chatRoom.toObject() : chatRoom;
      const response = {
        id: roomData.id,
        name: roomData.name,
        description: roomData.description,
        status: roomData.status,
        settings: roomData.settings,
        createdAt: roomData.createdAt,
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Error creating chat room:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      if (error.code === 11000) {
        return res
          .status(409)
          .json({ message: "Chat room with this ID already exists" });
      }
      res
        .status(500)
        .json({ message: "Failed to create chat room", error: error.message });
    }
  });

  app.put("/api/chatrooms/:id", async (req, res) => {
    try {
      const chatRoom = await storage.updateChatRoom(req.params.id, req.body);
      if (!chatRoom) {
        return res.status(404).json({ message: "Chat room not found" });
      }

      // Convert Mongoose document to plain object
      const roomData = chatRoom.toObject ? chatRoom.toObject() : chatRoom;
      const response = {
        id: roomData.id,
        name: roomData.name,
        description: roomData.description,
        status: roomData.status,
        settings: roomData.settings,
        createdAt: roomData.createdAt,
      };

      res.json(response);
    } catch (error) {
      console.error("Error updating chat room:", error);
      res.status(500).json({ message: "Failed to update chat room" });
    }
  });

  app.delete("/api/chatrooms/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteChatRoom(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      res.json({ message: "Chat room deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chat room" });
    }
  });

  // Messages API routes
  app.get("/api/chatrooms/:id/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getMessages(req.params.id, limit);

      // Convert Mongoose documents to plain objects
      const cleanMessages = messages.map((message) => {
        const messageData = message.toObject ? message.toObject() : message;
        return {
          id: messageData.id,
          chatRoomId: messageData.chatRoomId,
          userName: messageData.userName,
          content: messageData.content,
          messageType: messageData.messageType,
          timestamp: messageData.timestamp,
        };
      });

      res.json(cleanMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chatrooms/:id/messages", async (req, res) => {
    try {
      const messageData = {
        ...req.body,
        chatRoomId: req.params.id,
      };
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);

      // Convert Mongoose document to plain object
      const messageResponse = message.toObject ? message.toObject() : message;
      const response = {
        id: messageResponse.id,
        chatRoomId: messageResponse.chatRoomId,
        userName: messageResponse.userName,
        content: messageResponse.content,
        messageType: messageResponse.messageType,
        timestamp: messageResponse.timestamp,
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Error creating message:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Participants API routes
  app.get("/api/chatrooms/:id/participants", async (req, res) => {
    try {
      const participants = await storage.getParticipants(req.params.id);

      // Convert Mongoose documents to plain objects
      const cleanParticipants = participants.map((participant) => {
        const participantData = participant.toObject
          ? participant.toObject()
          : participant;
        return {
          id: participantData.id,
          chatRoomId: participantData.chatRoomId,
          userName: participantData.userName,
          joinedAt: participantData.joinedAt,
          isActive: participantData.isActive,
        };
      });

      res.json(cleanParticipants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: ExtendedWebSocket) => {
    console.log("New WebSocket connection");

    ws.on("message", async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());

        switch (message.type) {
          case "join":
            if (message.chatRoomId && message.userName) {
              ws.chatRoomId = message.chatRoomId;
              ws.userName = message.userName;

              // Add participant to storage
              await storage.addParticipant({
                chatRoomId: message.chatRoomId,
                userName: message.userName,
                isActive: true,
              });

              // Create system message
              await storage.createMessage({
                chatRoomId: message.chatRoomId,
                userName: "System",
                content: `${message.userName} joined the chat`,
                messageType: "system",
              });

              // Broadcast to all clients in the same chat room
              broadcastToChatRoom(message.chatRoomId, {
                type: "userJoined",
                userName: message.userName,
                chatRoomId: message.chatRoomId,
              });
            }
            break;

          case "leave":
            if (ws.chatRoomId && ws.userName) {
              await storage.removeParticipant(ws.chatRoomId, ws.userName);

              // Create system message
              await storage.createMessage({
                chatRoomId: ws.chatRoomId,
                userName: "System",
                content: `${ws.userName} left the chat`,
                messageType: "system",
              });

              broadcastToChatRoom(ws.chatRoomId, {
                type: "userLeft",
                userName: ws.userName,
                chatRoomId: ws.chatRoomId,
              });
            }
            break;

          case "message":
            if (message.chatRoomId && message.userName && message.content) {
              // Save message to storage
              const savedMessage = await storage.createMessage({
                chatRoomId: message.chatRoomId,
                userName: message.userName,
                content: message.content,
                messageType: message.messageType || "user",
              });

              // Broadcast to all clients in the same chat room
              broadcastToChatRoom(message.chatRoomId, {
                type: "newMessage",
                message: savedMessage,
              });
            }
            break;

          case "typing":
            if (message.chatRoomId && message.userName) {
              // Broadcast typing indicator to all other clients in the same chat room
              broadcastToChatRoom(
                message.chatRoomId,
                {
                  type: "typing",
                  userName: message.userName,
                  chatRoomId: message.chatRoomId,
                },
                ws
              );
            }
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    ws.on("close", async () => {
      if (ws.chatRoomId && ws.userName) {
        await storage.removeParticipant(ws.chatRoomId, ws.userName);

        // Create system message
        await storage.createMessage({
          chatRoomId: ws.chatRoomId,
          userName: "System",
          content: `${ws.userName} left the chat`,
          messageType: "system",
        });

        broadcastToChatRoom(ws.chatRoomId, {
          type: "userLeft",
          userName: ws.userName,
          chatRoomId: ws.chatRoomId,
        });
      }
    });
  });

  function broadcastToChatRoom(
    chatRoomId: string,
    data: any,
    excludeWs?: ExtendedWebSocket
  ) {
    wss.clients.forEach((client: ExtendedWebSocket) => {
      if (
        client !== excludeWs &&
        client.readyState === WebSocket.OPEN &&
        client.chatRoomId === chatRoomId
      ) {
        client.send(JSON.stringify(data));
      }
    });
  }

  return httpServer;
}
