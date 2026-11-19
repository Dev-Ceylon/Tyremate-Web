/**
 * Boots the real TyreMate backend (IPC handlers + services + repositories)
 * inside Node against a chosen SQL driver, exactly as the browser worker does.
 */
import Module, { createRequire } from "node:module"
import path from "node:path"
import initSqlJs from "sql.js"
import { CompatDatabase, type SqlDriver } from "../../web/db/compat"
import { SqlJsDriver } from "../../web/db/sqljsDriver"

const root = path.resolve(__dirname, "../..")
const require = createRequire(import.meta.url)

// Redirect `electron` to the platform shim (webpack alias in the browser).
const electronShim = path.join(root, "backend/platform/electron.js")
const originalResolve = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function (
  request: unknown,
  ...rest: unknown[]
) {
  if (request === "electron") return electronShim
  return originalResolve.call(this, request, ...rest)
}

export interface HostEvents {
  emitted: { channel: string; payload: unknown }[]
  mainRequests: { type: string; payload: unknown }[]
  session: unknown
}

export interface BootedBackend {
  db: CompatDatabase
  invoke: (channel: string, ...args: unknown[]) => Promise<any>
  login: (username?: string, password?: string) => Promise<any>
  events: HostEvents
  runtime: any
  electron: any
  bootstrap: any
}

export async function createSqlJsDriver(bytes?: Uint8Array): Promise<SqlJsDriver> {
  const SQL = await initSqlJs()
  return new SqlJsDriver(SQL, bytes)
}

/** Forgets every loaded backend module so the next boot starts from scratch (new DB). */
export function resetBackendModules() {
  for (const key of Object.keys(require.cache)) {
    if (key.includes(`${path.sep}backend${path.sep}`)) delete require.cache[key]
  }
}

export async function bootBackend(
  driver: SqlDriver | { native: unknown },
  options: { mainHandler?: (type: string, payload: any) => unknown; quiet?: boolean } = {},
): Promise<BootedBackend> {
  const runtime = require(path.join(root, "backend/platform/runtime.js"))
  const events: HostEvents = { emitted: [], mainRequests: [], session: null }
  // `native` = a real better-sqlite3 handle: the engine the desktop app used.
  const db = "native" in driver ? (driver.native as CompatDatabase) : new CompatDatabase(driver)
  runtime.setDatabase(db)
  runtime.setHost({
    requestMain: async (type: string, payload: unknown) => {
      events.mainRequests.push({ type, payload })
      return options.mainHandler ? options.mainHandler(type, payload) : null
    },
    emit: (channel: string, payload: unknown) => events.emitted.push({ channel, payload }),
    persistSession: (user: unknown) => {
      events.session = user
    },
    initialSession: null,
  })

  const restore = silenceConsole(options.quiet !== false)
  try {
    const bootstrap = require(path.join(root, "backend/apps/electron/main/bootstrap.js"))
    await bootstrap.start({ startMonitors: false })
    const electron = require(electronShim)
    const invoke = (channel: string, ...args: unknown[]) => electron.invokeHandler(channel, args)
    const login = (username = "admin", password = "1234") => invoke("auth-login", { username, password })
    return { db, invoke, login, events, runtime, electron, bootstrap }
  } finally {
    restore()
  }
}

function silenceConsole(enabled: boolean): () => void {
  if (!enabled) return () => {}
  const saved = { log: console.log, warn: console.warn }
  console.log = () => {}
  console.warn = () => {}
  return () => {
    console.log = saved.log
    console.warn = saved.warn
  }
}
