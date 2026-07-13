/**
 * Migration script: Add slug and searchName to products that don't have them.
 * 
 * Usage: npx tsx scripts/migrate-add-slugs.ts
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'ecommerce';

if (!MONGO_URI) {
  console.error('MONGO_URI is required');
  process.exit(1);
}

/**
 * Generate a URL-friendly slug from product name.
 */
function generateProductSlug(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '')         // Remove leading/trailing dashes
    .replace(/-+/g, '-');            // Replace multiple dashes with single
}

/**
 * Normalize text for search.
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection('products');

    // Find products without slug or with empty slug
    const productsWithoutSlug = await collection.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).toArray();

    console.log(`Found ${productsWithoutSlug.length} products without slug`);

    if (productsWithoutSlug.length === 0) {
      console.log('No products to migrate. Exiting.');
      return;
    }

    // Update each product
    let updated = 0;
    for (const product of productsWithoutSlug) {
      if (!product.name) {
        console.log(`Skipping product without name: ${product._id}`);
        continue;
      }

      const slug = generateProductSlug(product.name);
      const searchName = normalizeText(product.name);

      await collection.updateOne(
        { _id: product._id },
        { 
          $set: { 
            slug, 
            searchName,
            updatedAt: new Date()
          } 
        }
      );

      console.log(`Updated: ${product.name.substring(0, 50)}... -> ${slug}`);
      updated++;
    }

    console.log(`\n✅ Migration complete. Updated ${updated} products.`);
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);