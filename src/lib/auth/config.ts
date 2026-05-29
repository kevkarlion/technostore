/**
 * Auth configuration — edit these via environment variables.
 *
 * JWT_SECRET:       Secret key used to sign and verify JWT tokens.
 *                    Generate a strong one: openssl rand -base64 32
 *
 * ADMIN_EMAIL:      Email for admin login.
 * ADMIN_PASSWORD:   Password for admin login.
 */
export const AUTH_CONFIG = {
  jwtSecret: process.env.JWT_SECRET!,
  adminEmail: process.env.ADMIN_EMAIL!,
  adminPassword: process.env.ADMIN_PASSWORD!,
  tokenExpiry: "24h",
  cookieName: "admin-token",
} as const;

/** Validate that required config values are set at startup */
export function validateAuthConfig(): string[] {
  const missing: string[] = [];
  if (!AUTH_CONFIG.jwtSecret) missing.push("JWT_SECRET");
  if (!AUTH_CONFIG.adminEmail) missing.push("ADMIN_EMAIL");
  if (!AUTH_CONFIG.adminPassword) missing.push("ADMIN_PASSWORD");
  return missing;
}
