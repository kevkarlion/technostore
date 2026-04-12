export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing env var: ${key}`);
  }
  return value;
}

export const config = {
  // MongoDB
  MONGO_URI: getEnv('MONGO_URI'),
  DB_NAME: getEnv('DB_NAME', 'technostore'),
  
  // Scraper
  SUPPLIER_URL: getEnv('SUPPLIER_URL', 'https://jotakp.dyndns.org'),
  SUPPLIER_LOGIN_URL: getEnv('SUPPLIER_LOGIN_URL', 'http://jotakp.dyndns.org/loginext.aspx'),
  SUPPLIER_EMAIL: getEnv('SUPPLIER_EMAIL'),
  SUPPLIER_PASSWORD: getEnv('SUPPLIER_PASSWORD'),
  
  // Delay
  SUPPLIER_DELAY_MS: parseInt(getEnv('SUPPLIER_DELAY_MS', '3000')),
  SCRAPER_MIN_INTERVAL_MS: parseInt(getEnv('SCRAPER_MIN_INTERVAL_MS', '3600000')), // 1 hour
};