-- DAG tyres that arrive back from a gate pass land in a branch's quarantine
-- location. Receiving them into sellable stock is a separate GRN step, recorded
-- here so PO receipts (POGoodsReceipts) and DAG receipts stay separate
-- aggregates with their own line shape (a DAG line points at a quarantine
-- StorageManager lot, not at PoTyres / PoTyresSuppliers).
CREATE TABLE IF NOT EXISTS DAGGoodsReceipts (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  GRNNumber TEXT UNIQUE,
  DAGID INTEGER NOT NULL,
  ReceiptDate DATE NOT NULL,
  DeliveryNoteNumber TEXT,
  Status TEXT NOT NULL DEFAULT 'Posted' CHECK (Status IN ('Posted')),
  CreatedBy TEXT,
  CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PostedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (DAGID) REFERENCES DAG(ID)
);

CREATE TABLE IF NOT EXISTS DAGGoodsReceiptLines (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  GoodsReceiptID INTEGER NOT NULL,
  DAGID INTEGER NOT NULL,
  DAGTyresID INTEGER,
  SourceStorageManagerID INTEGER NOT NULL,
  DestinationLocationID INTEGER NOT NULL,
  DispatchedQty INTEGER NOT NULL DEFAULT 0 CHECK (DispatchedQty >= 0),
  ReceivedQty INTEGER NOT NULL CHECK (ReceivedQty > 0),
  AcceptedQty INTEGER NOT NULL CHECK (AcceptedQty >= 0 AND AcceptedQty <= ReceivedQty),
  DamagedQty INTEGER NOT NULL DEFAULT 0 CHECK (DamagedQty >= 0 AND DamagedQty <= ReceivedQty - AcceptedQty),
  ShortageQty INTEGER NOT NULL DEFAULT 0 CHECK (ShortageQty >= 0),
  OverReceiptQty INTEGER NOT NULL DEFAULT 0 CHECK (OverReceiptQty >= 0),
  DiscrepancyReason TEXT,
  FOREIGN KEY (GoodsReceiptID) REFERENCES DAGGoodsReceipts(ID),
  FOREIGN KEY (DAGID) REFERENCES DAG(ID),
  FOREIGN KEY (DAGTyresID) REFERENCES DAGTyres(ID),
  FOREIGN KEY (SourceStorageManagerID) REFERENCES StorageManager(Id),
  FOREIGN KEY (DestinationLocationID) REFERENCES StorageLocationM(Id)
);

CREATE INDEX IF NOT EXISTS idx_dag_goods_receipts_dagid ON DAGGoodsReceipts (DAGID, ID);
CREATE INDEX IF NOT EXISTS idx_dag_goods_receipt_lines_source ON DAGGoodsReceiptLines (SourceStorageManagerID, GoodsReceiptID);
