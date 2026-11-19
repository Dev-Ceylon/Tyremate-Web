import type { Database as SqlJsDatabase, SqlJsStatic } from "sql.js"
import type { Row, RunResult, SqlDriver, SqlValue } from "./compat"

/**
 * In-browser SQLite (WebAssembly). The whole database lives in memory and is
 * snapshotted to IndexedDB by the worker after every write.
 */
export class SqlJsDriver implements SqlDriver {
  readonly kind = "local"
  readonly db: SqlJsDatabase

  constructor(SQL: SqlJsStatic, bytes?: Uint8Array | null) {
    this.db = bytes && bytes.byteLength > 0 ? new SQL.Database(bytes) : new SQL.Database()
    this.db.run("PRAGMA foreign_keys = ON")
  }

  query(sql: string, params: SqlValue[]): Row[] {
    const stmt = this.db.prepare(sql)
    try {
      if (params.length > 0) stmt.bind(params)
      const rows: Row[] = []
      while (stmt.step()) rows.push(stmt.getAsObject() as Row)
      return rows
    } finally {
      stmt.free()
    }
  }

  run(sql: string, params: SqlValue[]): RunResult {
    const stmt = this.db.prepare(sql)
    try {
      if (params.length > 0) stmt.bind(params)
      while (stmt.step()) {
        // drain rows (e.g. INSERT ... RETURNING executed through run())
      }
    } finally {
      stmt.free()
    }
    const changes = this.db.getRowsModified()
    const res = this.db.exec("SELECT last_insert_rowid()")
    const lastInsertRowid = Number(res[0]?.values[0]?.[0] ?? 0)
    return { changes, lastInsertRowid }
  }

  execScript(sql: string): void {
    this.db.exec(sql)
  }

  begin(): void {
    this.db.run("BEGIN")
  }

  commit(): void {
    this.db.run("COMMIT")
  }

  rollback(): void {
    this.db.run("ROLLBACK")
  }

  /** Serialises the database file. sql.js resets connection pragmas on export. */
  export(): Uint8Array {
    const bytes = this.db.export()
    this.db.run("PRAGMA foreign_keys = ON")
    return bytes
  }

  close(): void {
    this.db.close()
  }
}
