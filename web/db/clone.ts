import type { CompatDatabase } from "./compat"

interface MasterRow {
  type: string
  name: string
  tbl_name: string
  sql: string | null
}

const MAX_PARAMS_PER_STATEMENT = 900
const MAX_ROWS_PER_STATEMENT = 200

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

function userObjects(db: CompatDatabase): MasterRow[] {
  return db
    .prepare("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY rowid")
    .all() as MasterRow[]
}

export function listTables(db: CompatDatabase): string[] {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[]
  ).map((r) => r.name)
}

function columnsOf(db: CompatDatabase, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${quoteIdent(table)})`).all() as { name: string }[]).map((c) => c.name)
}

/** Drops every user table, index, view and trigger in `db` (within the caller's transaction). */
function dropAll(db: CompatDatabase): void {
  const objects = userObjects(db).filter((o) => !o.name.startsWith("sqlite_"))
  for (const kind of ["trigger", "view"]) {
    for (const o of objects.filter((x) => x.type === kind)) db.exec(`DROP ${kind.toUpperCase()} IF EXISTS ${quoteIdent(o.name)}`)
  }
  // Empty every table first (FKs are deferred inside the copy transaction)...
  const tables = objects.filter((x) => x.type === "table").map((x) => x.name)
  for (const t of tables) db.exec(`DELETE FROM ${quoteIdent(t)}`)
  // ...then drop children before parents: DROP TABLE on a child checks its
  // foreign keys and fails with "no such table" once the parent is gone.
  for (const t of dropOrder(db, tables)) db.exec(`DROP TABLE IF EXISTS ${quoteIdent(t)}`)
}

/** Orders tables so that every table is dropped before the tables it references. */
export function dropOrder(db: CompatDatabase, tables: string[]): string[] {
  const parents = new Map<string, Set<string>>()
  for (const t of tables) {
    const fks = db.prepare(`PRAGMA foreign_key_list(${quoteIdent(t)})`).all() as { table: string }[]
    parents.set(t, new Set(fks.map((fk) => fk.table).filter((p) => p !== t && tables.includes(p))))
  }
  const order: string[] = []
  const remaining = new Set(tables)
  while (remaining.size > 0) {
    // A table can go once no remaining table references it.
    const referenced = new Set<string>()
    for (const t of remaining) for (const p of parents.get(t) ?? []) if (remaining.has(p)) referenced.add(p)
    let next = [...remaining].filter((t) => !referenced.has(t))
    if (next.length === 0) next = [[...remaining][0]] // cycle: break it arbitrarily
    for (const t of next) {
      order.push(t)
      remaining.delete(t)
    }
  }
  return order
}

export interface CloneResult {
  tables: number
  rows: number
}

/**
 * Copies schema + data from `source` into `target`. Used for backups
 * (remote -> in-memory sql.js -> file), "push local database to server" and
 * "pull server database to this browser". Foreign keys are deferred so table
 * order does not matter; the whole copy is one transaction on the target.
 */
export function cloneDatabase(source: CompatDatabase, target: CompatDatabase, options: { overwrite: boolean }): CloneResult {
  const objects = userObjects(source)
  const tables = objects.filter((o) => o.type === "table" && !o.name.startsWith("sqlite_"))

  const existing = listTables(target)
  if (existing.length > 0 && !options.overwrite) {
    throw new Error(`The target database is not empty (${existing.length} tables). Enable "overwrite" to replace it.`)
  }

  // Read everything first so a remote source is not queried mid-transaction.
  const data = tables.map((t) => {
    const cols = columnsOf(source, t.name)
    const rows = source.prepare(`SELECT * FROM ${quoteIdent(t.name)}`).all() as Record<string, unknown>[]
    return { table: t, cols, rows }
  })
  const hasSequence = objects.some((o) => o.name === "sqlite_sequence")
  const sequence = hasSequence
    ? (source.prepare("SELECT name, seq FROM sqlite_sequence").all() as { name: string; seq: number }[])
    : []

  let totalRows = 0
  const copy = target.transaction(() => {
    target.pragma("defer_foreign_keys = ON")
    if (existing.length > 0) dropAll(target)

    for (const { table } of data) target.exec(table.sql as string)

    for (const { table, cols, rows } of data) {
      if (rows.length === 0 || cols.length === 0) continue
      const perStatement = Math.max(1, Math.min(MAX_ROWS_PER_STATEMENT, Math.floor(MAX_PARAMS_PER_STATEMENT / cols.length)))
      const colList = cols.map(quoteIdent).join(", ")
      const tuple = `(${cols.map(() => "?").join(", ")})`
      for (let i = 0; i < rows.length; i += perStatement) {
        const chunk = rows.slice(i, i + perStatement)
        const sql = `INSERT INTO ${quoteIdent(table.name)} (${colList}) VALUES ${chunk.map(() => tuple).join(", ")}`
        const params: unknown[] = []
        for (const row of chunk) for (const c of cols) params.push(row[c])
        target.prepare(sql).run(params)
      }
      totalRows += rows.length
    }

    for (const o of objects) {
      if (o.type === "index" || o.type === "view" || o.type === "trigger") target.exec(o.sql as string)
    }

    if (sequence.length > 0) {
      target.exec("DELETE FROM sqlite_sequence")
      const insert = target.prepare("INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)")
      for (const s of sequence) insert.run(s.name, s.seq)
    }
  })
  copy()

  return { tables: tables.length, rows: totalRows }
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL"
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL"
  if (value instanceof Uint8Array) {
    return `X'${Array.from(value, (b) => b.toString(16).padStart(2, "0")).join("")}'`
  }
  return `'${String(value).replace(/'/g, "''")}'`
}

/** Plain-text SQL dump (schema + INSERT statements), restorable with any SQLite tool. */
export function dumpSql(db: CompatDatabase): string {
  const lines: string[] = [
    "-- TyreMate database dump",
    `-- Generated ${new Date().toISOString()}`,
    "PRAGMA foreign_keys = OFF;",
    "BEGIN TRANSACTION;",
  ]
  const objects = userObjects(db)
  const tables = objects.filter((o) => o.type === "table" && !o.name.startsWith("sqlite_"))
  for (const t of tables) {
    lines.push(`${t.sql};`)
    const cols = columnsOf(db, t.name)
    const rows = db.prepare(`SELECT * FROM ${quoteIdent(t.name)}`).all() as Record<string, unknown>[]
    for (const row of rows) {
      lines.push(
        `INSERT INTO ${quoteIdent(t.name)} (${cols.map(quoteIdent).join(", ")}) VALUES (${cols
          .map((c) => sqlLiteral(row[c]))
          .join(", ")});`,
      )
    }
  }
  for (const o of objects) {
    if (o.type === "index" || o.type === "view" || o.type === "trigger") lines.push(`${o.sql};`)
  }
  if (objects.some((o) => o.name === "sqlite_sequence")) {
    lines.push("DELETE FROM sqlite_sequence;")
    for (const s of db.prepare("SELECT name, seq FROM sqlite_sequence").all() as { name: string; seq: number }[]) {
      lines.push(`INSERT INTO sqlite_sequence (name, seq) VALUES (${sqlLiteral(s.name)}, ${s.seq});`)
    }
  }
  lines.push("COMMIT;", "PRAGMA foreign_keys = ON;", "")
  return lines.join("\n")
}

export function isSqliteFile(bytes: Uint8Array): boolean {
  const header = "SQLite format 3\u0000"
  if (bytes.length < header.length) return false
  for (let i = 0; i < header.length; i++) if (bytes[i] !== header.charCodeAt(i)) return false
  return true
}
