/**
 * UI-thread client for the backend worker: lifecycle, request routing,
 * renderer events (ipcRenderer.on), and host capability requests.
 */
import { loadDatabaseConfig, loadSession, saveSession } from "./config"
import { downloadBlob, openBlob, openExternal, pickFiles, printHtml } from "./mainHandlers"
import type { BackendInitInfo, DatabaseConfig, DbAdminOp, FromWorker, ToWorker } from "../shared/protocol"

export type BackendStatus =
  | { state: "idle" }
  | { state: "starting"; config: DatabaseConfig }
  | { state: "ready"; config: DatabaseConfig; info: BackendInitInfo }
  | { state: "error"; config: DatabaseConfig; error: string; code?: string }

type Listener = (event: unknown, payload: unknown) => void

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

let worker: Worker | null = null
let status: BackendStatus = { state: "idle" }
let readyPromise: Promise<void> | null = null
let seq = 0
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
const eventListeners = new Map<string, Set<Listener>>()
const statusListeners = new Set<(s: BackendStatus) => void>()

function setStatus(next: BackendStatus) {
  status = next
  statusListeners.forEach((fn) => fn(next))
}

export function getBackendStatus(): BackendStatus {
  return status
}

export function onBackendStatus(fn: (s: BackendStatus) => void): () => void {
  statusListeners.add(fn)
  return () => statusListeners.delete(fn)
}

function send(message: ToWorker, transfer: Transferable[] = []) {
  if (!worker) throw new Error("Backend is not running")
  worker.postMessage(message, transfer)
}

async function handleMainRequest(kind: string, payload: any): Promise<unknown> {
  switch (kind) {
    case "print":
      await printHtml(String(payload.html), payload.title)
      return { success: true }
    case "download":
      downloadBlob(new Blob([payload.content], { type: payload.mimeType || "application/octet-stream" }), payload.filename)
      return { success: true }
    case "openBlob":
      openBlob(payload.bytes, payload.mime)
      return { success: true }
    case "openUrl":
      openExternal(payload.url)
      return { success: true }
    case "pickFiles": {
      const files = await pickFiles(payload ?? {})
      return files.map((file) => registerFile(file))
    }
    default:
      throw new Error(`Unsupported host request "${kind}"`)
  }
}

function onWorkerMessage(event: MessageEvent<FromWorker>) {
  const message = event.data
  switch (message.type) {
    case "result": {
      const entry = pending.get(message.id)
      if (!entry) return
      pending.delete(message.id)
      if (message.ok) entry.resolve(message.result)
      else entry.reject(new Error(message.error ?? "Request failed"))
      return
    }
    case "event": {
      eventListeners.get(message.channel)?.forEach((fn) => {
        try {
          fn({}, message.payload)
        } catch (error) {
          console.error(`listener error on ${message.channel}`, error)
        }
      })
      return
    }
    case "session":
      saveSession(message.user)
      return
    case "mainRequest":
      handleMainRequest(message.kind, message.payload).then(
        (result) => send({ type: "mainReply", id: message.id, ok: true, result }),
        (error) => send({ type: "mainReply", id: message.id, ok: false, error: error?.message ?? String(error) }),
      )
      return
    case "persistError":
      console.error("Failed to save the local database:", message.error)
      return
    default:
      return
  }
}

const RELOAD_GUARD_KEY = "tyremate.reloadedForCodeLoad"

/** importScripts / chunk loading failures (e.g. stale tab after a redeploy). */
export function isCodeLoadFailure(message: string): boolean {
  return /importScripts|Loading chunk|ChunkLoadError|failed to fetch dynamically imported module/i.test(message)
}

/**
 * After a redeploy, an already-open tab references worker chunks that no
 * longer exist. Reload once to pick up the new version; the guard prevents a
 * reload loop when the file is genuinely unreachable.
 */
function reloadOnceForNewVersion(): boolean {
  try {
    if (window.sessionStorage.getItem(RELOAD_GUARD_KEY)) return false
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/** Starts (or restarts) the backend worker with the saved database configuration. */
export function startBackend(config: DatabaseConfig = loadDatabaseConfig()): Promise<void> {
  stopBackend()
  const w = new Worker(new URL("../worker/backend.worker.ts", import.meta.url), { name: "tyremate-backend" })
  worker = w
  setStatus({ state: "starting", config })

  readyPromise = new Promise<void>((resolve, reject) => {
    const onInit = (event: MessageEvent<FromWorker>) => {
      const msg = event.data
      if (msg.type === "ready") {
        w.removeEventListener("message", onInit)
        setStatus({ state: "ready", config, info: msg.info })
        try {
          window.sessionStorage.removeItem(RELOAD_GUARD_KEY)
        } catch {
          // ignore
        }
        resolve()
      } else if (msg.type === "initError") {
        w.removeEventListener("message", onInit)
        setStatus({ state: "error", config, error: msg.error, code: msg.code })
        reject(new Error(msg.error))
      }
    }
    w.addEventListener("message", onInit)
    w.addEventListener("message", onWorkerMessage)
    w.addEventListener("error", (event) => {
      const raw = event.message || "The backend worker crashed"
      if (isCodeLoadFailure(raw) && reloadOnceForNewVersion()) return
      const error = isCodeLoadFailure(raw)
        ? "Part of the application could not be downloaded. The site may have just been updated, or the network/firewall blocked the file. Reload the page to try again." +
          `\n\nDetails: ${raw}`
        : raw
      setStatus({ state: "error", config, error, code: isCodeLoadFailure(raw) ? "CODE_LOAD" : undefined })
      reject(new Error(error))
    })
  })
  // Avoid unhandled rejection noise; callers observe status or await explicitly.
  readyPromise.catch(() => {})

  send({ type: "init", config, session: loadSession(), basePath })
  return readyPromise
}

export function stopBackend() {
  if (worker) {
    worker.terminate()
    worker = null
  }
  pending.forEach((p) => p.reject(new Error("The backend was restarted")))
  pending.clear()
  readyPromise = null
  setStatus({ state: "idle" })
}

export function restartBackend(config?: DatabaseConfig): Promise<void> {
  return startBackend(config ?? loadDatabaseConfig())
}

function request(message: Omit<ToWorker & { id: number }, "id">, transfer: Transferable[] = []): Promise<unknown> {
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    try {
      send({ ...(message as ToWorker), id } as ToWorker, transfer)
    } catch (error) {
      pending.delete(id)
      reject(error)
    }
  })
}

/** ipcRenderer.invoke equivalent. Waits for the backend to be ready. */
export async function invoke(channel: string, ...args: unknown[]): Promise<unknown> {
  if (!readyPromise) startBackend()
  try {
    await readyPromise
  } catch {
    throw new Error(status.state === "error" ? status.error : "The database is not connected")
  }
  return request({ type: "invoke", channel, args } as never)
}

/** Low-level database operations for the admin panel (bypass IPC handlers). */
export async function dbAdmin<T = unknown>(op: DbAdminOp, options: { requireReady?: boolean } = {}): Promise<T> {
  if (!worker) startBackend()
  if (options.requireReady !== false) {
    try {
      await readyPromise
    } catch {
      // Some operations (test connection, reset) are allowed while init failed.
    }
  }
  const transfer = op.op === "importDatabase" ? [op.bytes.buffer as ArrayBuffer] : []
  return request({ type: "dbAdmin", request: op } as never, transfer) as Promise<T>
}

export function on(channel: string, listener: Listener) {
  if (!eventListeners.has(channel)) eventListeners.set(channel, new Set())
  eventListeners.get(channel)!.add(listener)
}

export function off(channel: string, listener: Listener) {
  eventListeners.get(channel)?.delete(listener)
}

export function offAll(channel: string) {
  eventListeners.delete(channel)
}

/** Hands a File to the worker and returns an opaque token used as its "path". */
export function registerFile(file: File): string {
  const token = `webfile:${crypto.randomUUID()}/${file.name}`
  if (!worker) startBackend()
  send({ type: "registerFile", token, file })
  return token
}
