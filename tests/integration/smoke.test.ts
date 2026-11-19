import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver } from "../helpers/backend"

describe("backend boots on sql.js", () => {
  it("migrates, seeds and logs in", async () => {
    const backend = await bootBackend(await createSqlJsDriver())
    const user = await backend.login()
    expect(user.username).toBe("admin")
    expect(user.permissions).toContain("god")
    const channels = backend.electron.listChannels()
    expect(channels.length).toBeGreaterThan(200)
  })
})
