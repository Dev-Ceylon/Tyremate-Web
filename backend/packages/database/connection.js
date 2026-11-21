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

  // Live schema compatibility for Battery tables:
  // Battery locations can be assigned from either BatteryLocationM (dedicated)
  // or StorageLocationM (fallback). Pre-existing databases might have rigid
  // single-table foreign keys referencing StorageLocationM or BatteryLocationM,
  // which causes SQLite to fail with "FOREIGN KEY constraint failed" when an
  // ID is from the other table. We migrate existing tables to remove single-table
  // foreign keys on LocationId/LocationID while preserving all data.
  const poBatteryAllocationsExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='PoBatteryAllocations'")
    .get()
  if (poBatteryAllocationsExists) {
    const fks = db.prepare("PRAGMA foreign_key_list(PoBatteryAllocations)").all()
    const hasLocationFK = fks.some((fk) => fk.from === "LocationId")
    if (hasLocationFK) {
      db.pragma("foreign_keys = OFF")
      db.exec(`
        CREATE TABLE PoBatteryAllocations_migrated (
          Id INTEGER PRIMARY KEY AUTOINCREMENT,
          POID INTEGER NOT NULL,
          PoBatteriesID INTEGER NOT NULL,
          LocationId INTEGER NOT NULL,
          FOREIGN KEY (POID) REFERENCES PO(ID),
          FOREIGN KEY (PoBatteriesID) REFERENCES POBatteries(ID),
          UNIQUE (POID, PoBatteriesID)
        );
        INSERT INTO PoBatteryAllocations_migrated (Id, POID, PoBatteriesID, LocationId)
          SELECT Id, POID, PoBatteriesID, LocationId FROM PoBatteryAllocations;
        DROP TABLE PoBatteryAllocations;
        ALTER TABLE PoBatteryAllocations_migrated RENAME TO PoBatteryAllocations;
        CREATE INDEX IF NOT EXISTS idx_po_battery_allocations_poid ON PoBatteryAllocations (POID);
        CREATE INDEX IF NOT EXISTS idx_po_battery_allocations_pobatteriesid ON PoBatteryAllocations (PoBatteriesID);
      `)
      db.pragma("foreign_keys = ON")
    }
  }

  const batteryStorageManagerExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='BatteryStorageManager'")
    .get()
  if (batteryStorageManagerExists) {
    const fks = db.prepare("PRAGMA foreign_key_list(BatteryStorageManager)").all()
    const hasLocationFK = fks.some((fk) => fk.from === "LocationID")
    if (hasLocationFK) {
      db.pragma("foreign_keys = OFF")
      db.exec(`
        CREATE TABLE BatteryStorageManager_migrated (
          Id INTEGER PRIMARY KEY AUTOINCREMENT,
          BatteryId INTEGER NOT NULL,
          LocationID INTEGER NOT NULL,
          Qty INTEGER NOT NULL DEFAULT 0 CHECK (Qty >= 0),
          OrderID INTEGER,
          SourceTypeId INTEGER,
          SourceId INTEGER,
          CreatedBy TEXT,
          createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (BatteryId) REFERENCES BatteryM(Id),
          FOREIGN KEY (SourceTypeId) REFERENCES StorageSourceM(Id)
        );
        INSERT INTO BatteryStorageManager_migrated (Id, BatteryId, LocationID, Qty, OrderID, SourceTypeId, SourceId, CreatedBy, createdDate)
          SELECT Id, BatteryId, LocationID, Qty, OrderID, SourceTypeId, SourceId, CreatedBy, createdDate FROM BatteryStorageManager;
        DROP TABLE BatteryStorageManager;
        ALTER TABLE BatteryStorageManager_migrated RENAME TO BatteryStorageManager;
        CREATE INDEX IF NOT EXISTS idx_battery_storage_manager_location ON BatteryStorageManager (LocationID);
        CREATE INDEX IF NOT EXISTS idx_battery_storage_manager_battery ON BatteryStorageManager (BatteryId);
      `)
      db.pragma("foreign_keys = ON")
    }
  }

  const batteryExpiryReminderExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='BatteryExpiryReminder'")
    .get()
  if (batteryExpiryReminderExists) {
    const fks = db.prepare("PRAGMA foreign_key_list(BatteryExpiryReminder)").all()
    const hasLocationFK = fks.some((fk) => fk.from === "LocationID")
    if (hasLocationFK) {
      db.pragma("foreign_keys = OFF")
      db.exec(`
        CREATE TABLE BatteryExpiryReminder_migrated (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          BatteryStorageManagerBatchID INTEGER,
          BatteryID INTEGER NOT NULL,
          LocationID INTEGER,
          ReminderID INTEGER NOT NULL,
          BatchCode TEXT,
          ExpiryDate TEXT,
          IsDone INTEGER NOT NULL DEFAULT 0,
          CreatedBy TEXT,
          createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (BatteryStorageManagerBatchID) REFERENCES BatteryStorageManagerBatch(Id) ON DELETE CASCADE,
          FOREIGN KEY (BatteryID) REFERENCES BatteryM(Id),
          FOREIGN KEY (ReminderID) REFERENCES Reminders(ID)
        );
        INSERT INTO BatteryExpiryReminder_migrated (ID, BatteryStorageManagerBatchID, BatteryID, LocationID, ReminderID, BatchCode, ExpiryDate, IsDone, CreatedBy, createdDate)
          SELECT ID, BatteryStorageManagerBatchID, BatteryID, LocationID, ReminderID, BatchCode, ExpiryDate, IsDone, CreatedBy, createdDate FROM BatteryExpiryReminder;
        DROP TABLE BatteryExpiryReminder;
        ALTER TABLE BatteryExpiryReminder_migrated RENAME TO BatteryExpiryReminder;
        CREATE INDEX IF NOT EXISTS idx_battery_expiry_reminder_batch ON BatteryExpiryReminder (BatteryStorageManagerBatchID);
        CREATE INDEX IF NOT EXISTS idx_battery_expiry_reminder_reminder ON BatteryExpiryReminder (ReminderID);
      `)
      db.pragma("foreign_keys = ON")
    }
  }
} catch (error) {
  console.error("Failed to initialize database", error)
  throw new Error(`Database initialization failed: ${error.message}`)
}

module.exports = db
