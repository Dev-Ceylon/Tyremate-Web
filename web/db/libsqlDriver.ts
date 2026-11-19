import type { Row, RunResult, SqlDriver, SqlValue } from "./compat"

/**
 * Remote Turso / libSQL (sqld) driver speaking the Hrana-over-HTTP v2 protocol.
 *
 * The TyreMate business layer is synchronous, so requests are issued through a
 * synchronous transport (sync XMLHttpRequest inside a Web Worker, or a blocking
 * worker_threads bridge in Node tests). Transactions pin a Hrana stream via its
 * "baton" so every statement inside BEGIN..COMMIT runs on the same connection.
 */

export interface HttpResponse {
  status: number
  body: string
}

export type SyncHttpTransport = (url: string, headers: Record<string, string>, body: string) => HttpResponse

export interface LibsqlConfig {
  url: string
  authToken?: string
}

type HranaValue =
  | { type: "null" }
  | { type: "integer"; value: string }
  | { type: "float"; value: number }
  | { type: "text"; value: string }
  | { type: "blob"; base64: string }

interface HranaStmtResult {
  cols: { name: string | null; decltype?: string | null }[]
  rows: HranaValue[][]
  affected_row_count: number
  last_insert_rowid: string | null
}

type StreamRequest =
  | { type: "execute"; stmt: { sql: string; args: HranaValue[]; want_rows: boolean } }
  | { type: "sequence"; sql: string }
  | { type: "close" }

interface StreamResult {
  type: "ok" | "error"
  response?: { type: string; result?: HranaStmtResult }
  error?: { message: string; code?: string }
}

interface PipelineResponse {
  baton: string | null
  base_url: string | null
  results: StreamResult[]
}

export class LibsqlError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = "LibsqlError"
    this.code = code
  }
}

/** libsql://db-org.turso.io -> https://db-org.turso.io ; ws(s):// -> http(s):// */
export function normalizeLibsqlUrl(raw: string): string {
  let url = raw.trim()
  if (!url) throw new Error("Database URL is required")
  if (url.startsWith("libsql://")) url = "https://" + url.slice("libsql://".length)
  else if (url.startsWith("wss://")) url = "https://" + url.slice("wss://".length)
  else if (url.startsWith("ws://")) url = "http://" + url.slice("ws://".length)
  else if (!/^https?:\/\//.test(url)) url = "https://" + url
  return url.replace(/\/+$/, "")
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function bytesFromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export function encodeValue(value: SqlValue): HranaValue {
  if (value === null) return { type: "null" }
  if (typeof value === "number") {
    return Number.isInteger(value) ? { type: "integer", value: String(value) } : { type: "float", value }
  }
  if (typeof value === "string") return { type: "text", value }
  return { type: "blob", base64: base64FromBytes(value) }
}

export function decodeValue(value: HranaValue): unknown {
  switch (value.type) {
    case "null":
      return null
    case "integer":
      return Number(value.value)
    case "float":
      return Number(value.value)
    case "text":
      return value.value
    case "blob":
      return bytesFromBase64(value.base64)
    default:
      return null
  }
}

function toRows(result: HranaStmtResult): Row[] {
  const names = result.cols.map((c, i) => c.name ?? `column${i}`)
  return result.rows.map((cells) => {
    const row: Row = {}
    cells.forEach((cell, i) => {
      row[names[i]] = decodeValue(cell)
    })
    return row
  })
}

export class LibsqlDriver implements SqlDriver {
  readonly kind = "libsql"
  private baseUrl: string
  private readonly headers: Record<string, string>
  private readonly transport: SyncHttpTransport
  private baton: string | null = null
  private inTx = false
  /**
   * better-sqlite3 reports the connection's most recent insert rowid even for
   * statements that insert nothing. Auto-commit Hrana requests each use a new
   * connection, so the value is tracked here to keep identical semantics.
   */
  private lastRowid = 0
  /** Number of HTTP round trips performed (exposed for diagnostics/tests). */
  roundTrips = 0

  constructor(config: LibsqlConfig, transport: SyncHttpTransport) {
    this.baseUrl = normalizeLibsqlUrl(config.url)
    this.headers = { "Content-Type": "application/json" }
    if (config.authToken) this.headers.Authorization = `Bearer ${config.authToken.trim()}`
    this.transport = transport
  }

  private pipeline(requests: StreamRequest[], keepOpen: boolean): StreamResult[] {
    const body: { baton: string | null; requests: StreamRequest[] } = {
      baton: this.baton,
      requests: keepOpen ? requests : [...requests, { type: "close" }],
    }
    this.roundTrips += 1
    let response: HttpResponse
    try {
      response = this.transport(`${this.baseUrl}/v2/pipeline`, this.headers, JSON.stringify(body))
    } catch (error) {
      this.baton = null
      const message = error instanceof Error ? error.message : String(error)
      throw new LibsqlError(`Could not reach the database server: ${message}`, "NETWORK")
    }

    if (response.status === 401 || response.status === 403) {
      this.baton = null
      throw new LibsqlError("Database rejected the credentials (check the auth token)", "AUTH")
    }
    if (response.status < 200 || response.status >= 300) {
      this.baton = null
      let detail = response.body
      try {
        const parsed = JSON.parse(response.body)
        detail = parsed.message ?? parsed.error ?? response.body
      } catch {
        // keep raw body
      }
      throw new LibsqlError(`Database HTTP ${response.status}: ${String(detail).slice(0, 300)}`, "HTTP")
    }

    const parsed = JSON.parse(response.body) as PipelineResponse
    this.baton = keepOpen ? parsed.baton : null
    if (parsed.base_url) this.baseUrl = parsed.base_url.replace(/\/+$/, "")
    return parsed.results
  }

  private static unwrap(result: StreamResult | undefined): HranaStmtResult | undefined {
    if (!result) throw new LibsqlError("Empty response from database server")
    if (result.type === "error") {
      throw new LibsqlError(result.error?.message ?? "Unknown database error", result.error?.code)
    }
    return result.response?.result
  }

  private exec(sql: string, params: SqlValue[]): HranaStmtResult {
    const execute: StreamRequest = {
      type: "execute",
      stmt: { sql, args: params.map(encodeValue), want_rows: true },
    }
    if (this.inTx) {
      const results = this.pipeline([execute], true)
      return LibsqlDriver.unwrap(results[0])!
    }
    // Auto-commit statement on a fresh connection: enable FK enforcement first.
    const results = this.pipeline(
      [{ type: "execute", stmt: { sql: "PRAGMA foreign_keys = ON", args: [], want_rows: false } }, execute],
      false,
    )
    return LibsqlDriver.unwrap(results[1])!
  }

  query(sql: string, params: SqlValue[]): Row[] {
    return toRows(this.exec(sql, params))
  }

  run(sql: string, params: SqlValue[]): RunResult {
    const result = this.exec(sql, params)
    const rowid = result.last_insert_rowid == null ? 0 : Number(result.last_insert_rowid)
    if (rowid !== 0) this.lastRowid = rowid
    return {
      changes: result.affected_row_count ?? 0,
      lastInsertRowid: this.lastRowid,
    }
  }

  execScript(sql: string): void {
    if (!sql.trim()) return
    if (this.inTx) {
      LibsqlDriver.unwrap(this.pipeline([{ type: "sequence", sql }], true)[0])
      return
    }
    const results = this.pipeline(
      [{ type: "execute", stmt: { sql: "PRAGMA foreign_keys = ON", args: [], want_rows: false } }, { type: "sequence", sql }],
      false,
    )
    LibsqlDriver.unwrap(results[1])
  }

  begin(): void {
    this.baton = null
    const results = this.pipeline(
      [
        { type: "execute", stmt: { sql: "PRAGMA foreign_keys = ON", args: [], want_rows: false } },
        { type: "execute", stmt: { sql: "BEGIN", args: [], want_rows: false } },
      ],
      true,
    )
    LibsqlDriver.unwrap(results[1])
    this.inTx = true
  }

  private finish(sql: string): void {
    try {
      const results = this.pipeline([{ type: "execute", stmt: { sql, args: [], want_rows: false } }], false)
      LibsqlDriver.unwrap(results[0])
    } finally {
      this.inTx = false
      this.baton = null
    }
  }

  commit(): void {
    this.finish("COMMIT")
  }

  rollback(): void {
    this.finish("ROLLBACK")
  }

  close(): void {
    if (this.baton) {
      try {
        this.pipeline([], false)
      } catch {
        // ignore
      }
    }
    this.baton = null
    this.inTx = false
  }
}

/** Synchronous XHR transport. Only valid inside a dedicated Web Worker. */
export const xhrTransport: SyncHttpTransport = (url, headers, body) => {
  const xhr = new XMLHttpRequest()
  xhr.open("POST", url, false)
  for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value)
  xhr.send(body)
  return { status: xhr.status, body: xhr.responseText }
}
