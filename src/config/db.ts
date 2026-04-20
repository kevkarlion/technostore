import { MongoClient, Db, MongoServerError } from "mongodb";
import { getEnv } from "./env";

let client: MongoClient | null = null;
let db: Db | null = null;

// Track if we've already tried and failed to avoid repeated connection attempts
let connectionFailed = false;

export async function getDb(): Promise<Db> {
  if (db) return db;

  // If we already tried and failed, use mock DB immediately
  if (connectionFailed) {
    return getMockDb();
  }

  const env = getEnv();

  try {
    if (!client) {
      client = new MongoClient(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
      await client.connect();
    }

    db = client.db(env.MONGODB_DB_NAME);
    console.log("[DB] Connected to MongoDB");
    return db;
  } catch (error) {
    connectionFailed = true;
    console.warn("[DB] Connection failed, using mock DB:", error instanceof Error ? error.message : error);
    return getMockDb();
  }
}

// Mock DB for development without MongoDB
function getMockDb(): Db {
  console.log("[DB] Using in-memory mock database");
  
  return {
    collection: (_name: string) => ({
      find: (query?: any) => ({
        toArray: async () => [],
        sort: () => ({ toArray: async () => [] }),
        limit: () => ({ toArray: async () => [] }),
        skip: () => ({ toArray: async () => [] }),
      }),
      findOne: async (query: any) => null,
      insertOne: async (doc: any) => ({ insertedId: "mock-id-" + Date.now() }),
      insertMany: async (docs: any[]) => ({ insertedIds: docs.map((_, i) => `mock-id-${i}`) }),
      updateOne: async (query: any, update: any) => ({ 
        modifiedCount: 1, 
        upsertedId: update.$setOnInsert ? "mock-id" : undefined 
      }),
      updateMany: async () => ({ modifiedCount: 0 }),
      deleteOne: async (query: any) => ({ deletedCount: 1 }),
      deleteMany: async () => ({ deletedCount: 0 }),
      countDocuments: async () => 0,
      aggregate: (pipeline: any[]) => ({ toArray: async () => [] }),
    }),
  } as unknown as Db;
}

