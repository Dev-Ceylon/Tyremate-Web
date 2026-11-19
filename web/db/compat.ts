/**
 * better-sqlite3 compatible, synchronous database facade.
 *
 * The TyreMate business layer (packages/services + packages/repositories) was
 * written against better-sqlite3's synchronous API. To run it unchanged in the
 * browser we provide the same surface (prepare/get/all/run/exec/pragma/
 * transaction) on top of a pluggable synchronous `SqlDriver`:
 *
 *   - SqlJsDriver   – SQLite compiled to WebAssembly, persisted in IndexedDB
 *   - LibsqlDriver  – remote Turso / libSQL server over the Hrana HTTP protocol
 *                     (synchronous XHR, only allowed inside a Web Worker)
 */

export type SqlValue = number | string | Uint8Array | null
export type Row = Record<string, unknown>

export interface RunResult {
  changes: number
  lastInsertRowid: number
}

export interface SqlDriver {
  readonly kind: string
  /** Execute a single statement and return the produced rows (may be empty). */
  query(sql: string, params: SqlValue[]): Row[]
  /** Execute a single statement and report the write effect. */
  run(sql: string, params: SqlValue[]): RunResult
  /** Execute a script containing zero or more statements. */
  execScript(sql: string): void
  /** Transaction lifecycle; drivers that need connection affinity hook in here. */
  begin(): void
  commit(): void
  rollback(): void
  close(): void
}

const READ_ONLY_PREFIX = /^\s*(select|with|pragma\s+table_info|pragma\s+index_list|explain)\b/i

/** Normalises JS values into SQLite-bindable values (lenient superset of better-sqlite3). */
export function toSqlValue(value: unknown): SqlValue {
  if (value === undefined || value === null) return null
  if (typeof value === "number") return value
  if (typeof value === "string") return value
  if (typeof value === "boolean") return value ? 1 : 0
  if (typeof value === "bigint") return Number(value)
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (value instanceof Date) return value.toISOString()
  throw new TypeError(
    "SQLite3 can only bind numbers, strings, bigints, buffers, and null (got " + typeof value + ")",
  )
}

import { bindParams } from "./params"

/** Same name/shape as better-sqlite3's SqliteError (name "SqliteError", .code "SQLITE_..."). */
export class SqliteError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.name = "SqliteError"
    this.code = code
  }
}

const CODE_BY_MESSAGE: [RegExp, string][] = [
  [/^UNIQUE constraint failed/, "SQLITE_CONSTRAINT_UNIQUE"],
  [/^FOREIGN KEY constraint failed/, "SQLITE_CONSTRAINT_FOREIGNKEY"],
  [/^NOT NULL constraint failed/, "SQLITE_CONSTRAINT_NOTNULL"],
  [/^CHECK constraint failed/, "SQLITE_CONSTRAINT_CHECK"],
  [/constraint failed/, "SQLITE_CONSTRAINT"],
  [/database is locked/, "SQLITE_BUSY"],
  [/attempt to write a readonly database/, "SQLITE_READONLY"],
]

/** Converts driver errors (sql.js Error, Hrana error results) into SqliteError. */
export function toSqliteError(error: unknown): unknown {
  if (!(error instanceof Error) || error instanceof SqliteError || error instanceof TypeError || error instanceof RangeError) {
    return error
  }
  const withCode = error as Error & { code?: string }
  // Network/auth problems with a remote database are not SQL errors.
  if (withCode.code === "NETWORK" || withCode.code === "AUTH" || withCode.code === "HTTP") return error
  const message = error.message.replace(/^SQLite error: /, "").replace(/^SQLITE_[A-Z_]+: /, "")
  const reported = withCode.code && withCode.code.startsWith("SQLITE_") ? withCode.code : undefined
  const derived = CODE_BY_MESSAGE.find(([re]) => re.test(message))?.[1]
  // Servers may report a generic primary code (SQLITE_CONSTRAINT); keep the specific one.
  const code = derived && (!reported || derived.startsWith(reported)) ? derived : reported ?? derived ?? "SQLITE_ERROR"
  const converted = new SqliteError(message, code)
  converted.stack = error.stack
  return converted
}

function guard<T>(fn: () => T): T {
  try {
    return fn()
  } catch (error) {
    throw toSqliteError(error)
  }
}

export class CompatStatement {
  readonly source: string
  readonly reader: boolean
  private readonly db: CompatDatabase
  private plucked = false

  constructor(db: CompatDatabase, sql: string) {
    this.db = db
    this.source = sql
    this.reader = READ_ONLY_PREFIX.test(sql) || /\breturning\b/i.test(sql)
  }

  pluck(toggle = true): this {
    this.plucked = toggle
    return this
  }

  run(...args: unknown[]): RunResult {
    const { sql, values } = bindParams(this.source, args)
    this.db.markDirty()
    return guard(() => this.db.driver.run(sql, values))
  }

  get(...args: unknown[]): unknown {
    const { sql, values } = bindParams(this.source, args)
    if (!READ_ONLY_PREFIX.test(this.source)) this.db.markDirty()
    const rows = guard(() => this.db.driver.query(sql, values))
    const row = rows[0]
    if (row === undefined) return undefined
    return this.plucked ? Object.values(row)[0] : row
  }

  all(...args: unknown[]): unknown[] {
    const { sql, values } = bindParams(this.source, args)
    if (!READ_ONLY_PREFIX.test(this.source)) this.db.markDirty()
    const rows = guard(() => this.db.driver.query(sql, values))
    return this.plucked ? rows.map((row) => Object.values(row)[0]) : rows
  }

  iterate(...args: unknown[]): IterableIterator<unknown> {
    return this.all(...args)[Symbol.iterator]()
  }
}

type TxFn = ((...args: unknown[]) => unknown) & {
  deferred: (...args: unknown[]) => unknown
  immediate: (...args: unknown[]) => unknown
  exclusive: (...args: unknown[]) => unknown
}

export class CompatDatabase {
  readonly driver: SqlDriver
  private depth = 0
  private savepointCounter = 0
  private dirty = false
  open = true

  constructor(driver: SqlDriver) {
    this.driver = driver
  }

  get inTransaction(): boolean {
    return this.depth > 0
  }

  get name(): string {
    return this.driver.kind
  }

  markDirty(): void {
    this.dirty = true
  }

  /** Returns whether a write happened since the last call and resets the flag. */
  takeDirty(): boolean {
    const was = this.dirty
    this.dirty = false
    return was
  }

  prepare(sql: string): CompatStatement {
    if (typeof sql !== "string") throw new TypeError("Expected first argument to be a string")
    return new CompatStatement(this, sql)
  }

  exec(sql: string): this {
    this.markDirty()
    guard(() => this.driver.execScript(sql))
    return this
  }

  pragma(source: string, options: { simple?: boolean } = {}): unknown {
    const rows = guard(() => this.driver.query(`PRAGMA ${source}`, []))
    if (options.simple) {
      const first = rows[0]
      return first ? Object.values(first)[0] : undefined
    }
    return rows
  }

  transaction(fn: (...args: unknown[]) => unknown): TxFn {
    if (typeof fn !== "function") throw new TypeError("Expected first argument to be a function")

    const wrapper = (...args: unknown[]) => {
      const nested = this.depth > 0
      const savepoint = nested ? `tm_sp_${++this.savepointCounter}` : null

      guard(() => (nested ? this.driver.query(`SAVEPOINT ${savepoint}`, []) : this.driver.begin()))
      this.depth += 1
      this.markDirty()

      let result: unknown
      try {
        result = fn(...args)
        if (result && typeof (result as Promise<unknown>).then === "function") {
          throw new TypeError("Transaction function cannot return a promise")
        }
      } catch (error) {
        this.depth -= 1
        try {
          if (nested) {
            this.driver.query(`ROLLBACK TO SAVEPOINT ${savepoint}`, [])
            this.driver.query(`RELEASE SAVEPOINT ${savepoint}`, [])
          } else {
            this.driver.rollback()
          }
        } catch {
          // The original error is more useful than a rollback failure.
        }
        throw error
      }

      this.depth -= 1
      guard(() => (nested ? this.driver.query(`RELEASE SAVEPOINT ${savepoint}`, []) : this.driver.commit()))
      return result
    }

    const tx = wrapper as TxFn
    tx.deferred = wrapper
    tx.immediate = wrapper
    tx.exclusive = wrapper
    return tx
  }

  close(): this {
    this.open = false
    this.driver.close()
    return this
  }
}
