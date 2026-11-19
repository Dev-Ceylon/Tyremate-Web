/// <reference lib="webworker" />
/**
 * Backend host. Runs the original TyreMate main-process code (IPC handlers,
 * services, repositories) inside a dedicated Web Worker so it can use
 * synchronous I/O (sql.js in memory, or synchronous XHR to Turso/libSQL)
 * without freezing the UI.
 */
import initSqlJs, { type SqlJsStatic } from "sql.js"
import { CompatDatabase, type SqlDriver } from "../db/compat"
import { SqlJsDriver } from "../db/sqljsDriver"
import { LibsqlDriver, xhrTransport } from "../db/libsqlDriver"
import { cloneDatabase, dumpSql, isSqliteFile, listTables } from "../db/clone"
import { idbDelete, idbGet, idbPut, LOCAL_DB_KEY } from "./idb"
import type { BackendInitInfo, DatabaseConfig, DbAdminOp, FromWorker, ToWorker } from "../shared/protocol"

declare const self: DedicatedWorkerGlobalScope

/* eslint-disable @typescript-eslint/no-require-imports */
const runtime = require("../../backend/platform/runtime")

let SQL: SqlJsStatic | null = null
let basePath = ""
let db: CompatDatabase | null = null
let localDriver: SqlJsDriver | null = null
let electron: { invokeHandler: (c: string, a: unknown[]) => Promise<unknown>; listChannels: () => string[] } | null = null
let bootstrap: { seedDatabase: (o?: { force?: boolean }) => Promise<unknown>; stop: () => void } | null = null
let frozen = false
let saveChain: Promise<void> = Promise.resolve()
let mainRequestSeq = 0
const pendingMain = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()

function post(message: FromWorker, transfer: Transferable[] = []) {
  self.postMessage(message, transfer)
}

async function getSql(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: () => `${basePath}/sql-wasm.wasm` })
  }
  return SQL
}

function createDriver(config: DatabaseConfig, bytes?: Uint8Array | null): Promise<SqlDriver> | SqlDriver {
  if (config.driver === "libsql") {
    return new LibsqlDriver({ url: config.url, authToken: config.authToken }, xhrTransport)
  }
  return getSql().then((S) => new SqlJsDriver(S, bytes))
}

function requestMain(kind: string, payload: unknown): Promise<unknown> {
  const id = ++mainRequestSeq
  return new Promise((resolve, reject) => {
    pendingMain.set(id, { resolve, reject })
    post({ type: "mainRequest", id, kind, payload })
  })
}

/** Holds a Web Lock for the lifetime of the worker so two tabs never edit the same local file. */
async function acquireLocalLock(): Promise<boolean> {
  // A just-terminated worker (restart) may still hold the lock for a moment.
  for (let attempt = 0; attempt < 12; attempt++) {
    if (await tryLocalLock()) return true
    await new Promise((r) => setTimeout(r, 250))
  }
  return false
}

function tryLocalLock(): Promise<boolean> {
  if (!("locks" in navigator)) return Promise.resolve(true)
  return new Promise((resolve) => {
    navigator.locks.request("tyremate-local-database", { ifAvailable: true }, (lock) => {
      if (!lock) {
        resolve(false)
        return undefined
      }
      resolve(true)
      return new Promise<void>(() => {}) // keep until the worker is terminated
    })
  })
}

function persistLocal(): Promise<void> {
  if (!localDriver || frozen) return saveChain
  saveChain = saveChain
    .then(async () => {
      if (!localDriver || frozen) return
      await idbPut(LOCAL_DB_KEY, localDriver.export())
    })
    .catch((error) => {
      post({ type: "persistError", error: error instanceof Error ? error.message : String(error) })
    })
  return saveChain
}

async function afterCall(): Promise<void> {
  if (db && db.takeDirty() && localDriver) await persistLocal()
}

function currentUser(): { permissions?: string[] } | null {
  try {
    const { sessionStore } = require("../../backend/apps/electron/auth/sessionStore")
    return sessionStore.getUser()
  } catch {
    return null
  }
}

function assertSettingsManager() {
  const user = currentUser()
  const perms = user?.permissions ?? []
  if (!perms.includes("god") && !perms.includes("settings.manage")) {
    throw new Error("Unauthorized: only administrators can manage the database")
  }
}

async function init(config: DatabaseConfig, session: unknown): Promise<BackendInitInfo> {
  const started = performance.now()
  let driver: SqlDriver
  if (config.driver === "local") {
    const gotLock = await acquireLocalLock()
    if (!gotLock) {
      const error = new Error("TyreMate is already open in another tab of this browser. Close it (or use that tab) to continue.")
      ;(error as Error & { code?: string }).code = "LOCKED"
      throw error
    }
    const bytes = await idbGet(LOCAL_DB_KEY)
    localDriver = (await createDriver(config, bytes)) as SqlJsDriver
    driver = localDriver
  } else {
    driver = await createDriver(config)
    // Fail fast with a clear message if the server is unreachable.
    driver.query("SELECT 1", [])
  }

  db = new CompatDatabase(driver)
  runtime.setDatabase(db)
  runtime.setHost({
    requestMain,
    emit: (channel: string, payload: unknown) => post({ type: "event", channel, payload }),
    persistSession: (user: unknown) => post({ type: "session", user }),
    initialSession: session ?? null,
  })

  bootstrap = require("../../backend/apps/electron/main/bootstrap")
  const startResult = (await (bootstrap as unknown as { start: () => Promise<{ locked: boolean; seed: { seeded: boolean } | null }> }).start()) ?? {
    locked: false,
    seed: null,
  }
  electron = require("../../backend/platform/electron")

  if (localDriver) {
    db.takeDirty()
    await persistLocal()
  }

  const report = runtime.getMigrationReport()
  return {
    driver: config.driver,
    locked: Boolean(startResult.locked),
    seeded: Boolean(startResult.seed?.seeded),
    migrationsApplied: report.applied ?? [],
    migrationsFailed: report.failed ?? [],
    roundTrips: driver instanceof LibsqlDriver ? driver.roundTrips : 0,
    durationMs: Math.round(performance.now() - started),
    channels: electron!.listChannels().length,
  }
}

async function testConnection(config: DatabaseConfig) {
  const started = performance.now()
  if (config.driver === "local") {
    return { ok: true, driver: "local", message: "Browser storage is available", latencyMs: 0 }
  }
  const probe = new CompatDatabase(await createDriver(config))
  const version = (probe.prepare("SELECT sqlite_version() AS v").get() as { v: string }).v
  const latencyMs = Math.round(performance.now() - started)
  const tables = listTables(probe)
  let migrationsApplied = 0
  if (tables.includes("schema_migrations")) {
    migrationsApplied = (probe.prepare("SELECT COUNT(*) AS c FROM schema_migrations").get() as { c: number }).c
  }
  probe.close()
  return {
    ok: true,
    driver: "libsql",
    sqliteVersion: version,
    latencyMs,
    tables: tables.length,
    migrationsApplied,
    initialised: tables.includes("users"),
    message: tables.length === 0 ? "Connected. The database is empty and will be initialised on first use." : "Connected.",
  }
}

async function dbAdmin(request: DbAdminOp): Promise<unknown> {
  switch (request.op) {
    case "testConnection":
      return testConnection(request.config)

    case "resetLocal": {
      frozen = true
      await saveChain
      await idbDelete(LOCAL_DB_KEY)
      return { restartRequired: true }
    }

    case "stats": {
      assertSettingsManager()
      if (!db) throw new Error("Database is not connected")
      const tables = listTables(db)
      return {
        driver: db.driver.kind,
        tables: tables.length,
        roundTrips: db.driver instanceof LibsqlDriver ? db.driver.roundTrips : 0,
        sizeBytes: localDriver ? localDriver.export().byteLength : null,
      }
    }

    case "exportDatabase": {
      assertSettingsManager()
      if (!db) throw new Error("Database is not connected")
      if (localDriver) return localDriver.export()
      const copy = new CompatDatabase(new SqlJsDriver(await getSql()))
      cloneDatabase(db, copy, { overwrite: true })
      const bytes = (copy.driver as SqlJsDriver).export()
      copy.close()
      return bytes
    }

    case "exportSql": {
      assertSettingsManager()
      if (!db) throw new Error("Database is not connected")
      return dumpSql(db)
    }

    case "importDatabase": {
      assertSettingsManager()
      if (!db) throw new Error("Database is not connected")
      const bytes = request.bytes
      if (!isSqliteFile(bytes)) throw new Error("The selected file is not a SQLite database")
      const incoming = new CompatDatabase(new SqlJsDriver(await getSql(), bytes))
      const tables = listTables(incoming)
      if (!tables.includes("users") || !tables.includes("schema_migrations")) {
        incoming.close()
        throw new Error("The selected file is not a TyreMate database (missing users / schema_migrations tables)")
      }
      if (localDriver) {
        frozen = true
        await saveChain
        await idbPut(LOCAL_DB_KEY, bytes)
      } else {
        cloneDatabase(incoming, db, { overwrite: true })
        frozen = true
      }
      incoming.close()
      return { restartRequired: true, tables: tables.length }
    }

    case "copyTo": {
      assertSettingsManager()
      if (!db) throw new Error("Database is not connected")
      if (request.target.driver === "local") {
        const target = new CompatDatabase(new SqlJsDriver(await getSql()))
        const result = cloneDatabase(db, target, { overwrite: true })
        if (localDriver) throw new Error("This browser already uses the local database")
        await idbPut(LOCAL_DB_KEY, (target.driver as SqlJsDriver).export())
        target.close()
        return result
      }
      const target = new CompatDatabase(await createDriver(request.target))
      const result = cloneDatabase(db, target, { overwrite: request.overwrite })
      target.close()
      return result
    }

    case "reseed": {
      assertSettingsManager()
      if (!bootstrap) throw new Error("Backend is not running")
      const result = await bootstrap.seedDatabase({ force: true })
      await afterCall()
      return result
    }

    default:
      throw new Error("Unknown database operation")
  }
}

self.onmessage = async (event: MessageEvent<ToWorker>) => {
  const message = event.data
  switch (message.type) {
    case "init": {
      basePath = message.basePath
      try {
        const info = await init(message.config, message.session)
        post({ type: "ready", info })
      } catch (error) {
        const err = error as Error & { code?: string }
        post({ type: "initError", error: err?.message ?? String(error), code: err?.code })
      }
      return
    }

    case "invoke": {
      if (frozen) {
        post({ type: "result", id: message.id, ok: false, error: "The database is being replaced. Reloading…" })
        return
      }
      if (!electron) {
        post({ type: "result", id: message.id, ok: false, error: "The database is not connected" })
        return
      }
      try {
        const result = await electron.invokeHandler(message.channel, message.args)
        await afterCall()
        post({ type: "result", id: message.id, ok: true, result })
      } catch (error) {
        await afterCall()
        post({ type: "result", id: message.id, ok: false, error: error instanceof Error ? error.message : String(error) })
      }
      return
    }

    case "registerFile":
      runtime.registerFile(message.token, message.file)
      return

    case "mainReply": {
      const pending = pendingMain.get(message.id)
      if (!pending) return
      pendingMain.delete(message.id)
      if (message.ok) pending.resolve(message.result)
      else pending.reject(new Error(message.error ?? "Request failed"))
      return
    }

    case "dbAdmin": {
      try {
        const result = await dbAdmin(message.request)
        const transfer = result instanceof Uint8Array ? [result.buffer] : []
        post({ type: "result", id: message.id, ok: true, result }, transfer)
      } catch (error) {
        post({ type: "result", id: message.id, ok: false, error: error instanceof Error ? error.message : String(error) })
      }
      return
    }
  }
}
