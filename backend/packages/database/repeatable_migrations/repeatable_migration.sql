-- Repeatable migrations: backfills columns, tables, and indexes for existing databases
-- where initial migration files have already been applied and marked in schema_migrations.
-- Statements here are executed on database startup. Column additions that already exist
-- are safely ignored when SQLite reports "duplicate column name".

-- Backfill Category column on SO (Sales Orders)
ALTER TABLE SO ADD COLUMN Category TEXT NOT NULL DEFAULT 'tyre';

-- Backfill IsAdvance column on SOPayments
ALTER TABLE SOPayments ADD COLUMN IsAdvance INTEGER NOT NULL DEFAULT 0;

-- Backfill SupplierTypeID on SupplierM
ALTER TABLE SupplierM ADD COLUMN SupplierTypeID INTEGER;

-- Backfill GatePass columns on SODelivery
ALTER TABLE SODelivery ADD COLUMN GatePassIssuedAt DATETIME;
ALTER TABLE SODelivery ADD COLUMN GatePassIssuedBy INTEGER;
ALTER TABLE SODelivery ADD COLUMN GatePassPaymentOverride INTEGER NOT NULL DEFAULT 0;
ALTER TABLE SODelivery ADD COLUMN GatePassPaymentOverrideShortfall REAL NOT NULL DEFAULT 0;

-- Backfill BatchCode on POGoodsReceiptBatches
ALTER TABLE POGoodsReceiptBatches ADD COLUMN BatchCode TEXT;

-- Backfill DAG contractor approvals & walk-in links (referenced in zz_dag.sql)
CREATE TABLE IF NOT EXISTS DAGContractorApprovals (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  DAGID INTEGER NOT NULL,
  ContractorID INTEGER NOT NULL,
  ApprovalStatus TEXT CHECK (ApprovalStatus IN ('approved', 'rejected')),
  ApprovedDateTime TEXT,
  CapturedBy INTEGER,
  FOREIGN KEY (DAGID) REFERENCES DAG(ID),
  FOREIGN KEY (ContractorID) REFERENCES ContractorM(ID)
);

CREATE INDEX IF NOT EXISTS idx_dag_contractor_approvals_dag
  ON DAGContractorApprovals (DAGID, ID DESC);

CREATE TABLE IF NOT EXISTS DAGWalkinLink (
  DAGID INTEGER NOT NULL UNIQUE,
  WalkinCustomerID INTEGER NOT NULL,
  PRIMARY KEY (DAGID, WalkinCustomerID),
  FOREIGN KEY (DAGID) REFERENCES DAG(ID) ON DELETE CASCADE,
  FOREIGN KEY (WalkinCustomerID) REFERENCES WalkinCustomer(ID) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_dag_walkin_link_wc ON DAGWalkinLink(WalkinCustomerID);
