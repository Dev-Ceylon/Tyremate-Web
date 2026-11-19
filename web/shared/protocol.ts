/** Messages exchanged between the UI thread and the backend Web Worker. */

export type DatabaseConfig =
  | { driver: "local" }
  | { driver: "libsql"; url: string; authToken?: string }

export interface BackendInitInfo {
  driver: DatabaseConfig["driver"]
  locked: boolean
  seeded: boolean
  migrationsApplied: string[]
  migrationsFailed: { name: string; error: string }[]
  roundTrips: number
  durationMs: number
  channels: number
}

export type DbAdminOp =
  | { op: "testConnection"; config: DatabaseConfig }
  | { op: "exportDatabase" }
  | { op: "exportSql" }
  | { op: "importDatabase"; bytes: Uint8Array }
  | { op: "resetLocal" }
  | { op: "copyTo"; target: DatabaseConfig; overwrite: boolean }
  | { op: "stats" }
  | { op: "reseed" }

export type ToWorker =
  | { type: "init"; config: DatabaseConfig; session: unknown; basePath: string }
  | { type: "invoke"; id: number; channel: string; args: unknown[] }
  | { type: "registerFile"; token: string; file: File }
  | { type: "mainReply"; id: number; ok: boolean; result?: unknown; error?: string }
  | { type: "dbAdmin"; id: number; request: DbAdminOp }

export type FromWorker =
  | { type: "ready"; info: BackendInitInfo }
  | { type: "initError"; error: string; code?: string }
  | { type: "result"; id: number; ok: boolean; result?: unknown; error?: string }
  | { type: "event"; channel: string; payload: unknown }
  | { type: "mainRequest"; id: number; kind: string; payload: unknown }
  | { type: "session"; user: unknown }
  | { type: "persistError"; error: string }

export type MainRequestKind = "print" | "download" | "openBlob" | "openUrl" | "pickFiles"
