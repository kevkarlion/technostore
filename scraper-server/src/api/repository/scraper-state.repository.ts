import { getDb } from "@/config/db";

const COLLECTION_NAME = "scraper_state";

/**
 * Estado de una subcategoría para el scraping incremental
 */
export interface ScraperCategoryState {
  /** Slug de la categoría (ej: "pendrive", "mouse-gamer") */
  categoryId: string;
  /** idsubrubo1 del sitio del proveedor */
  idsubrubro1: number;
  /** Hash del contenido de la primera página (para detectar cambios) */
  contentHash: string;
  /** Cantidad de productos detectados en la última página scrapeada */
  productCount: number;
  /** Fecha del último scrapeo exitoso */
  lastScrapeAt: Date;
  /** Precio USD del primer producto (referencia para comparar cambios) */
  firstProductPriceUsd?: string;
  /** Estado de la categoría */
  status: "active" | "disabled";
}

/**
 * Snapshot de los datos de una categoría en un momento dado
 * Se guarda antes de cada scrapeo para poder comparar después
 */
export interface ScraperCategorySnapshot {
  categoryId: string;
  idsubrubro1: number;
  /** Hash MD5 del contenido - si cambia, la categoría tuvo cambios */
  contentHash: string;
  /** Cantidad de productos en la primera página */
  productCount: number;
  /** Lista de externalIds de la primera página (para detectar productos nuevos/eliminados) */
  productIds: string[];
  /** Primer precio USD - referencia para comparar */
  firstPriceUsd?: string;
  /** Timestamp del snapshot */
  capturedAt: Date;
}

export const scraperStateRepository = {
  /**
   * Obtener el estado de una categoría
   */
  async getCategoryState(categoryId: string): Promise<ScraperCategoryState | null> {
    const db = await getDb();
    const collection = db.collection<ScraperCategoryState>(COLLECTION_NAME);
    return collection.findOne({ categoryId });
  },

  /**
   * Obtener todos los estados de categorías
   */
  async getAllCategoryStates(): Promise<ScraperCategoryState[]> {
    const db = await getDb();
    const collection = db.collection<ScraperCategoryState>(COLLECTION_NAME);
    return collection.find({ status: "active" }).toArray();
  },

  /**
   * Guardar o actualizar el estado de una categoría
   */
  async upsertCategoryState(state: Omit<ScraperCategoryState, "status">): Promise<void> {
    const db = await getDb();
    const collection = db.collection<ScraperCategoryState>(COLLECTION_NAME);
    
    // No usar $setOnInsert con status para evitar el conflicto
    await collection.updateOne(
      { categoryId: state.categoryId },
      { $set: state },
      { upsert: true }
    );
  },

  /**
   * Marcar una categoría como deshabilitada
   */
  async disableCategory(categoryId: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection<ScraperCategoryState>(COLLECTION_NAME);
    await collection.updateOne(
      { categoryId },
      { $set: { status: "disabled" } }
    );
  },

  /**
   * Obtener categorías que necesitan actualización
   * (basado en el intervalo mínimo configurado)
   */
  async getCategoriesNeedingUpdate(minIntervalMs: number = 7200000): Promise<ScraperCategoryState[]> {
    const db = await getDb();
    const collection = db.collection<ScraperCategoryState>(COLLECTION_NAME);
    
    const cutoff = new Date(Date.now() - minIntervalMs);
    
    // Devuelve todas las categorías activas que no se han actualizado en el intervalo
    // O las que nunca se han actualizado (lastScrapeAt no existe)
    return collection.find({
      status: "active",
      $or: [
        { lastScrapeAt: { $lt: cutoff } },
        { lastScrapeAt: { $exists: false } }
      ]
    }).toArray();
  },

  /**
   * Guardar snapshot antes de scrapeo
   */
  async saveSnapshot(snapshot: ScraperCategorySnapshot): Promise<void> {
    const db = await getDb();
    const collection = db.collection("scraper_snapshots");
    
    await collection.insertOne({
      ...snapshot,
      createdAt: new Date()
    });
  },

  /**
   * Obtener último snapshot de una categoría
   */
  async getLastSnapshot(categoryId: string): Promise<ScraperCategorySnapshot | null> {
    const db = await getDb();
    const collection = db.collection<ScraperCategorySnapshot>("scraper_snapshots");
    
    return collection.findOne(
      { categoryId },
      { sort: { capturedAt: -1 } }
    );
  },

  /**
   * Comparar estado actual con anterior para detectar cambios
   * Compara contra el ÚLTIMO SNAPSHOT, no contra el estado
   */
  async hasChanged(categoryId: string, currentHash: string): Promise<boolean> {
    const snapshot = await this.getLastSnapshot(categoryId);
    if (!snapshot) {
      // Nunca se scrapeó - es un cambio
      return true;
    }
    // Si el hash del snapshot es diferente al actual, hubo cambios
    return snapshot.contentHash !== currentHash;
  },

  /**
   * Asegurar índices
   */
  async ensureIndexes(): Promise<void> {
    const db = await getDb();
    const stateCollection = db.collection<ScraperCategoryState>(COLLECTION_NAME);
    const snapshotCollection = db.collection("scraper_snapshots");
    
    await stateCollection.createIndex({ categoryId: 1 }, { unique: true });
    await stateCollection.createIndex({ lastScrapeAt: 1 });
    await stateCollection.createIndex({ status: 1 });
    
    await snapshotCollection.createIndex({ categoryId: 1, capturedAt: -1 });
  }
};