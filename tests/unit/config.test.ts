import { describe, expect, it } from "vitest"
import { decodeConnectionCode, encodeConnectionCode, validateDatabaseConfig } from "../../web/bridge/config"

describe("database configuration", () => {
  it("accepts local and libsql configurations", () => {
    expect(validateDatabaseConfig({ driver: "local" })).toEqual({ driver: "local" })
    expect(validateDatabaseConfig({ driver: "libsql", url: " libsql://db-org.turso.io ", authToken: " t " })).toEqual({
      driver: "libsql",
      url: "libsql://db-org.turso.io",
      authToken: "t",
    })
    expect(validateDatabaseConfig({ driver: "libsql", url: "http://127.0.0.1:8080" })).toEqual({
      driver: "libsql",
      url: "http://127.0.0.1:8080",
    })
  })

  it("rejects unsafe or invalid configurations", () => {
    expect(() => validateDatabaseConfig({ driver: "libsql", url: "http://db.example.com" })).toThrow(/https/)
    expect(() => validateDatabaseConfig({ driver: "libsql", url: "" })).toThrow(/valid database URL/)
    expect(() => validateDatabaseConfig({ driver: "postgres" })).toThrow(/Unknown/)
    expect(() => validateDatabaseConfig(null)).toThrow()
  })

  it("round-trips connection codes", () => {
    const config = { driver: "libsql" as const, url: "libsql://tyremate-acme.turso.io", authToken: "eyJhbGciOi.ü+/=" }
    const code = encodeConnectionCode(config)
    expect(code.startsWith("TM1.")).toBe(true)
    expect(code).not.toMatch(/[+/=]/)
    expect(decodeConnectionCode(code)).toEqual(config)
    expect(() => decodeConnectionCode("TM1.%%%")).toThrow(/damaged/)
    expect(() => decodeConnectionCode("hello")).toThrow(/Not a TyreMate/)
  })
})
