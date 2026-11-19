-- Audit log tables for monitoring application data changes.
-- EntityId / SoID / POID / OSID are intentionally NOT hard foreign keys
-- so each trail survives the deletion of its owning record.

-- Master data create / update / delete monitoring.
CREATE TABLE IF NOT EXISTS MasterDataAuditLog (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Action TEXT NOT NULL,              -- 'CREATE' | 'UPDATE' | 'DELETE'
  EntityType TEXT NOT NULL,          -- 'Tyre', 'Supplier', 'Customer', ...
  EntityId INTEGER,                  -- PK of the affected record
  EntityName TEXT,                   -- human-readable id (e.g. "BC121 - Michelin")
  BeforeData TEXT,                   -- JSON snapshot before the change
  AfterData TEXT,                    -- JSON snapshot after the change
  ChangedBy TEXT,                    -- session username, fallback "system"
  CreatedDateTime TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_masterdataauditlog_entity ON MasterDataAuditLog (EntityType, EntityId);
CREATE INDEX IF NOT EXISTS idx_masterdataauditlog_created ON MasterDataAuditLog (CreatedDateTime);

-- Sales Order lifecycle events (create / update / delete / complete / payments / returns).
CREATE TABLE IF NOT EXISTS SOAuditLog (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  SoID INTEGER NOT NULL,
  Action TEXT NOT NULL,              -- 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE' | 'PAYMENT' | 'CHEQUE_COLLECTED' | 'RETURN'
  EventData TEXT,                    -- JSON payload describing the event (e.g. payment / return details)
  BeforeData TEXT,                   -- JSON snapshot before the change
  AfterData TEXT,                    -- JSON snapshot after the change
  ChangedBy TEXT,                    -- session username, fallback "system"
  CreatedDateTime TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_soauditlog_soid ON SOAuditLog (SoID);
CREATE INDEX IF NOT EXISTS idx_soauditlog_created ON SOAuditLog (CreatedDateTime);

-- Purchase Order lifecycle events (create / update / delete / status / supplier approval / storage allocation).
CREATE TABLE IF NOT EXISTS POAuditLog (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  POID INTEGER NOT NULL,
  Action TEXT NOT NULL,              -- 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS' | 'SUPPLIER_APPROVAL' | 'ALLOCATE'
  EventData TEXT,                    -- JSON payload describing the event (e.g. status change / allocation details)
  BeforeData TEXT,                   -- JSON snapshot before the change
  AfterData TEXT,                    -- JSON snapshot after the change
  ChangedBy TEXT,                    -- session username, fallback "system"
  CreatedDateTime TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_poauditlog_poid ON POAuditLog (POID);
CREATE INDEX IF NOT EXISTS idx_poauditlog_created ON POAuditLog (CreatedDateTime);

-- Other Service lifecycle events (create / update / delete / complete / payments / cheque collected).
CREATE TABLE IF NOT EXISTS OtherServiceAuditLog (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  OSID INTEGER NOT NULL,
  Action TEXT NOT NULL,              -- 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE' | 'PAYMENT' | 'CHEQUE_COLLECTED'
  EventData TEXT,                    -- JSON payload describing the event (e.g. payment / cheque details)
  BeforeData TEXT,                   -- JSON snapshot before the change
  AfterData TEXT,                    -- JSON snapshot after the change
  ChangedBy TEXT,                    -- session username, fallback "system"
  CreatedDateTime TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_otherserviceauditlog_osid ON OtherServiceAuditLog (OSID);
CREATE INDEX IF NOT EXISTS idx_otherserviceauditlog_created ON OtherServiceAuditLog (CreatedDateTime);
