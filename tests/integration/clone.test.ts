import Database from "better-sqlite3"
import initSqlJs from "sql.js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { CompatDatabase } from "../../web/db/compat"
import { cloneDatabase, dumpSql, isSqliteFile, listTables } from "../../web/db/clone"
import { LibsqlDriver } from "../../web/db/libsqlDriver"
import { SqlJsDriver } from "../../web/db/sqljsDriver"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"
import { startHranaServer, type RunningHrana } from "../helpers/hrana"
import { createSyncHttpTransport } from "../helpers/syncHttp"

let hrana: RunningHrana
let http: ReturnType<typeof createSyncHttpTransport>
let source: CompatDatabase

function snapshot(db: { prepare: (s: string) => { all: () => unknown[] } }, tables: string[]) {
  return Object.fromEntries(tables.map((t) => [t, db.prepare(`SELECT * FROM "${t}" ORDER BY rowid`).all()]))
}

beforeAll(async () => {
  hrana = await startHranaServer("tok")
  http = createSyncHttpTransport()
  resetBackendModules()
  const backend = await bootBackend(await createSqlJsDriver())
  await backend.login()
  await backend.invoke("admin:seedSampleData", { includeStock: true })
  source = backend.db
})

afterAll(async () => {
  hrana?.stop()
  await http?.close()
})

describe("backup, restore and copy", () => {
  it("exports a real SQLite file that native SQLite opens with identical data", async () => {
    const bytes = (source.driver as SqlJsDriver).export()
    expect(isSqliteFile(bytes)).toBe(true)
    expect(isSqliteFile(new TextEncoder().encode("not a database"))).toBe(false)
    const native = new Database(Buffer.from(bytes))
    const tables = listTables(source)
    expect(snapshot(native, tables)).toEqual(snapshot(source, tables))
    expect(native.pragma("integrity_check", { simple: true })).toBe("ok")
    expect(native.pragma("foreign_key_check")).toEqual([])
  })

  it("copies the local database into a remote libSQL database (push)", () => {
    const remote = new CompatDatabase(new LibsqlDriver({ url: hrana.url, authToken: "tok" }, http.transport))
    const result = cloneDatabase(source, remote, { overwrite: false })
    const tables = listTables(source)
    expect(result.tables).toBe(tables.length)
    expect(result.rows).toBeGreaterThan(300)
    expect(snapshot(remote, tables)).toEqual(snapshot(source, tables))
    // AUTOINCREMENT counters survive the copy (new rows do not reuse ids).
    expect(remote.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'CustomerM'").get()).toEqual(
      source.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'CustomerM'").get(),
    )
    // A second copy without overwrite is refused; with overwrite it replaces.
    expect(() => cloneDatabase(source, remote, { overwrite: false })).toThrow(/not empty/)
    remote.prepare("INSERT INTO BranchM (BranchCode, BranchName) VALUES ('TMP', 'Temp')").run()
    cloneDatabase(source, remote, { overwrite: true })
    expect(remote.prepare("SELECT COUNT(*) AS c FROM BranchM WHERE BranchCode = 'TMP'").get()).toEqual({ c: 0 })
    const direct = new Database(hrana.dbFile, { readonly: true })
    expect(direct.pragma("foreign_key_check")).toEqual([])
    direct.close()
  })

  it("copies a remote database back into the browser (pull)", async () => {
    const remote = new CompatDatabase(new LibsqlDriver({ url: hrana.url, authToken: "tok" }, http.transport))
    const SQL = await initSqlJs()
    const local = new CompatDatabase(new SqlJsDriver(SQL))
    cloneDatabase(remote, local, { overwrite: true })
    const tables = listTables(source)
    expect(snapshot(local, tables)).toEqual(snapshot(source, tables))
  })

  it("produces a SQL dump that rebuilds the same database in native SQLite", () => {
    const sql = dumpSql(source)
    const native = new Database(":memory:")
    native.exec(sql)
    const tables = listTables(source)
    expect(snapshot(native, tables)).toEqual(snapshot(source, tables))
  })

  it("a restored backup boots the full backend with the data intact", async () => {
    const bytes = (source.driver as SqlJsDriver).export()
    resetBackendModules()
    const backend = await bootBackend(await createSqlJsDriver(bytes))
    await backend.login()
    const customers = await backend.invoke("customers:getAll")
    expect(customers.length).toBe(5)
    expect(backend.runtime.getMigrationReport().applied).toEqual([])
  })
})

describe("remote start-up cost", () => {
  it("a warm start skips seeding and costs far fewer round trips", async () => {
    const fresh = await startHranaServer()
    try {
      resetBackendModules()
      const cold = new LibsqlDriver({ url: fresh.url }, http.transport)
      await bootBackend(cold)
      resetBackendModules()
      const warm = new LibsqlDriver({ url: fresh.url }, http.transport)
      await bootBackend(warm)
      console.info(`remote start-up: cold ${cold.roundTrips} requests, warm ${warm.roundTrips} requests`)
      expect(warm.roundTrips).toBeLessThan(cold.roundTrips / 3)
    } finally {
      fresh.stop()
    }
  })
})
