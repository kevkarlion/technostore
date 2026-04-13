import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { getEnv } from "@/config/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for supplier images (local fallback)
const SUPPLIER_IMAGES_DIR = path.join(process.cwd(), "public", "images", "suppliers");

export interface DownloadedImage {
  localPath: string;
  cloudinaryUrl?: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Ensure the supplier images directory exists (local fallback)
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
 * Upload an image to Cloudinary or return original URL
 * This is the PRIMARY method - always tries Cloudinary first
 */
export async function uploadProductImage(
  imageUrl: string,
  supplier: string,
  productId: string,
  imageIndex: number = 0
): Promise<DownloadedImage> {
  try {
    const env = getEnv();
    
    // Skip if already Cloudinary
    if (imageUrl.includes("cloudinary.com")) {
      return {
        localPath: "",
        cloudinaryUrl: imageUrl,
        url: imageUrl,
        success: true,
      };
    }
    
    // Convert relative URLs to absolute
    let fullUrl = imageUrl;
    if (imageUrl.startsWith("imagenes/") || imageUrl.startsWith("/imagenes/")) {
      fullUrl = `https://jotakp.dyndns.org/${imageUrl.replace(/^\//, "")}`;
    } else if (!imageUrl.startsWith("http")) {
      fullUrl = `https://jotakp.dyndns.org/${imageUrl}`;
    }
    
    // Try to upload to Cloudinary
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
      const cloudResult = await uploadImageToCloudinary(fullUrl, supplier, productId, imageIndex);
      
      if (cloudResult.success && cloudResult.url) {
        console.log(`[ImageUpload] Cloudinary: ${productId}/${imageIndex}`);
        
        return {
          localPath: "",
          cloudinaryUrl: cloudResult.url,
          url: fullUrl,
          success: true,
        };
      }
      
      console.log(`[ImageUpload] Cloudinary failed, using original: ${fullUrl.substring(0, 50)}...`);
    }
    
    // If no Cloudinary, use the original URL (jotakp)
    return {
      localPath: "",
      cloudinaryUrl: "",
      url: fullUrl,
      success: true,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ImageUpload] Failed: ${imageUrl.substring(0, 50)}... - ${errorMsg}`);
    
    return {
      localPath: "",
      url: imageUrl,
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Download an image from a URL and upload to Cloudinary
 * Falls back to local storage if Cloudinary fails
 * @deprecated Use uploadProductImage instead
 */
export async function downloadImage(
  imageUrl: string,
  supplier: string,
  productId: string,
  imageIndex: number = 0
): Promise<DownloadedImage> {
  try {
    const env = getEnv();
    
    // Try to upload to Cloudinary (always in production, optional in dev)
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
      const cloudResult = await uploadImageToCloudinary(imageUrl, supplier, productId, imageIndex);
      
      if (cloudResult.success && cloudResult.url) {
        console.log(`[ImageDownloader] Uploaded to Cloudinary: ${productId}`);
        
        return {
          localPath: "",
          cloudinaryUrl: cloudResult.url,
          url: imageUrl,
          success: true,
        };
      }
    }
    
    // Fallback to local storage
    const supplierDir = await ensureImageDirectory(supplier);
    
    const pathname = new URL(imageUrl).pathname;
    const ext = path.extname(pathname) || ".jpg";
    
    const imageIdMatch = pathname.match(/(?:imagen|0+)(\d+)\.[a-zA-Z]+$/i);
    const imageId = imageIdMatch ? imageIdMatch[1] : pathname.slice(-20).replace(/[^a-z0-9]/gi, "");
    
    const filename = `${supplier}_${productId}_${imageId}${ext}`;
    const localPath = path.join(supplierDir, filename);
    
    if (fs.existsSync(localPath)) {
      return {
        localPath: `/images/suppliers/${supplier}/${filename}`,
        url: imageUrl,
        success: true,
      };
    }
    
    // Download locally
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
    
    fs.writeFileSync(localPath, buffer);
    
    console.log(`[ImageDownloader] Downloaded locally: ${filename}`);
    
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
 * Upload multiple images for products to Cloudinary
 * This is the PRIMARY method for image handling
 * @param images - Array of image URLs
 * @param supplier - Supplier name
 * @param productId - Product ID
 * @returns Array of Cloudinary URLs or original URLs
 */
export async function uploadProductImages(
  images: string[],
  supplier: string,
  productId: string
): Promise<string[]> {
  const cloudUrls: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const imageUrl = images[i];
    const result = await uploadProductImage(imageUrl, supplier, productId, i);
    
    if (result.success) {
      // Use Cloudinary URL if available, otherwise fallback to original
      const url = result.cloudinaryUrl || result.url;
      if (url) {
        cloudUrls.push(url);
      }
    }
  }
  
  return cloudUrls;
}

/**
 * Download multiple images for products
 * @param images - Array of image URLs
 * @param supplier - Supplier name
 * @param productId - Product ID
 * @returns Array of local image paths
 * @deprecated Use uploadProductImages instead
 */
export async function downloadProductImages(
  images: string[],
  supplier: string,
  productId: string
): Promise<string[]> {
  const cloudUrls: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const imageUrl = images[i];
    
    // Try new upload method first
    const result = await uploadProductImage(imageUrl, supplier, productId, i);
    
    if (result.success && (result.cloudinaryUrl || result.url)) {
      cloudUrls.push(result.cloudinaryUrl || result.url);
      continue;
    }
    
    // Fallback to old download method
    const oldResult = await downloadImage(imageUrl, supplier, productId, i);
    
    if (oldResult.success && oldResult.localPath) {
      cloudUrls.push(oldResult.localPath);
    }
  }
  
  return cloudUrls;
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
