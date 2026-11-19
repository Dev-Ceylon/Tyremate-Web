CREATE TABLE IF NOT EXISTS POGoodsReceipts (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  GRNNumber TEXT UNIQUE,
  POID INTEGER NOT NULL,
  SupplierID INTEGER NOT NULL,
  ReceiptDate DATE NOT NULL,
  DeliveryNoteNumber TEXT,
  Status TEXT NOT NULL DEFAULT 'Posted' CHECK (Status IN ('Posted')),
  CreatedBy TEXT,
  CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PostedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (POID) REFERENCES PO(ID),
  FOREIGN KEY (SupplierID) REFERENCES SupplierM(SupplierID)
);

CREATE TABLE IF NOT EXISTS POGoodsReceiptLines (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  GoodsReceiptID INTEGER NOT NULL,
  PoTyresID INTEGER NOT NULL,
  PoTyresSupplierID INTEGER NOT NULL,
  LocationID INTEGER NOT NULL,
  DispatchedQty INTEGER NOT NULL DEFAULT 0 CHECK (DispatchedQty >= 0),
  ReceivedQty INTEGER NOT NULL CHECK (ReceivedQty > 0),
  AcceptedQty INTEGER NOT NULL CHECK (AcceptedQty >= 0 AND AcceptedQty <= ReceivedQty),
  DamagedQty INTEGER NOT NULL DEFAULT 0 CHECK (DamagedQty >= 0 AND DamagedQty <= ReceivedQty - AcceptedQty),
  ShortageQty INTEGER NOT NULL DEFAULT 0 CHECK (ShortageQty >= 0),
  OverReceiptQty INTEGER NOT NULL DEFAULT 0 CHECK (OverReceiptQty >= 0),
  DiscrepancyReason TEXT,
  FOREIGN KEY (GoodsReceiptID) REFERENCES POGoodsReceipts(ID),
  FOREIGN KEY (PoTyresID) REFERENCES POTyres(ID),
  FOREIGN KEY (PoTyresSupplierID) REFERENCES PoTyresSuppliers(ID),
  FOREIGN KEY (LocationID) REFERENCES StorageLocationM(Id)
);

CREATE TABLE IF NOT EXISTS POGoodsReceiptBatches (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  GoodsReceiptLineID INTEGER NOT NULL,
  DOT TEXT,
  ReceivedQty INTEGER NOT NULL CHECK (ReceivedQty > 0),
  AcceptedQty INTEGER NOT NULL CHECK (AcceptedQty >= 0 AND AcceptedQty <= ReceivedQty),
  FOREIGN KEY (GoodsReceiptLineID) REFERENCES POGoodsReceiptLines(ID) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_po_goods_receipts_poid ON POGoodsReceipts (POID, ID);
CREATE INDEX IF NOT EXISTS idx_po_goods_receipt_lines_allocation ON POGoodsReceiptLines (PoTyresSupplierID, GoodsReceiptID);
CREATE INDEX IF NOT EXISTS idx_po_goods_receipt_lines_potyres ON POGoodsReceiptLines (PoTyresID, GoodsReceiptID);
CREATE INDEX IF NOT EXISTS idx_po_goods_receipt_batches_line ON POGoodsReceiptBatches (GoodsReceiptLineID);
