-- SO policy violation type tracking.
-- Lookup table for sales-order compliance violation types: exceeding a tyre's
-- max discount and selling a newer DOT batch while older-DOT stock is still
-- available.

CREATE TABLE IF NOT EXISTS PolicyViolationTypeM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  ViolationTypeCode TEXT NOT NULL UNIQUE,
  ViolationTypeName TEXT NOT NULL
);

-- SO policy violation tracking (parent).
-- One row per compliance breach, per SO line, per violation type. SoID /
-- SoTyreID are intentionally NOT hard foreign keys so each record survives the
-- deletion of its owning order (same convention as SOAuditLog). DOT level
-- detail lives in SOPolicyViolationDOT so a single breach can carry several
-- offending batches without comma packing or duplicated approval state.

CREATE TABLE IF NOT EXISTS SOPolicyViolation (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  SoID INTEGER NOT NULL,
  SoTyreID INTEGER,
  TyreID INTEGER NOT NULL,
  ViolationTypeCode TEXT NOT NULL,
  Qty INTEGER NOT NULL DEFAULT 1,
  Price REAL,
  MaxDiscountAllowed REAL,
  AppliedDiscount REAL,
  DiscountExcess REAL,
  Details TEXT,
  IsApproved INTEGER NOT NULL DEFAULT 0 CHECK (IsApproved IN (0, 1)),
  ApproveNote TEXT,
  ApprovedBy TEXT,
  ApprovedDateTime TEXT,
  ResponsibleUser TEXT,
  CreatedDateTime TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_so_policy_violation_soid ON SOPolicyViolation (SoID);
CREATE INDEX IF NOT EXISTS idx_so_policy_violation_type ON SOPolicyViolation (ViolationTypeCode);
CREATE INDEX IF NOT EXISTS idx_so_policy_violation_tyre ON SOPolicyViolation (TyreID);

-- DOT lots involved in a policy violation (child).
-- One row per offending batch so each DOT stays independently provable and
-- queryable. Only populated for DOT related violation types (fsfo); discount
-- violations (ovmx) have no child rows.

CREATE TABLE IF NOT EXISTS SOPolicyViolationDOT (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  PolicyViolationID INTEGER NOT NULL,
  DOT TEXT,
  OldestAvailableDOT TEXT,
  StorageManagerID INTEGER,
  StorageManagerBatchID INTEGER,
  Qty INTEGER NOT NULL DEFAULT 1,
  CreatedDateTime TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (PolicyViolationID) REFERENCES SOPolicyViolation (Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_so_policy_violation_dot_parent ON SOPolicyViolationDOT (PolicyViolationID);
CREATE INDEX IF NOT EXISTS idx_so_policy_violation_dot_batch ON SOPolicyViolationDOT (StorageManagerBatchID);
CREATE INDEX IF NOT EXISTS idx_so_policy_violation_dot_dot ON SOPolicyViolationDOT (DOT);