import { dbAdmin, restartBackend } from "../../../../web/bridge/backendClient"
import {
  decodeConnectionCode,
  encodeConnectionCode,
  isDatabaseConfigLocked,
  isProductionEnvironment,
  loadDatabaseConfig,
  saveDatabaseConfig,
  saveSession,
  validateDatabaseConfig,
} from "../../../../web/bridge/config"
import type { DatabaseConfig } from "../../../../web/shared/protocol"

export type { DatabaseConfig }

export interface ConnectionTestResult {
  ok: boolean
  driver: string
  message: string
  latencyMs: number
  sqliteVersion?: string
  tables?: number
  migrationsApplied?: number
  initialised?: boolean
}

export interface CloudinaryConfig {
  cloudName: string
  uploadPreset: string
  folder: string
  configured: boolean
}

export interface AdminUser {
  id: number
  username: string
  displayName: string | null
  isActive: number
  createdAt: string
  roles: { roleId: number; roleName: string }[]
}

export interface AdminRole {
  roleId: number
  roleName: string
  description: string | null
}

export interface SchemaStatus {
  migrations: { name: string; applied: boolean }[]
  pending: number
  tables: string[]
  lastRun: { applied: string[]; failed: { name: string; error: string }[] }
}

export interface CloneResult {
  tables: number
  rows: number
}

export const databaseConfig = {
  load: loadDatabaseConfig,
  validate: validateDatabaseConfig,
  encodeCode: encodeConnectionCode,
  decodeCode: decodeConnectionCode,
  isLocked: isDatabaseConfigLocked,
  isProduction: isProductionEnvironment,
  /** Saves the configuration for this browser and reconnects. */
  async apply(config: DatabaseConfig) {
    if (isDatabaseConfigLocked()) {
      throw new Error("Database configuration is locked in code and cannot be modified.")
    }
    const valid = validateDatabaseConfig(config)
    saveDatabaseConfig(valid)
    // A session belongs to the database it was created in: sign in again.
    saveSession(null)
    await restartBackend(valid)
  },
  test: (config: DatabaseConfig) =>
    dbAdmin<ConnectionTestResult>({ op: "testConnection", config: validateDatabaseConfig(config) }, { requireReady: false }),
}

export const databaseMaintenance = {
  exportDatabase: () => dbAdmin<Uint8Array>({ op: "exportDatabase" }),
  exportSql: () => dbAdmin<string>({ op: "exportSql" }),
  importDatabase: (bytes: Uint8Array) => dbAdmin<{ restartRequired: boolean }>({ op: "importDatabase", bytes }),
  resetLocal: () => dbAdmin<{ restartRequired: boolean }>({ op: "resetLocal" }, { requireReady: false }),
  copyTo: (target: DatabaseConfig, overwrite: boolean) => dbAdmin<CloneResult>({ op: "copyTo", target, overwrite }),
  stats: () =>
    dbAdmin<{ driver: string; tables: number; roundTrips: number; sizeBytes: number | null }>({ op: "stats" }),
  reseed: () => dbAdmin<{ seeded: boolean; version: string }>({ op: "reseed" }),
  /** Restarts the backend after the database was replaced; requires signing in again. */
  restart: () => {
    saveSession(null)
    return restartBackend()
  },
}

export const adminApi = {
  getCloudinaryConfig: (): Promise<CloudinaryConfig> => window.api.admin.getCloudinaryConfig(),
  setCloudinaryConfig: (config: Partial<CloudinaryConfig>): Promise<CloudinaryConfig> =>
    window.api.admin.setCloudinaryConfig(config),
  listUsers: (): Promise<AdminUser[]> => window.api.admin.listUsers(),
  listRoles: (): Promise<AdminRole[]> => window.api.admin.listRoles(),
  createUser: (payload: { username: string; displayName?: string; password: string; roleIds: number[] }) =>
    window.api.admin.createUser(payload),
  updateUser: (userId: number, payload: { displayName?: string; isActive?: boolean; roleIds?: number[] }) =>
    window.api.admin.updateUser(userId, payload),
  resetPassword: (userId: number, newPassword: string) => window.api.admin.resetPassword(userId, newPassword),
  getSchemaStatus: (): Promise<SchemaStatus> => window.api.admin.getSchemaStatus(),
  getTableCounts: (): Promise<{ name: string; rows: number }[]> => window.api.admin.getTableCounts(),
  seedSampleData: (options: { includeStock?: boolean }) => window.api.admin.seedSampleData(options),
  changePassword: (currentPassword: string, newPassword: string) =>
    window.api.auth.changePassword(currentPassword, newPassword),
}

export function downloadBytes(bytes: Uint8Array | string, filename: string, mime: string) {
  const blob = new Blob([bytes as BlobPart], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:]/g, "-").replace(/\..+$/, "")
}
