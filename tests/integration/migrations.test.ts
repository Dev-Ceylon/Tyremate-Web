import Database from "better-sqlite3"
import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver } from "../helpers/backend"

function schemaOf(rows: { type: string; name: string; sql: string | null }[]) {
  return rows
    .filter((r) => !r.name.startsWith("sqlite_"))
    .map((r) => `${r.type}:${r.name}:${(r.sql ?? "").replace(/\s+/g, " ")}`)
    .sort()
}

describe("migrations", () => {
  it("apply without failures on sql.js and match better-sqlite3 schema", async () => {
    const backend = await bootBackend(await createSqlJsDriver())
    const report = backend.runtime.getMigrationReport()
    expect(report.failed).toEqual([])
    expect(report.applied.length).toBeGreaterThanOrEqual(51)

    const status = await (async () => {
      await backend.login()
      return backend.invoke("admin:getSchemaStatus")
    })()
    expect(status.pending).toBe(0)

    const sqljsSchema = schemaOf(
      backend.db.prepare("SELECT type, name, sql FROM sqlite_master").all() as never,
    )

    // Reference: run the same bundled migrations through native better-sqlite3.
    const native = new Database(":memory:")
    const { MIGRATIONS, REPEATABLE_MIGRATIONS } = require("../../backend/platform/migrations.generated")
    const { applyPendingMigrations, runRepeatableMigrations } = require("../../backend/packages/database/migrationRunner")
    const nativeReport = applyPendingMigrations(native, MIGRATIONS)
    expect(nativeReport.failed).toEqual([])
    runRepeatableMigrations(native, REPEATABLE_MIGRATIONS)
    const nativeSchema = schemaOf(native.prepare("SELECT type, name, sql FROM sqlite_master").all() as never)
    // sql.js side additionally has schema_repeatable_migrations.
    expect(sqljsSchema.filter((s) => !s.includes("schema_repeatable_migrations"))).toEqual(
      nativeSchema.filter((s) => !s.includes("schema_repeatable_migrations"))
    )
  })
})
