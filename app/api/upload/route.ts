import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/config/env";
import { internalServerError } from "@/api/errors/http-error";

export async function POST(req: NextRequest) {
  try {
    const env = getEnv();
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado" },
        { status: 500 }
      );
    }

    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se envió ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload a Cloudinary usando upload_stream
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `${env.CLOUDINARY_FOLDER || "technostore"}/admin`,
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve({ secure_url: result.secure_url, public_id: result.public_id });
            else reject(new Error("Upload failed"));
          }
        );
        uploadStream.end(buffer);
      }
    );

    return NextResponse.json(
      { url: result.secure_url, publicId: result.public_id },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Upload] Error:", error);
    const fallback = internalServerError();
    return NextResponse.json(
      { message: fallback.message },
      { status: fallback.status }
    );
  }
}
