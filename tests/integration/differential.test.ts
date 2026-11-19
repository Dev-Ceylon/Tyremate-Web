/**
 * Differential test: the same business scenario on the desktop engine
 * (native better-sqlite3) and on both web drivers must produce identical
 * results, step for step.
 */
import Database from "better-sqlite3"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { LibsqlDriver } from "../../web/db/libsqlDriver"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"
import { startHranaServer, type RunningHrana } from "../helpers/hrana"
import { runScenario, sweepChannels, type Step } from "../helpers/scenario"
import { createSyncHttpTransport } from "../helpers/syncHttp"

let hrana: RunningHrana
let http: ReturnType<typeof createSyncHttpTransport>
const transcripts: Record<string, Step[]> = {}

beforeAll(async () => {
  hrana = await startHranaServer()
  http = createSyncHttpTransport()

  const run = async (backend: Awaited<ReturnType<typeof bootBackend>>) => {
    const scenario = await runScenario(backend)
    const sweep = await sweepChannels(backend)
    return [...scenario, ...sweep]
  }
  resetBackendModules()
  transcripts.native = await run(await bootBackend({ native: new Database(":memory:") }))
  resetBackendModules()
  transcripts.sqljs = await run(await bootBackend(await createSqlJsDriver()))
  resetBackendModules()
  transcripts.libsql = await run(await bootBackend(new LibsqlDriver({ url: hrana.url }, http.transport)))
}, 180_000)

afterAll(async () => {
  hrana?.stop()
  await http?.close()
})

describe("business scenario", () => {
  it("runs the key flows successfully on the desktop engine", () => {
    const byName = Object.fromEntries(transcripts.native.map((s) => [s.step, s]))
    const mustSucceed = [
      "login",
      "sample master data + stock",
      "customers",
      "tyres",
      "storage managers",
      "create customer",
      "update customer",
      "create SO with stock + cash",
      "get SO",
      "SO delivery progress",
      "create SO needing auto PO",
      "list POs",
      "invoices",
      "sales report overview",
      "cash flow overview",
      "sales CSV",
      "create cashier",
      "login cashier",
      "cashier change password",
      "login cashier new password",
      "cashier sees SOs",
    ]
    for (const name of mustSucceed) {
      expect(byName[name], name).toBeDefined()
      expect(byName[name].error, name).toBeUndefined()
      expect(byName[name].ok, name).toBe(true)
    }
    for (const name of [
      "unauthenticated list",
      "login wrong password",
      "cashier denied admin channel",
      "cashier denied PO create",
    ]) {
      expect(byName[name].ok, name).toBe(false)
    }
  })

  it("exercises every IPC channel", () => {
    const swept = transcripts.native.filter((s) => s.step.includes("("))
    expect(swept.length).toBeGreaterThan(400)
    // No handler may crash with an SQL error on the desktop engine either.
    const sqlErrors = swept.filter((s) => s.error && /SQLITE|syntax error|no such (table|column)/i.test(s.error))
    expect(sqlErrors).toEqual([])
  })

  it("sql.js (browser local mode) matches the desktop engine exactly", () => {
    expect(transcripts.sqljs).toEqual(transcripts.native)
  })

  it("libSQL (remote mode) matches the desktop engine exactly", () => {
    expect(transcripts.libsql).toEqual(transcripts.native)
  })
})
