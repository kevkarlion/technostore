import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/config/env";

// Initialize Cloudinary
export function initCloudinary() {
  const env = getEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload an image to Cloudinary directly from URL
 * @param imageUrl - The URL of the image to upload
 * @param publicId - The public ID for the image (optional)
 * @returns The Cloudinary URL and public ID
 */
export async function uploadImageToCloudinary(
  imageUrl: string,
  supplier: string,
  productId: string,
  imageIndex: number
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  try {
    const env = getEnv();
    initCloudinary();

    const publicId = `${env.CLOUDINARY_FOLDER || "technostore"}/${supplier}/${productId}_${imageIndex}`;

    // Upload from URL
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: `${env.CLOUDINARY_FOLDER || "technostore"}/${supplier}`,
      transformation: [
        { width: 800, height: 800, crop: "limit" }, // Limit max size
        { quality: "auto", fetch_format: "auto" },   // Optimize
      ],
    });

    console.log(`[Cloudinary] Uploaded: ${result.secure_url}`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(`[Cloudinary] Upload error:`, error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImageFromCloudinary(
  publicId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    initCloudinary();
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get optimized Cloudinary URL
 */
export function getCloudinaryUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  }
): string {
  const env = getEnv();
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  
  const transformations = [];
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  transformations.push(`q_${options?.quality || "auto"}`);
  transformations.push(`f_${options?.format || "auto"}`);
  
  const tr = transformations.join(",");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${tr}/${publicId}`;
}