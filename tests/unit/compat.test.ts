/**
 * Behavioural parity of the better-sqlite3 facade, run against:
 *   - native better-sqlite3 (the desktop engine; reference behaviour)
 *   - CompatDatabase + SqlJsDriver   (browser local mode)
 *   - CompatDatabase + LibsqlDriver  (remote Turso/libSQL mode, via a Hrana server)
 */
import Database from "better-sqlite3"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { CompatDatabase } from "../../web/db/compat"
import { LibsqlDriver } from "../../web/db/libsqlDriver"
import { createSqlJsDriver } from "../helpers/backend"
import { startHranaServer, type RunningHrana } from "../helpers/hrana"
import { createSyncHttpTransport } from "../helpers/syncHttp"

type AnyDb = {
  prepare: (sql: string) => any
  exec: (sql: string) => unknown
  transaction: (fn: (...a: any[]) => any) => (...a: any[]) => any
  pragma: (s: string, o?: { simple?: boolean }) => unknown
}

let hrana: RunningHrana
let http: ReturnType<typeof createSyncHttpTransport>

beforeAll(async () => {
  hrana = await startHranaServer("secret-token")
  http = createSyncHttpTransport()
})
afterAll(async () => {
  hrana?.stop()
  await http?.close()
})

const engines: [string, () => Promise<AnyDb>][] = [
  ["better-sqlite3", async () => new Database(":memory:") as unknown as AnyDb],
  ["sql.js", async () => new CompatDatabase(await createSqlJsDriver())],
  [
    "libsql",
    async () => {
      const db = new CompatDatabase(new LibsqlDriver({ url: hrana.url, authToken: "secret-token" }, http.transport))
      db.exec("DROP TABLE IF EXISTS child; DROP TABLE IF EXISTS item;")
      return db
    },
  ],
]

describe.each(engines)("compat semantics on %s", (_name, make) => {
  let db: AnyDb

  beforeAll(async () => {
    db = await make()
    db.exec(`
      CREATE TABLE item (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, qty INTEGER DEFAULT 0, price REAL);
      CREATE TABLE child (id INTEGER PRIMARY KEY, itemId INTEGER NOT NULL REFERENCES item(id));
    `)
    db.pragma("foreign_keys = ON")
  })

  it("run() reports changes and lastInsertRowid", () => {
    const info = db.prepare("INSERT INTO item (name, qty, price) VALUES (?, ?, ?)").run("a", 1, 2.5)
    expect(info.changes).toBe(1)
    expect(Number(info.lastInsertRowid)).toBe(1)
    const info2 = db.prepare("INSERT INTO item (name, qty) VALUES (?, ?)").run(["b", 2])
    expect(Number(info2.lastInsertRowid)).toBe(2)
    expect(db.prepare("UPDATE item SET qty = qty + 1").run().changes).toBe(2)
  })

  it("get() returns object or undefined; all() returns arrays", () => {
    expect(db.prepare("SELECT name, qty, price FROM item WHERE id = ?").get(1)).toEqual({ name: "a", qty: 2, price: 2.5 })
    expect(db.prepare("SELECT * FROM item WHERE id = ?").get(999)).toBeUndefined()
    expect(db.prepare("SELECT name FROM item ORDER BY id").all()).toEqual([{ name: "a" }, { name: "b" }])
    expect(db.prepare("SELECT COUNT(*) AS c FROM item").pluck().get()).toBe(2)
  })

  it("supports RETURNING through get()", () => {
    const row = db.prepare("INSERT INTO item (name) VALUES (?) RETURNING id, name").get("c")
    expect(row).toEqual({ id: 3, name: "c" })
  })

  it("commits transactions and returns the function result", () => {
    const tx = db.transaction((n: string) => {
      db.prepare("INSERT INTO item (name) VALUES (?)").run(n)
      return "done"
    })
    expect(tx("d")).toBe("done")
    expect(db.prepare("SELECT COUNT(*) AS c FROM item").get().c).toBe(4)
  })

  it("rolls back on error and rethrows", () => {
    const tx = db.transaction(() => {
      db.prepare("INSERT INTO item (name) VALUES (?)").run("e")
      db.prepare("INSERT INTO item (name) VALUES (?)").run("a") // UNIQUE violation
    })
    expect(() => tx()).toThrow(/UNIQUE/)
    expect(db.prepare("SELECT COUNT(*) AS c FROM item WHERE name = 'e'").get().c).toBe(0)
  })

  it("nests transactions with savepoints", () => {
    const inner = db.transaction(() => {
      db.prepare("INSERT INTO item (name) VALUES (?)").run("inner")
      throw new Error("inner failed")
    })
    const outer = db.transaction(() => {
      db.prepare("INSERT INTO item (name) VALUES (?)").run("outer")
      try {
        inner()
      } catch {
        // swallow: outer continues
      }
      return db.prepare("SELECT COUNT(*) AS c FROM item WHERE name IN ('outer','inner')").get().c
    })
    expect(outer()).toBe(1)
    expect(db.prepare("SELECT name FROM item WHERE name IN ('outer','inner')").all()).toEqual([{ name: "outer" }])
  })

  it("enforces foreign keys", () => {
    expect(() => db.prepare("INSERT INTO child (itemId) VALUES (?)").run(12345)).toThrow(/FOREIGN KEY/)
  })

  it("handles nulls, floats, large integers and text", () => {
    db.prepare("INSERT INTO item (name, qty, price) VALUES (?, ?, ?)").run("n", null, 0.1 + 0.2)
    const row = db.prepare("SELECT qty, price FROM item WHERE name = 'n'").get()
    expect(row.qty).toBeNull()
    expect(row.price).toBeCloseTo(0.3)
    expect(db.prepare("SELECT ? AS v").get(2 ** 40).v).toBe(2 ** 40)
    expect(db.prepare("SELECT ? AS v").get("ශ්‍රී ලංකා").v).toBe("ශ්‍රී ලංකා")
  })

  it("rejects async transaction functions", () => {
    const tx = db.transaction(async () => 1)
    expect(() => tx()).toThrow(/promise/i)
  })
})

describe("libsql driver specifics", () => {
  it("rejects a bad token", () => {
    const db = new CompatDatabase(new LibsqlDriver({ url: hrana.url, authToken: "nope" }, http.transport))
    expect(() => db.prepare("SELECT 1").get()).toThrow(/credentials/)
  })

  it("normalises libsql:// URLs", async () => {
    const { normalizeLibsqlUrl } = await import("../../web/db/libsqlDriver")
    expect(normalizeLibsqlUrl("libsql://tyremate-acme.turso.io/")).toBe("https://tyremate-acme.turso.io")
    expect(normalizeLibsqlUrl("http://127.0.0.1:8080")).toBe("http://127.0.0.1:8080")
    expect(normalizeLibsqlUrl("db.example.com")).toBe("https://db.example.com")
  })

  it("reports network failures clearly", () => {
    const db = new CompatDatabase(new LibsqlDriver({ url: "http://127.0.0.1:1" }, http.transport))
    expect(() => db.prepare("SELECT 1").get()).toThrow(/Could not reach the database server/)
  })
})

describe.each(engines)("parameter binding on %s", (_name, make) => {
  let db: AnyDb
  beforeAll(async () => {
    db = await make()
  })
  const cases: [string, unknown[]][] = [
    ["SELECT ? AS a", [{ x: 1 }]],
    ["SELECT ? AS a", []],
    ["SELECT ? AS a", [1, 2]],
    ["SELECT @x AS a", [{ y: 1 }]],
    ["SELECT 1 AS a", [{ x: 1 }]],
    ["SELECT @x AS a, ? AS b, :x AS c, $x AS d", [{ x: 7 }, 2]],
    ["SELECT 'what? @no :no' AS a, ? AS b", [5]],
    ["SELECT ? AS a, ? AS b", [[1, 2]]],
    ["SELECT \"@col\" AS a FROM (SELECT 3 AS \"@col\")", []],
  ]
  it.each(cases)("%s %j behaves like better-sqlite3", (sql, args) => {
    const native = new Database(":memory:")
    let expected: unknown
    try {
      expected = { ok: native.prepare(sql).get(...(args as never[])) }
    } catch (error) {
      expected = { error: (error as Error).message }
    }
    let actual: unknown
    try {
      actual = { ok: db.prepare(sql).get(...args) }
    } catch (error) {
      actual = { error: (error as Error).message }
    }
    expect(actual).toEqual(expected)
  })
})

describe.each(engines)("error shape on %s", (_name, make) => {
  it("raises SqliteError with better-sqlite3 codes", async () => {
    const db = await make()
    db.exec("DROP TABLE IF EXISTS e_child; DROP TABLE IF EXISTS e_parent;")
    db.exec("CREATE TABLE e_parent (id INTEGER PRIMARY KEY, v TEXT UNIQUE NOT NULL); CREATE TABLE e_child (pid INTEGER REFERENCES e_parent(id));")
    db.pragma("foreign_keys = ON")
    db.prepare("INSERT INTO e_parent (id, v) VALUES (1, 'a')").run()
    const capture = (fn: () => unknown) => {
      try {
        fn()
        return null
      } catch (error) {
        const e = error as Error & { code?: string }
        return { name: e.name, code: e.code, message: e.message }
      }
    }
    expect(capture(() => db.prepare("INSERT INTO e_parent (v) VALUES ('a')").run())).toEqual({
      name: "SqliteError",
      code: "SQLITE_CONSTRAINT_UNIQUE",
      message: "UNIQUE constraint failed: e_parent.v",
    })
    expect(capture(() => db.prepare("INSERT INTO e_parent (v) VALUES (NULL)").run())).toMatchObject({
      name: "SqliteError",
      code: "SQLITE_CONSTRAINT_NOTNULL",
    })
    expect(capture(() => db.prepare("INSERT INTO e_child (pid) VALUES (99)").run())).toMatchObject({
      name: "SqliteError",
      code: "SQLITE_CONSTRAINT_FOREIGNKEY",
      message: "FOREIGN KEY constraint failed",
    })
    expect(capture(() => db.prepare("SELECT * FROM missing_table").all())).toMatchObject({
      name: "SqliteError",
      code: "SQLITE_ERROR",
      message: "no such table: missing_table",
    })
  })
})

describe("toSqliteError", () => {
  it("normalises remote error formats", async () => {
    const { toSqliteError } = await import("../../web/db/compat")
    const remote = Object.assign(new Error("SQLite error: UNIQUE constraint failed: t.v"), { code: "SQLITE_CONSTRAINT" })
    expect(toSqliteError(remote)).toMatchObject({ name: "SqliteError", code: "SQLITE_CONSTRAINT_UNIQUE", message: "UNIQUE constraint failed: t.v" })
    const network = Object.assign(new Error("Could not reach the database server"), { code: "NETWORK" })
    expect(toSqliteError(network)).toBe(network)
  })
})
