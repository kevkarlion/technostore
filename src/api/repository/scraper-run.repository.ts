import { getDb } from "@/config/db";
import type { 
  ScraperRun, 
  CreateScraperRunDTO, 
  CheckpointData, 
  RunStats,
  ScraperRunStatus 
} from "@/lib/scraper/types";
import { randomUUID } from "crypto";

const COLLECTION_NAME = "scraper_runs";

/**
 * Repository for managing scraper run state and checkpoints
 */
export const scraperRunRepository = {
  /**
   * Create a new scraper run
   */
  async create(data: CreateScraperRunDTO): Promise<ScraperRun> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    const now = new Date();
    const runId = randomUUID();

    const run: ScraperRun = {
      runId,
      status: "in_progress",
      source: data.source || "manual",
      categoryId: data.categoryId,
      requestedIdsubrubro1: data.idsubrubro1,
      categoriesToProcess: data.categoriesToProcess,
      currentCategoryIndex: 0,
      lastCategoryId: null,
      lastCategoryName: null,
      lastPageNumber: 1,
      lastProductId: null,
      lastProductOffset: 0,
      productsScraped: 0,
      productsSaved: 0,
      resumeCount: 0,
      startedAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(run);

    return {
      ...run,
      _id: result.insertedId,
    };
  },

  /**
   * Find a run by its runId
   */
  async findByRunId(runId: string): Promise<ScraperRun | null> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    const doc = await collection.findOne({ runId });
    return doc || null;
  },

  /**
   * Find the most recent incomplete (in_progress) run
   * Used to determine if we should resume from a checkpoint
   */
  async findIncomplete(): Promise<ScraperRun | null> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    const doc = await collection.findOne(
      { status: "in_progress" },
      { sort: { startedAt: -1 } }
    );

    return doc || null;
  },

  /**
   * Update checkpoint data for a run
   */
  async updateCheckpoint(runId: string, checkpoint: Partial<CheckpointData>): Promise<void> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    await collection.updateOne(
      { runId },
      { 
        $set: { 
          ...checkpoint, 
          updatedAt: new Date() 
        } 
      }
    );
  },

  /**
   * Mark a run as completed
   */
  async markCompleted(runId: string, stats: RunStats): Promise<void> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    await collection.updateOne(
      { runId },
      { 
        $set: { 
          status: "completed" as ScraperRunStatus,
          productsScraped: stats.productsScraped,
          productsSaved: stats.productsSaved,
          durationMs: stats.durationMs,
          completedAt: new Date(),
          updatedAt: new Date(),
        } 
      }
    );
  },

  /**
   * Mark a run as failed
   */
  async markFailed(runId: string, errorMessage: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    await collection.updateOne(
      { runId },
      { 
        $set: { 
          status: "failed" as ScraperRunStatus,
          errorMessage,
          updatedAt: new Date(),
        } 
      }
    );
  },

  /**
   * Clean up stale runs
   * Runs with status "in_progress" and not updated for more than 24 hours
   * are marked as "stale"
   */
  async cleanupStaleRuns(staleAfterHours = 24): Promise<number> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - staleAfterHours);

    const result = await collection.updateMany(
      { 
        status: "in_progress",
        updatedAt: { $lt: cutoff },
      },
      { 
        $set: { 
          status: "stale" as ScraperRunStatus,
          errorMessage: "Run marked stale due to inactivity",
          updatedAt: new Date(),
        } 
      }
    );

    return result.modifiedCount;
  },

  /**
   * Find recent runs
   */
  async findRecent(limit = 10): Promise<ScraperRun[]> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    const docs = await collection
      .find()
      .sort({ startedAt: -1 })
      .limit(limit)
      .toArray();

    return docs;
  },

  /**
   * Increment resume count for a run
   */
  async incrementResumeCount(runId: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    await collection.updateOne(
      { runId },
      { 
        $inc: { resumeCount: 1 },
        $set: { updatedAt: new Date() },
      }
    );
  },

  /**
   * Ensure indexes exist on the collection
   */
  async ensureIndexes(): Promise<void> {
    const db = await getDb();
    const collection = db.collection<ScraperRun>(COLLECTION_NAME);

    await Promise.all([
      collection.createIndex({ status: 1, updatedAt: 1 }),
      collection.createIndex({ runId: 1 }, { unique: true }),
      collection.createIndex({ startedAt: -1 }),
    ]);
  },
};
