import type { DatabaseConfig } from "../shared/protocol"

/**
 * ============================================================================
 * TyreMate Centralized Database Environment Configuration
 * ============================================================================
 *
 * This file centralizes database connection settings directly in the codebase,
 * separating Development and Production environments.
 *
 * - When `IS_DATABASE_CONFIG_LOCKED` is `true`:
 *   Manual configuration via the `/setup` page and Admin panel is temporarily
 *   disabled. The application automatically connects to the credentials below
 *   based on whether it is running in development (`npm run dev`) or
 *   production (`npm run build` / GitHub Pages / hosted).
 *
 * - Put your Turso / libSQL URL and Auth Token directly into the constants below,
 *   or provide them via environment variables (.env.local, .env.production, or CI/CD).
 */

// Toggle to temporarily lock or unlock manual setup in the UI
export const IS_DATABASE_CONFIG_LOCKED = true


// ----------------------------------------------------------------------------
// 1. DEVELOPMENT DATABASE CONFIGURATION (used during `npm run dev`)
// ----------------------------------------------------------------------------
export const DEV_DATABASE_CONFIG = {
  // Put your development Turso / libSQL database URL here or in .env.local:
  url:
    process.env.NEXT_PUBLIC_DEV_DB_URL ||
    process.env.NEXT_PUBLIC_TM_DB_URL ||
    process.env.TURSO_DB_URL ||
    "",
  // Put your development Turso / libSQL Auth Token here or in .env.local:
  authToken:
    process.env.NEXT_PUBLIC_DEV_DB_TOKEN ||
    process.env.NEXT_PUBLIC_TM_DB_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    "",
}

// ----------------------------------------------------------------------------
// 2. PRODUCTION DATABASE CONFIGURATION (used during `npm run build` / production)
// ----------------------------------------------------------------------------
export const PROD_DATABASE_CONFIG = {
  // Put your production Turso / libSQL database URL here or via GitHub Secrets:
  url:
    process.env.NEXT_PUBLIC_PROD_DB_URL ||
    process.env.NEXT_PUBLIC_TM_DB_URL ||
    process.env.TURSO_DB_URL ||
    "",
  // Put your production Turso / libSQL Auth Token here or via GitHub Secrets:
  authToken:
    process.env.NEXT_PUBLIC_PROD_DB_TOKEN ||
    process.env.NEXT_PUBLIC_TM_DB_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    "",
}

/**
 * Returns true if running in a production environment (Next.js production build).
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production"
}

/**
 * Returns whether database configuration editing is temporarily locked to code.
 */
export function isDatabaseConfigLocked(): boolean {
  return IS_DATABASE_CONFIG_LOCKED
}

/**
 * Resolves the active database configuration for the current environment.
 */
export function getActiveCodeDatabaseConfig(): DatabaseConfig {
  const isProd = isProductionEnvironment()
  const active = isProd ? PROD_DATABASE_CONFIG : DEV_DATABASE_CONFIG

  const url = (active.url || "").trim()
  const token = (active.authToken || "").trim()

  // If no remote URL is provided or explicitly set to "local", fall back to in-browser SQLite
  if (!url || url.toLowerCase() === "local") {
    return { driver: "local" }
  }

  return token ? { driver: "libsql", url, authToken: token } : { driver: "libsql", url }
}
