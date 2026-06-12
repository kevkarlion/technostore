/**
 * Email module configuration.
 * Loads SMTP credentials from env vars.
 * All fields optional so emails degrade gracefully when unconfigured.
 */

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromAddress: string;
  fromName: string;
  adminEmail: string;
}

let _config: SmtpConfig | null = null;

export function getSmtpConfig(): SmtpConfig | null {
  if (_config) return _config;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : NaN;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromAddress = process.env.SMTP_FROM_ADDRESS;
  const fromName = process.env.SMTP_FROM_NAME || "TechnoStore";
  // SMTP_ADMIN_EMAIL overrides ADMIN_EMAIL for admin notifications (local dev)
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

  if (!host || !user || !pass || !fromAddress || !adminEmail) {
    console.warn("[Email] SMTP not fully configured — emails will be skipped");
    return null;
  }

  _config = {
    host,
    port: Number.isFinite(port) ? port : 587,
    user,
    pass,
    fromAddress,
    fromName,
    adminEmail,
  };

  return _config;
}
