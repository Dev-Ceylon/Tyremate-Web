CREATE TABLE IF NOT EXISTS DAG (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerID INTEGER,
  ContractorID INTEGER,
  StatusID INTEGER,
  TotalDAGCost REAL,
  Comment TEXT,
  Date TEXT NOT NULL,
  DeliveryDate TEXT,
  IsPaymentCompleted INTEGER NOT NULL DEFAULT 0 CHECK (IsPaymentCompleted IN (0, 1)),
  FOREIGN KEY (CustomerID) REFERENCES CustomerM(CustomerID),
  FOREIGN KEY (ContractorID) REFERENCES ContractorM(ID),
  FOREIGN KEY (StatusID) REFERENCES StatusM(Id)
);

CREATE TABLE IF NOT EXISTS DAGTyres (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  DAGID INTEGER NOT NULL,
  TyreID INTEGER NOT NULL,
  StorageLocationID INTEGER NOT NULL,
  Qty INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (DAGID) REFERENCES DAG(ID),
  FOREIGN KEY (TyreID) REFERENCES TyreM(Id),
  FOREIGN KEY (StorageLocationID) REFERENCES StorageLocationM(Id)
);

-- A serial is "taken" (collected by the customer) once SoldAt is set. Takes are
-- recorded as a DAGSales header plus one DAGSaleLines row per serial, and the
-- sold marker lives here so the remaining/unsold set is derived, not stored.
CREATE TABLE IF NOT EXISTS DAGTyresSerials (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  DAGTyresID INTEGER NOT NULL,
  SerialNumber TEXT NOT NULL,
  DAGCost REAL,
  SoldAt TEXT,
  SoldBy INTEGER,
  FOREIGN KEY (DAGTyresID) REFERENCES DAGTyres(ID)
);

CREATE TABLE IF NOT EXISTS DagTyreStorage (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  DAGTyresID INTEGER NOT NULL,
  StorageManagerID INTEGER NOT NULL,
  FOREIGN KEY (DAGTyresID) REFERENCES DAGTyres(ID),
  FOREIGN KEY (StorageManagerID) REFERENCES StorageManager(Id)
);

CREATE TABLE IF NOT EXISTS DAGPayments (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  DAGID INTEGER NOT NULL,
  PaymentID INTEGER NOT NULL,
  FOREIGN KEY (DAGID) REFERENCES DAG(ID),
  FOREIGN KEY (PaymentID) REFERENCES Payments(ID)
);

-- A "take" is a single event where the customer collects one or more serials and
-- pays for exactly those. DAGSales is the header (who/when and which payment),
-- DAGSaleLines pins each serial that left in that take. PaymentID is nullable so
-- a zero-cost take can be recorded without a payment row.
CREATE TABLE IF NOT EXISTS DAGSales (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  DAGID INTEGER NOT NULL,
  PaymentID INTEGER,
  SoldDate TEXT NOT NULL,
  SoldBy INTEGER,
  FOREIGN KEY (DAGID) REFERENCES DAG(ID),
  FOREIGN KEY (PaymentID) REFERENCES Payments(ID)
);

CREATE TABLE IF NOT EXISTS DAGSaleLines (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  DAGSaleID INTEGER NOT NULL,
  DAGTyresID INTEGER NOT NULL,
  DAGTyresSerialID INTEGER NOT NULL,
  Amount REAL NOT NULL DEFAULT 0,
  -- A serial can only be taken once; the UNIQUE constraint is the database-level
  -- guard behind the service's own "already taken" check.
  UNIQUE (DAGTyresSerialID),
  FOREIGN KEY (DAGSaleID) REFERENCES DAGSales(ID),
  FOREIGN KEY (DAGTyresID) REFERENCES DAGTyres(ID),
  FOREIGN KEY (DAGTyresSerialID) REFERENCES DAGTyresSerials(ID)
);

CREATE INDEX IF NOT EXISTS idx_dag_sales_dag
  ON DAGSales (DAGID, ID DESC);

-- Contractor allocation and its approval decision, kept as a child table
-- rather than columns on DAG/DAGGatePass so that a reassignment (or a rejected
-- approval followed by a new one) retains full history. Mirrors the
-- multi-row child table pattern already used by ChequePaymentReceipts.
--
-- Assignment and approval are two separate steps, mirroring PO supplier
-- allocation in PoTyresSuppliers: the row is created when the contractor is
-- allocated and ApprovalStatus stays NULL until an approver decides.
--
-- ApprovalStatus is therefore a nullable tri-state, deliberately matching the
-- NULL/1/0 shape of PoTyresSuppliers.IsApproved:
--   NULL      -> pending, awaiting an approve/reject decision
--   'approved' -> approved
--   'rejected' -> rejected
-- A CHECK constraint permits NULL (SQLite treats NULL as passing any CHECK),
-- so no explicit "pending" sentinel is stored.
--
-- NOTE: databases created before this table was added here already have
-- zz_dag.sql recorded in schema_migrations, so that file is skipped for them.
-- repeatable_migrations/repeatable_migration.sql backfills them.
CREATE TABLE IF NOT EXISTS DAGContractorApprovals (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  DAGID INTEGER NOT NULL,
  ContractorID INTEGER NOT NULL,
  ApprovalStatus TEXT CHECK (ApprovalStatus IN ('approved', 'rejected')),
  -- Written by the service using local wall-clock time when the decision is
  -- made. NULL while the approval is still pending. SQLite's own date
  -- functions are avoided deliberately (see localToday in goodsReceiptService)
  -- because they previously caused timezone drift.
  ApprovedDateTime TEXT,
  -- Logged-in operator who made the approve/reject decision (ctx.user.id).
  -- NULL while the approval is still pending.
  CapturedBy INTEGER,
  FOREIGN KEY (DAGID) REFERENCES DAG(ID),
  FOREIGN KEY (ContractorID) REFERENCES ContractorM(ID)
);

CREATE INDEX IF NOT EXISTS idx_dag_contractor_approvals_dag
  ON DAGContractorApprovals (DAGID, ID DESC);

-- Link DAG -> WalkinCustomer (1:1)
CREATE TABLE IF NOT EXISTS DAGWalkinLink (
  DAGID INTEGER NOT NULL UNIQUE,
  WalkinCustomerID INTEGER NOT NULL,
  PRIMARY KEY (DAGID, WalkinCustomerID),
  FOREIGN KEY (DAGID) REFERENCES DAG(ID) ON DELETE CASCADE,
  FOREIGN KEY (WalkinCustomerID) REFERENCES WalkinCustomer(ID) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_dag_walkin_link_wc ON DAGWalkinLink(WalkinCustomerID);


