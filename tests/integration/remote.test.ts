import Database from "better-sqlite3"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { LibsqlDriver } from "../../web/db/libsqlDriver"
import { bootBackend } from "../helpers/backend"
import { startHranaServer, type RunningHrana } from "../helpers/hrana"
import { createSyncHttpTransport } from "../helpers/syncHttp"

let hrana: RunningHrana
let http: ReturnType<typeof createSyncHttpTransport>

beforeAll(async () => {
  hrana = await startHranaServer("tok")
  http = createSyncHttpTransport()
})
afterAll(async () => {
  hrana?.stop()
  await http?.close()
})

describe("backend on a remote libSQL database", () => {
  it("migrates, seeds, logs in and persists data on the server", async () => {
    const driver = new LibsqlDriver({ url: hrana.url, authToken: "tok" }, http.transport)
    const backend = await bootBackend(driver)
    expect(backend.runtime.getMigrationReport().failed).toEqual([])
    const user = await backend.login()
    expect(user.permissions).toContain("god")

    const created = await backend.invoke("branches:create", {
      BranchCode: "WEB-01",
      BranchName: "Web Branch",
    })
    expect(created).toBeTruthy()

    // Read back straight from the server's file with an independent connection.
    const direct = new Database(hrana.dbFile, { readonly: true })
    const row = direct.prepare("SELECT BranchName FROM BranchM WHERE BranchCode = 'WEB-01'").get() as { BranchName: string }
    expect(row.BranchName).toBe("Web Branch")
    const userCount = direct.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }
    expect(userCount.c).toBe(3)
    direct.close()
    console.info(`remote boot used ${driver.roundTrips} round trips`)
  })
})
