CREATE TABLE IF NOT EXISTS SalesReturn (
  SalesReturnID INTEGER PRIMARY KEY AUTOINCREMENT,
  ReturnNo TEXT UNIQUE NOT NULL,
  SoID INTEGER NOT NULL,
  InvoiceID INTEGER,
  CustomerID INTEGER,
  WalkinCustomerID INTEGER,
  ReturnTypeId INTEGER NOT NULL,
  StatusId INTEGER NOT NULL,
  WarrantyHandlingId INTEGER,
  ExchangeSoID INTEGER,
  RequestedBy INTEGER,
  InspectedBy INTEGER,
  ApprovedBy INTEGER,
  RequestedDate DATETIME DEFAULT (datetime('now','localtime')),
  InspectedDate DATETIME,
  ApprovedDate DATETIME,
  ClosedDate DATETIME,
  Notes TEXT,
  RejectionReason TEXT,
  FOREIGN KEY (ReturnTypeId) REFERENCES SalesReturnTypeM(Id),
  FOREIGN KEY (StatusId) REFERENCES SalesReturnStatusM(Id),
  FOREIGN KEY (WarrantyHandlingId) REFERENCES SalesReturnWarrantyHandlingM(Id),
  FOREIGN KEY (SoID) REFERENCES SO(SoID),
  FOREIGN KEY (InvoiceID) REFERENCES Invoice(InvoiceID),
  FOREIGN KEY (CustomerID) REFERENCES CustomerM(CustomerID),
  FOREIGN KEY (WalkinCustomerID) REFERENCES WalkinCustomer(ID),
  FOREIGN KEY (ExchangeSoID) REFERENCES SO(SoID)
);

CREATE INDEX IF NOT EXISTS idx_salesreturn_so ON SalesReturn(SoID);
CREATE INDEX IF NOT EXISTS idx_salesreturn_invoice ON SalesReturn(InvoiceID);
CREATE INDEX IF NOT EXISTS idx_salesreturn_status ON SalesReturn(StatusId);

CREATE TABLE IF NOT EXISTS SalesReturnLine (
  SalesReturnLineID INTEGER PRIMARY KEY AUTOINCREMENT,
  SalesReturnID INTEGER NOT NULL,
  SoTyreID INTEGER NOT NULL,
  TyreID INTEGER NOT NULL,
  SerialNo TEXT,
  ReturnedQty INTEGER NOT NULL CHECK(ReturnedQty > 0),
  UnitPrice REAL NOT NULL,
  Discount REAL NOT NULL DEFAULT 0,
  LineAmount REAL NOT NULL,
  ReturnReason TEXT,
  AllocationID INTEGER,
  StorageManagerID INTEGER,
  StorageManagerBatchID INTEGER,
  ConditionId INTEGER,
  DispositionId INTEGER,
  Inspected INTEGER NOT NULL DEFAULT 0 CHECK(Inspected IN (0,1)),
  Approved INTEGER NOT NULL DEFAULT 0 CHECK(Approved IN (0,1)),
  InspectionNotes TEXT,
  FOREIGN KEY (SalesReturnID) REFERENCES SalesReturn(SalesReturnID) ON DELETE CASCADE,
  FOREIGN KEY (ConditionId) REFERENCES SalesReturnConditionM(Id),
  FOREIGN KEY (DispositionId) REFERENCES SalesReturnDispositionM(Id),
  FOREIGN KEY (AllocationID) REFERENCES SoTyreStorageAllocation(Id),
  FOREIGN KEY (StorageManagerID) REFERENCES StorageManager(Id),
  FOREIGN KEY (StorageManagerBatchID) REFERENCES StorageManagerBatch(Id),
  FOREIGN KEY (SoTyreID) REFERENCES SoTyres(ID),
  FOREIGN KEY (TyreID) REFERENCES TyreM(Id)
);

CREATE INDEX IF NOT EXISTS idx_salesreturnline_return ON SalesReturnLine(SalesReturnID);
CREATE INDEX IF NOT EXISTS idx_salesreturnline_sotyre ON SalesReturnLine(SoTyreID);
CREATE INDEX IF NOT EXISTS idx_salesreturnline_allocation ON SalesReturnLine(AllocationID);

CREATE TABLE IF NOT EXISTS SalesReturnStockMovement (
  MovementID INTEGER PRIMARY KEY AUTOINCREMENT,
  SalesReturnID INTEGER NOT NULL,
  SalesReturnLineID INTEGER NOT NULL,
  TyreID INTEGER NOT NULL,
  StorageManagerID INTEGER,
  StorageManagerBatchID INTEGER,
  Qty INTEGER NOT NULL CHECK(Qty > 0),
  MovementType TEXT NOT NULL CHECK(MovementType IN ('RECEIVE_SALEABLE','RECEIVE_QUARANTINE','MOVE_TO_SCRAP','MOVE_TO_SUPPLIER')),
  LocationType TEXT NOT NULL CHECK(LocationType IN ('SALEABLE','QUARANTINE','SCRAP','SUPPLIER_RETURN')),
  MovedBy INTEGER,
  MovedAt DATETIME DEFAULT (datetime('now','localtime')),
  Notes TEXT,
  FOREIGN KEY (SalesReturnID) REFERENCES SalesReturn(SalesReturnID),
  FOREIGN KEY (SalesReturnLineID) REFERENCES SalesReturnLine(SalesReturnLineID),
  FOREIGN KEY (TyreID) REFERENCES TyreM(Id)
);

CREATE TABLE IF NOT EXISTS SalesReturnRefund (
  RefundID INTEGER PRIMARY KEY AUTOINCREMENT,
  SalesReturnID INTEGER NOT NULL,
  CreditNoteID INTEGER,
  Method TEXT NOT NULL CHECK(Method IN ('CASH','BANK','STORE_CREDIT','ADJUST_BALANCE')),
  Amount REAL NOT NULL CHECK(Amount > 0),
  ReferenceNo TEXT,
  PaidBy INTEGER,
  RefundDate DATETIME DEFAULT (datetime('now','localtime')),
  Notes TEXT,
  FOREIGN KEY (SalesReturnID) REFERENCES SalesReturn(SalesReturnID),
  FOREIGN KEY (CreditNoteID) REFERENCES Invoice(InvoiceID)
);

CREATE TABLE IF NOT EXISTS WarrantyClaim (
  ClaimID INTEGER PRIMARY KEY AUTOINCREMENT,
  ClaimNo TEXT UNIQUE NOT NULL,
  SalesReturnID INTEGER NOT NULL,
  SalesReturnLineID INTEGER NOT NULL,
  SupplierID INTEGER,
  Status TEXT NOT NULL CHECK(Status IN ('SUBMITTED','APPROVED','REJECTED','SETTLED')) DEFAULT 'SUBMITTED',
  ClaimDate DATETIME DEFAULT (datetime('now','localtime')),
  SubmittedBy INTEGER,
  SupplierRefNo TEXT,
  SupplierCreditNoteNo TEXT,
  SettledDate DATETIME,
  SettledAmount REAL,
  Notes TEXT,
  FOREIGN KEY (SalesReturnID) REFERENCES SalesReturn(SalesReturnID),
  FOREIGN KEY (SalesReturnLineID) REFERENCES SalesReturnLine(SalesReturnLineID),
  FOREIGN KEY (SupplierID) REFERENCES SupplierM(SupplierID)
);
