import { MongoClient, Db } from "mongodb";
import { getEnv } from "./env";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  const env = getEnv();

  if (!client) {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
  }

  db = client.db(env.MONGODB_DB_NAME);
  return db;
}

