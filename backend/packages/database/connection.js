// Web edition: the database handle is created by the host runtime (browser
// worker or test harness) and injected through backend/platform/runtime.
// It exposes the better-sqlite3 API (see web/db/compat.ts), so every
// repository/service keeps working unchanged.
const { getDatabase, getMigrationReport } = require("../../platform/runtime")
const { MIGRATIONS, REPEATABLE_MIGRATIONS } = require("../../platform/migrations.generated")
const { applyPendingMigrations, runRepeatableMigrations } = require("./migrationRunner")

let db

try {
  db = getDatabase()
  db.pragma("foreign_keys = ON")

  const report = getMigrationReport()
  Object.assign(report, applyPendingMigrations(db, MIGRATIONS))
  report.repeatable = runRepeatableMigrations(db, REPEATABLE_MIGRATIONS)

  // Repeatable migration files may have already been consumed by an older
  // app start. Keep the live schema compatible with gate-pass queries even
  // when an existing database predates these SODelivery columns.
  const soDeliveryColumns = new Set(
    db.prepare("PRAGMA table_info(SODelivery)").all().map((column) => column.name),
  )
  if (soDeliveryColumns.size > 0 && !soDeliveryColumns.has("GatePassIssuedAt")) {
    db.exec("ALTER TABLE SODelivery ADD COLUMN GatePassIssuedAt DATETIME")
  }
  if (soDeliveryColumns.size > 0 && !soDeliveryColumns.has("GatePassIssuedBy")) {
    db.exec("ALTER TABLE SODelivery ADD COLUMN GatePassIssuedBy INTEGER")
  }
  if (soDeliveryColumns.size > 0 && !soDeliveryColumns.has("GatePassPaymentOverride")) {
    db.exec("ALTER TABLE SODelivery ADD COLUMN GatePassPaymentOverride INTEGER NOT NULL DEFAULT 0")
  }
  if (soDeliveryColumns.size > 0 && !soDeliveryColumns.has("GatePassPaymentOverrideShortfall")) {
    db.exec("ALTER TABLE SODelivery ADD COLUMN GatePassPaymentOverrideShortfall REAL NOT NULL DEFAULT 0")
  }
  if (soDeliveryColumns.size > 0) {
    db.exec("CREATE INDEX IF NOT EXISTS idx_so_delivery_gate_pass ON SODelivery (GatePassNo)")
  }

  const supplierColumns = new Set(
    db.prepare("PRAGMA table_info(SupplierM)").all().map((column) => column.name),
  )
  if (supplierColumns.size > 0 && !supplierColumns.has("SupplierTypeID")) {
    db.exec("ALTER TABLE SupplierM ADD COLUMN SupplierTypeID INTEGER")
  }
} catch (error) {
  console.error("Failed to initialize database", error)
  throw new Error(`Database initialization failed: ${error.message}`)
}

module.exports = db
