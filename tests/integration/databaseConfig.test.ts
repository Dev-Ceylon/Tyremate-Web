import { describe, expect, it } from "vitest"
import {
  DEV_DATABASE_CONFIG,
  PROD_DATABASE_CONFIG,
  getActiveCodeDatabaseConfig,
  isDatabaseConfigLocked,
  isProductionEnvironment,
} from "../../web/config/databaseCredentials"
import {
  defaultDatabaseConfig,
  loadDatabaseConfig,
  saveDatabaseConfig,
} from "../../web/bridge/config"

describe("Database Environment & Code Configuration", () => {
  it("enforces database configuration lock when credentials are provided in code", () => {
    const isLocked = isDatabaseConfigLocked()
    const active = getActiveCodeDatabaseConfig()
    if (active.driver === "libsql" && active.url) {
      expect(isLocked).toBe(true)
    } else {
      expect(isLocked).toBe(false)
    }
  })

  it("resolves active database config based on environment", () => {
    const isProd = isProductionEnvironment()
    const active = getActiveCodeDatabaseConfig()

    if (isProd) {
      if (PROD_DATABASE_CONFIG.url && PROD_DATABASE_CONFIG.url.toLowerCase() !== "local") {
        expect(active.driver).toBe("libsql")
        expect(active.url).toBe(PROD_DATABASE_CONFIG.url)
      } else {
        expect(active.driver).toBe("local")
      }
    } else {
      if (DEV_DATABASE_CONFIG.url && DEV_DATABASE_CONFIG.url.toLowerCase() !== "local") {
        expect(active.driver).toBe("libsql")
        expect(active.url).toBe(DEV_DATABASE_CONFIG.url)
      } else {
        expect(active.driver).toBe("local")
      }
    }
  })

  it("loadDatabaseConfig and defaultDatabaseConfig return active code config when locked", () => {
    if (!isDatabaseConfigLocked()) return
    const active = getActiveCodeDatabaseConfig()
    const loaded = loadDatabaseConfig()
    const def = defaultDatabaseConfig()

    expect(loaded).toEqual(active)
    expect(def).toEqual(active)
  })

  it("prevents saving manual database configuration when locked", () => {
    if (!isDatabaseConfigLocked()) return
    expect(() =>
      saveDatabaseConfig({ driver: "local" }),
    ).toThrow(/locked in code and cannot be modified/)
  })
})
