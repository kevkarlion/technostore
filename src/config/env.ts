import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: z.string().min(1, "MONGODB_DB_NAME is required"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().optional(),
  // Cron
  CRON_SECRET: z.string().optional(),
  // Mercado Pago
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, "MERCADOPAGO_ACCESS_TOKEN is required"),
  NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: z.string().min(1, "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY is required"),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  // Email (SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_ADDRESS: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  // Supplier scraper configuration
  SUPPLIER_URL: z.string().url().optional(),
  SUPPLIER_LOGIN_URL: z.string().url().optional(),
  SUPPLIER_EMAIL: z.string().min(1).optional(),
  SUPPLIER_PASSWORD: z.string().min(1).optional(),
  SUPPLIER_DELAY_MS: z.coerce.number().min(0).default(5000),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  _env = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER,
    CRON_SECRET: process.env.CRON_SECRET,
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
    MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM_ADDRESS: process.env.SMTP_FROM_ADDRESS,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    SUPPLIER_URL: process.env.SUPPLIER_URL,
    SUPPLIER_LOGIN_URL: process.env.SUPPLIER_LOGIN_URL,
    SUPPLIER_EMAIL: process.env.SUPPLIER_EMAIL,
    SUPPLIER_PASSWORD: process.env.SUPPLIER_PASSWORD,
    SUPPLIER_DELAY_MS: process.env.SUPPLIER_DELAY_MS,
  });

  return _env;
}

