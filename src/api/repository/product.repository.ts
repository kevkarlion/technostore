import { ObjectId } from "mongodb";
import { getDb } from "@/config/db";
import type { CreateProductDTO, UpdateProductDTO, ScrapedProductDTO } from "@/domain/dto/product.dto";
import { productMapper } from "@/domain/mappers/product.mapper";
import type { Product } from "@/domain/models/product";
import { generateProductSlug, cleanProductName } from "@/domain/mappers/product-to-presentation";

const COLLECTION_NAME = "products";

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  allStatuses?: boolean;
  status?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const productRepository = {
  async findPaginated(
    params: ListProductsParams = {}
  ): Promise<PaginatedResult<Product>> {
    const db = await getDb();

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const collection = db.collection(COLLECTION_NAME);

    const filter: Record<string, any> = {};
    if (params.status) {
      filter.status = params.status;
    } else if (!params.allStatuses) {
      filter.status = "active";
    }
    if (params.search && params.search.trim()) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      collection
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) => productMapper.toDomain(doc as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findFeatured(limit = 8): Promise<Product[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const docs = await collection
      .find({ 
        status: "active"
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => productMapper.toDomain(doc as any));
  },

  /**
   * Search products by name (case-insensitive and accent-insensitive).
   * Returns ALL products matching the query, regardless of status or stock.
   */
  async searchByName(
    query: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ items: Product[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));

    if (!query || !query.trim()) {
      return { items: [], total: 0, page, limit };
    }

    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Normalize the query: remove accents and convert to lowercase
    const normalizedQuery = query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    // Fetch active products only (discontinued should not appear in search)
    const docs = await collection
      .find({ status: "active" })
      .toArray();

    const products = docs.map((doc) => productMapper.toDomain(doc as any));

    // Split query into words for partial/fuzzy matching
    // e.g. "silla oficina" matches "Silla de Oficina" (both words appear)
    const words = normalizedQuery.split(/\s+/).filter(Boolean);

    // Filter by normalized name (accent and case insensitive)
    const filtered = products.filter((p) => {
      if (!p.name) return false;
      const normalizedName = p.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      // All words must appear in the name (order-independent)
      return words.every((word) => normalizedName.includes(word));
    });

    // Apply pagination
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { items, total, page, limit };
  },

  async create(data: CreateProductDTO): Promise<Product> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();

    const result = await collection.insertOne({
      ...data,
      costPrice: data.costPrice,
      profitMargin: data.profitMargin,
      createdAt: now,
      updatedAt: now,
    });

    const inserted = await collection.findOne({
      _id: result.insertedId,
    });

    if (!inserted) {
      throw new Error("Failed to load inserted product");
    }

    return productMapper.toDomain(inserted as any);
  },

  async findById(id: string): Promise<Product | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const doc = await collection.findOne({
      _id: new ObjectId(id),
    });

    if (!doc) return null;

    return productMapper.toDomain(doc as any);
  },

  async update(id: string, data: UpdateProductDTO): Promise<Product | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();

    const setFields: Record<string, any> = { ...data, costPrice: data.costPrice, profitMargin: data.profitMargin, updatedAt: now };

    // Si se están actualizando imageUrls y contienen URLs de Cloudinary,
    // sincronizar también cloudinaryUrls para que el front las muestre
    if (data.imageUrls && data.imageUrls.length > 0) {
      const cloudinaryUrls = data.imageUrls.filter(
        (url: string) => url.includes("res.cloudinary.com")
      );
      if (cloudinaryUrls.length > 0) {
        setFields.cloudinaryUrls = cloudinaryUrls;
      }
    }

    const doc = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: setFields },
      { returnDocument: "after" }
    );

    if (!doc) return null;

    return productMapper.toDomain(doc as any);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    await collection.deleteOne({
      _id: new ObjectId(id),
    });
  },

  async deleteAll(): Promise<{ deletedCount: number }> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.deleteMany({});
    return { deletedCount: result.deletedCount };
  },

  /**
   * Atomic upsert - solo actualiza campos que cambiaron
   * Similar a Git: solo hace commit si hay cambios reales
   */
  async atomicUpsertByExternalId(data: ScrapedProductDTO): Promise<{
    product: Product;
    created: boolean;
    updated: boolean;
    changes: string[];
  }> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();
    const changes: string[] = [];

    // 1. Verificar si el producto existe
    const existing = await collection.findOne({
      externalId: data.externalId,
      supplier: data.supplier,
    });

    if (!existing) {
      // Producto nuevo - crear
      // Set costPrice from scraper price, selling price starts equal to cost (0% margin)
      const insertData = {
        ...data,
        costPrice: data.price,
        lastSyncedAt: now,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(insertData);

      const inserted = await collection.findOne({ _id: result.insertedId });
      return {
        product: productMapper.toDomain(inserted as any),
        created: true,
        updated: false,
        changes: ["CREATE"],
      };
    }

    // 2. Producto existente - comparar campos y solo actualizar los que cambiaron
    const updateOperations: Record<string, any> = {
      lastSyncedAt: now,
      updatedAt: now,
    };

    // Comparar cada campo
    // NOTE: "price" is NOT in this list — the scraper updates costPrice, not selling price.
    // Selling price is managed via admin margins (costPrice * (1 + margin/100)).
    const fieldsToCompare = [
      { key: "name", newVal: data.name },
      { key: "description", newVal: data.description },
      { key: "priceRaw", newVal: data.priceRaw },
      { key: "currency", newVal: data.currency },
      { key: "stock", newVal: data.stock },
      { key: "sku", newVal: data.sku },
      { key: "categories", newVal: data.categories },
      { key: "attributes", newVal: data.attributes || [] },
    ];

    // Update costPrice from scraper data (the supplier price)
    // This is separate from the selling price field
    if (data.price !== undefined) {
      const existingCost = (existing as any).costPrice;
      if (JSON.stringify(existingCost) !== JSON.stringify(data.price)) {
        updateOperations.costPrice = data.price;
        changes.push("costPrice");

        // Recalculate selling price if product has a margin set
        const existingMargin = (existing as any).profitMargin;
        if (existingMargin != null && existingMargin > 0) {
          const newPrice = Math.round(data.price * (1 + existingMargin / 100) * 100) / 100;
          updateOperations.price = newPrice;
          changes.push("price");
        }
      }
    }

    for (const field of fieldsToCompare) {
      const existingVal = (existing as any)[field.key];
      const newVal = field.newVal;

      // Para priceRaw: siempre actualizar si viene en el nuevo data
      let hasChanged: boolean;
      if (field.key === 'priceRaw') {
        hasChanged = newVal !== undefined;
        console.log(`[Repo] priceRaw: existing=${existingVal}, new=${newVal}, hasChanged=${hasChanged}, willUpdate=${hasChanged ? newVal : 'skip'}`);
      } else {
        hasChanged = JSON.stringify(existingVal) !== JSON.stringify(newVal);
      }

      if (hasChanged) {
        updateOperations[field.key] = newVal;
        changes.push(field.key);
      }
    }

    // 3. Imágenes - lógica especial
    // Solo actualizar si vinieron nuevas Y son válidas
    const existingImages = existing.imageUrls || [];
    const newImages = data.imageUrls || [];

    // Si hay nuevas imágenes distintas a las existentes, actualizar
    const imagesChanged = newImages.length > 0 &&
      JSON.stringify(existingImages) !== JSON.stringify(newImages);

    if (imagesChanged) {
      updateOperations.imageUrls = newImages;
      changes.push("imageUrls");
    } else if (newImages.length === 0 && existingImages.length > 0) {
      // No vinieron imágenes pero ya existían - NO sobreescribir (preservar)
      console.log(`[Repo] Preservando imágenes existentes para ${data.externalId}`);
    }

    // 4. Si hay cambios, actualizar
    if (changes.length > 0) {
      await collection.updateOne(
        { _id: existing._id },
        { $set: updateOperations }
      );
    }

    // 5. Siempre marcar como "seen" (activo)
    await collection.updateOne(
      { _id: existing._id },
      { $set: { status: "active", lastSeenAt: now } }
    );

    const updated = await collection.findOne({ _id: existing._id });

    return {
      product: productMapper.toDomain(updated as any),
      created: false,
      updated: changes.length > 0,
      changes,
    };
  },

  /**
   * Marcar productos como descontinuados
   * Llama después del scrapeo para marcar los que no aparecen
   */
  async markDiscontinued(supplier: string, externalIds: string[]): Promise<number> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.updateMany(
      {
        supplier,
        externalId: { $nin: externalIds },
        status: "active",
      },
      {
        $set: {
          status: "discontinued",
          discontinuedAt: new Date(),
        },
      }
    );

    return result.modifiedCount;
  },

  /**
   * Obtener productos no vistos en el último scrapeo
   */
  async findUnseen(supplier: string, lastSync: Date): Promise<Product[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const docs = await collection
      .find({
        supplier,
        lastSeenAt: { $lt: lastSync },
        status: "active",
      })
      .toArray();

    return docs.map((doc) => productMapper.toDomain(doc as any));
  },

  // Wrapper legacy para compatibilidad
  async upsertByExternalId(data: ScrapedProductDTO): Promise<Product> {
    const result = await this.atomicUpsertByExternalId(data);
    return result.product;
  },

  async findByCategorySlug(
    categorySlug: string,
    limit = 20
  ): Promise<Product[]> {
    const db = await getDb();
    const productsCollection = db.collection(COLLECTION_NAME);
    const categoriesCollection = db.collection("categories");

    // Find category by slug to get its name and supplierCategoryId
    // Direct search by category slug - ignore categories collection
    const docs = await productsCollection
      .find({ 
        categories: categorySlug,
        status: "active"
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => productMapper.toDomain(doc as any));
  },

  async findByCategorySlugPaginated(
    categorySlug: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResult<Product>> {
    const db = await getDb();
    const productsCollection = db.collection(COLLECTION_NAME);
    const categoriesCollection = db.collection("categories");

    // Find category by slug to get its name and supplierCategoryId
// Direct search by category slug
    const filter = { 
      categories: categorySlug,
      status: "active"
    };
    
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      productsCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      productsCollection.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) => productMapper.toDomain(doc as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findBySlug(slug: string): Promise<Product | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const targetSlug = slug.toLowerCase();

    // Find by matching slug generation (no fallback by externalId to avoid bugs)
    const docs = await collection
      .find({ status: "active" })
      .toArray();

    for (const doc of docs) {
      // Using generateProductSlug (which includes cleanProductName) 
      // plus cleanProductName only version
      const fullSlug = generateProductSlug(doc.name);
      const cleanedSlug = generateProductSlug(cleanProductName(doc.name));

      if (fullSlug === targetSlug || cleanedSlug === targetSlug) {
        return productMapper.toDomain(doc as any);
      }
    }

    return null;
  },

  async search(query: string, limit = 20): Promise<Product[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const docs = await collection
      .find({
        status: "active",
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => productMapper.toDomain(doc as any));
  },

  /**
   * Filtra productos por categoría con filtros adicionales (precio, marca)
   */
  async findByCategorySlugFiltered(
    categorySlug: string,
    page: number,
    limit: number,
    filters: {
      priceMin?: number;
      priceMax?: number;
      brands?: string[];
    }
  ): Promise<PaginatedResult<Product>> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Build filter
    const filter: Record<string, any> = {
      categories: categorySlug,
      status: "active",
    };

    // Price range filter
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      filter.price = {};
      if (filters.priceMin !== undefined) {
        filter.price.$gte = filters.priceMin;
      }
      if (filters.priceMax !== undefined) {
        filter.price.$lte = filters.priceMax;
      }
    }

    // Brand filter (extract from name)
    if (filters.brands && filters.brands.length > 0) {
      // Create regex patterns for each brand
      const brandPatterns = filters.brands.map(brand => 
        new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      );
      filter.$or = brandPatterns.map(pattern => ({ name: pattern }));
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) => productMapper.toDomain(doc as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Obtiene precios mínimo y máximo de una categoría
   */
  async getPriceRangeByCategory(categorySlug: string): Promise<{ min: number; max: number }> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.aggregate([
      { $match: { categories: categorySlug, status: "active" } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]).toArray();

    if (result.length === 0) {
      return { min: 0, max: 100000 };
    }

    return {
      min: Math.floor(result[0].minPrice || 0),
      max: Math.ceil(result[0].maxPrice || 100000),
    };
  },

  /**
   * Obtiene marcas disponibles en una categoría con conteo de productos
   * Detecta marcas dinámicamente desde los nombres de productos
   */
  async getBrandsByCategory(categorySlug: string): Promise<{ brand: string; count: number }[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Palabras a excluir (no son marcas)
    const excludedWords = new Set([
      "para", "con", "sin", "de", "el", "la", "los", "las", "un", "una",
      "usb", "hdmi", "vga", "aux", "bluetooth", "wifi", "led", "rgb",
      "pro", "plus", "max", "mini", "nano", "micro", "smart", "wireless",
      "inalambrico", "inalámbrico", "recargable", "gamer", "gaming",
      "premium", "ultimate", "edition", "series", "gen", "version",
      "new", "original", "genuino", "compatible", "refurbished"
    ]);

    // Palabras que parecen marcas (capitalizadas o acrónimos)
    const likelyBrands = new Set([
      "Kolke", "Ugreen", "Netmak", "Nisuta", "Perfect", "Oculus",
      "Logitech", "JBL", "Sony", "Redragon", "HyperX", "Razer", "Corsair",
      "Samsung", "LG", "Philips", "Xiaomi", "Huawei", "Apple", "Microsoft",
      "Lenovo", "HP", "Dell", "Asus", "Acer", "MSI", "Gigabyte", "Nvidia",
      "Kingston", "Western", "Seagate", "Crucial", "Sandisk", "Toshiba",
      "Soundcore", "Anker", "Edifier", "Bose", "Sennheiser", "Audio",
      "Genius", "Trust", "Thermaltake", "Coolermaster", "Mars", "Targus",
      "Belkin", "Fellowes", "Verbatim", "Klip", "Qin", "Fantech",
      "Red", "Black", "White", "Silver", "Gold", "Premium", "Super"
    ]);

    const products = await collection
      .find({ categories: categorySlug, status: "active" })
      .project({ name: 1 })
      .toArray();

    const brandCounts: Record<string, number> = {};

    // Extract brand from product name - detect first word(s)
    for (const product of products) {
      const name = product.name || "";
      
      // Get first word (before first space/parenthesis/number)
      const firstWord = name.replace(/^([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+).*$/, '$1').trim();
      
      if (firstWord && firstWord.length >= 3 && firstWord.length <= 20) {
        // Check if it's not in excluded words
        if (!excludedWords.has(firstWord.toLowerCase())) {
          brandCounts[firstWord] = (brandCounts[firstWord] || 0) + 1;
        }
      }

      // Also check for likely brands anywhere in name
      for (const brand of likelyBrands) {
        if (name.toLowerCase().includes(brand.toLowerCase())) {
          brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        }
      }
    }

    // Sort by count descending and filter brands with at least 2 products
    return Object.entries(brandCounts)
      .filter(([_, count]) => count >= 1)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 brands
  },
};