import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for supplier images
const SUPPLIER_IMAGES_DIR = path.join(process.cwd(), "public", "images", "suppliers");

export interface DownloadedImage {
  localPath: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Ensure the supplier images directory exists
 */
export async function ensureImageDirectory(supplier: string): Promise<string> {
  const supplierDir = path.join(SUPPLIER_IMAGES_DIR, supplier);
  
  if (!fs.existsSync(supplierDir)) {
    fs.mkdirSync(supplierDir, { recursive: true });
    console.log(`[ImageDownloader] Created directory: ${supplierDir}`);
  }
  
  return supplierDir;
}

/**
 * Download an image from a URL and save it locally
 * @param imageUrl - The URL of the image to download
 * @param supplier - The supplier name (used for folder organization)
 * @param productId - The product ID (used for filename)
 * @returns The local path where the image was saved
 */
export async function downloadImage(
  imageUrl: string,
  supplier: string,
  productId: string
): Promise<DownloadedImage> {
  try {
    // Ensure directory exists
    const supplierDir = await ensureImageDirectory(supplier);
    
    // Determine file extension from URL
    const pathname = new URL(imageUrl).pathname;
    const ext = path.extname(pathname) || ".jpg";
    
    // Extract the image ID from the URL (e.g., imagenes/000028904.PNG -> 000028904)
    // This ensures consistent naming across different file types
    const imageIdMatch = pathname.match(/(?:imagen|0+)(\d+)\.[a-zA-Z]+$/i);
    const imageId = imageIdMatch ? imageIdMatch[1] : pathname.slice(-20).replace(/[^a-z0-9]/gi, "");
    
    // Create filename: {supplier}_{productId}_{imageId}.{ext}
    // Example: jotakp_21884_000028904.PNG
    const filename = `${supplier}_${productId}_${imageId}${ext}`;
    const localPath = path.join(supplierDir, filename);
    
    // Check if already exists
    if (fs.existsSync(localPath)) {
      console.log(`[ImageDownloader] Image already exists: ${filename}`);
      return {
        localPath: `/images/suppliers/${supplier}/${filename}`,
        url: imageUrl,
        success: true,
      };
    }
    
    // Download the image
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write to file
    fs.writeFileSync(localPath, buffer);
    
    console.log(`[ImageDownloader] Downloaded: ${filename}`);
    
    return {
      localPath: `/images/suppliers/${supplier}/${filename}`,
      url: imageUrl,
      success: true,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ImageDownloader] Failed to download ${imageUrl}: ${errorMsg}`);
    
    return {
      localPath: "",
      url: imageUrl,
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Download multiple images for products
 * @param images - Array of image URLs
 * @param supplier - Supplier name
 * @param productId - Product ID
 * @returns Array of local image paths
 */
export async function downloadProductImages(
  images: string[],
  supplier: string,
  productId: string
): Promise<string[]> {
  const localPaths: string[] = [];
  
  for (const imageUrl of images) {
    const result = await downloadImage(imageUrl, supplier, productId);
    
    if (result.success && result.localPath) {
      localPaths.push(result.localPath);
    }
  }
  
  return localPaths;
}

/**
 * Get the count of downloaded images for a supplier
 */
export function getSupplierImageCount(supplier: string): number {
  const supplierDir = path.join(SUPPLIER_IMAGES_DIR, supplier);
  
  if (!fs.existsSync(supplierDir)) {
    return 0;
  }
  
  const files = fs.readdirSync(supplierDir);
  return files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).length;
}
