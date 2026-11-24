import type { DatabaseConfig } from "../shared/protocol"
import {
  isDatabaseConfigLocked,
  getActiveCodeDatabaseConfig,
  isProductionEnvironment,
} from "../config/databaseCredentials"

export { isDatabaseConfigLocked, getActiveCodeDatabaseConfig, isProductionEnvironment }

/**
 * Database connection settings for THIS browser. They must live outside the
 * database (chicken and egg), so they are kept in localStorage and can be
 * shared to other devices with a connection code from the admin panel.
 *
 * When code configuration is locked (IS_DATABASE_CONFIG_LOCKED = true),
 * credentials from web/config/databaseCredentials.ts are enforced for development
 * and production, and manual setup is temporarily disabled.
 */
const STORAGE_KEY = "tyremate.dbConfig"
const SESSION_KEY = "tyremate.session"

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // storage unavailable (private mode); config falls back to defaults
  }
}

export function defaultDatabaseConfig(): DatabaseConfig {
  if (isDatabaseConfigLocked()) {
    return getActiveCodeDatabaseConfig()
  }
  const url = process.env.NEXT_PUBLIC_TM_DB_URL
  return url ? { driver: "libsql", url } : { driver: "local" }
}

export function validateDatabaseConfig(value: unknown): DatabaseConfig {
  const v = value as Partial<DatabaseConfig> & { url?: string; authToken?: string }
  if (!v || typeof v !== "object") throw new Error("Invalid database configuration")
  if (v.driver === "local") return { driver: "local" }
  if (v.driver === "libsql") {
    const url = String(v.url ?? "").trim()
    if (!/^(libsql|https?|wss?):\/\//i.test(url) && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url)) {
      throw new Error("Enter a valid database URL, e.g. libsql://your-db.turso.io")
    }
    if (/^http:\/\//i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)) {
      throw new Error("Use https:// (or libsql://) for remote databases; plain http is only allowed for localhost")
    }
    const authToken = String(v.authToken ?? "").trim()
    return authToken ? { driver: "libsql", url, authToken } : { driver: "libsql", url }
  }
  throw new Error("Unknown database driver")
}

export function loadDatabaseConfig(): DatabaseConfig {
  if (isDatabaseConfigLocked()) {
    return getActiveCodeDatabaseConfig()
  }
  const raw = readStorage(STORAGE_KEY)
  if (!raw) return defaultDatabaseConfig()
  try {
    return validateDatabaseConfig(JSON.parse(raw))
  } catch {
    return defaultDatabaseConfig()
  }
}

export function saveDatabaseConfig(config: DatabaseConfig) {
  if (isDatabaseConfigLocked()) {
    throw new Error("Database configuration is locked in code and cannot be modified from setup.")
  }
  writeStorage(STORAGE_KEY, JSON.stringify(validateDatabaseConfig(config)))
}

export function hasSavedDatabaseConfig(): boolean {
  return readStorage(STORAGE_KEY) !== null
}

/** Base64url "connection code" so admins can configure staff devices quickly. */
export function encodeConnectionCode(config: DatabaseConfig): string {
  const json = JSON.stringify(validateDatabaseConfig(config))
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return `TM1.${b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`
}

export function decodeConnectionCode(code: string): DatabaseConfig {
  const trimmed = code.trim()
  if (!trimmed.startsWith("TM1.")) throw new Error("Not a TyreMate connection code")
  const b64 = trimmed.slice(4).replace(/-/g, "+").replace(/_/g, "/")
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
  let parsed: unknown
  try {
    parsed = JSON.parse(decodeURIComponent(escape(atob(padded))))
  } catch {
    throw new Error("The connection code is damaged")
  }
  return validateDatabaseConfig(parsed)
}

/** The logged-in user mirrors Electron's session.json; sessionStorage = per tab, cleared on close. */
export function loadSession(): unknown {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(user: unknown) {
  try {
    if (user) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
