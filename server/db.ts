import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase(): Promise<boolean> {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI not found, using in-memory storage");
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB successfully");
    isConnected = true;
    return true;
  } catch (error) {
    console.warn("⚠️ MongoDB connection failed, falling back to in-memory storage");
    console.error("Connection error:", (error as Error).message);
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export default mongoose;