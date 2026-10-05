import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/config/env";
import { getDb } from "@/config/db";

function initCloudinary() {
  const env = getEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

async function getCollections(db: any): Promise<string[]> {
  return await db.listCollections().toArray().then((collections: any[]) => 
    collections.map(c => c.name)
  );
}

async function backupCollection(db: any, collectionName: string): Promise<any[]> {
  const collection = db.collection(collectionName);
  const documents = await collection.find({}).toArray();
  return documents;
}

async function createDatabaseBackup(): Promise<Record<string, any[]>> {
  const db = await getDb();
  const collections = await getCollections(db);
  console.log(`[Backup] Found ${collections.length} collections`);

  const backup: Record<string, any[]> = {};

  for (const collectionName of collections) {
    console.log(`[Backup] Backing up collection: ${collectionName}`);
    backup[collectionName] = await backupCollection(db, collectionName);
  }

  return backup;
}

async function uploadToCloudinary(
  backup: Record<string, any[]>,
  publicId: string
): Promise<string> {
  initCloudinary();

  const jsonString = JSON.stringify(backup, null, 2);
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: "backups",
        resource_type: "raw",
        format: "json",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );

    const { Readable } = require("stream");
    const stream = Readable.from([jsonString]);
    stream.pipe(uploadStream);
  });
}

function validateAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");

  const env = getEnv();

  return (
    username === env.CRON_BACKUP_USER &&
    password === env.CRON_BACKUP_PASSWORD
  );
}

export async function POST(request: Request) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `backup-${timestamp}`;

  try {
    console.log(`[Backup] Starting backup at ${timestamp}`);

    const backup = await createDatabaseBackup();

    const totalCollections = Object.keys(backup).length;
    const totalDocuments = Object.values(backup).reduce((sum, docs) => sum + docs.length, 0);

    console.log(`[Backup] Collected ${totalDocuments} documents in ${totalCollections} collections`);

    const cloudinaryUrl = await uploadToCloudinary(backup, backupName);

    console.log(`[Backup] Completed: ${cloudinaryUrl}`);

    return NextResponse.json({
      success: true,
      backupUrl: cloudinaryUrl,
      timestamp,
      stats: {
        collections: totalCollections,
        documents: totalDocuments,
      },
    });
  } catch (error) {
    console.error("[Backup] Error:", error);

    return NextResponse.json(
      { error: "Backup failed", details: String(error) },
      { status: 500 }
    );
  }
}
