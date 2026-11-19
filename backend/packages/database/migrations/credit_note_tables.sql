-- Credit Note Tables
-- Run after credit_note_lookups.sql

-- Credit Note Header
CREATE TABLE IF NOT EXISTS CreditNoteM (
  CreditNoteID INTEGER PRIMARY KEY AUTOINCREMENT,
  CreditNoteNo TEXT NOT NULL UNIQUE,
  InvoiceID INTEGER NOT NULL,
  SalesReturnID INTEGER,
  CustomerID INTEGER,
  SourceTypeId INTEGER NOT NULL,
  ReasonId INTEGER NOT NULL,
  StatusId INTEGER NOT NULL DEFAULT 1,
  SubTotal REAL NOT NULL DEFAULT 0,
  TaxAmount REAL NOT NULL DEFAULT 0,
  TotalAmount REAL NOT NULL DEFAULT 0,
  CurrencyCode TEXT NOT NULL DEFAULT 'LKR',
  ExchangeRate REAL NOT NULL DEFAULT 1,
  Notes TEXT,
  RequestedBy INTEGER,
  ApprovedBy INTEGER,
  ApprovedDate DATETIME,
  CancelledBy INTEGER,
  CancelledDate DATETIME,
  CancellationReason TEXT,
  CreatedAt DATETIME DEFAULT (datetime('now','localtime')),
  UpdatedAt DATETIME DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (InvoiceID) REFERENCES Invoice(InvoiceID),
  FOREIGN KEY (SalesReturnID) REFERENCES SalesReturn(SalesReturnID),
  FOREIGN KEY (CustomerID) REFERENCES CustomerM(CustomerID),
  FOREIGN KEY (SourceTypeId) REFERENCES CreditNoteSourceM(Id),
  FOREIGN KEY (ReasonId) REFERENCES CreditNoteReasonM(Id),
  FOREIGN KEY (StatusId) REFERENCES CreditNoteStatusM(Id),
  FOREIGN KEY (RequestedBy) REFERENCES users(id),
  FOREIGN KEY (ApprovedBy) REFERENCES users(id),
  FOREIGN KEY (CancelledBy) REFERENCES users(id)
);

-- Credit Note Lines
CREATE TABLE IF NOT EXISTS CreditNoteLineM (
  CreditNoteLineID INTEGER PRIMARY KEY AUTOINCREMENT,
  CreditNoteID INTEGER NOT NULL,
  TyreID INTEGER,
  Description TEXT NOT NULL,
  Qty INTEGER NOT NULL DEFAULT 1,
  UnitPrice REAL NOT NULL DEFAULT 0,
  Discount REAL NOT NULL DEFAULT 0,
  TaxRate REAL NOT NULL DEFAULT 0,
  TaxAmount REAL NOT NULL DEFAULT 0,
  LineAmount REAL NOT NULL DEFAULT 0,
  TyreSerialNo TEXT,
  AllocationId INTEGER,
  FOREIGN KEY (CreditNoteID) REFERENCES CreditNoteM(CreditNoteID) ON DELETE CASCADE,
  FOREIGN KEY (TyreID) REFERENCES TyreM(Id),
  FOREIGN KEY (AllocationId) REFERENCES SoTyreStorageAllocation(Id)
);

-- Refund
CREATE TABLE IF NOT EXISTS RefundM (
  RefundID INTEGER PRIMARY KEY AUTOINCREMENT,
  RefundNo TEXT NOT NULL UNIQUE,
  CreditNoteID INTEGER NOT NULL,
  SalesReturnID INTEGER,
  CustomerID INTEGER,
  Amount REAL NOT NULL,
  MethodId INTEGER NOT NULL,
  ReferenceNo TEXT,
  StatusId INTEGER NOT NULL DEFAULT 1,
  ProcessedBy INTEGER,
  ProcessedDate DATETIME,
  BankAccountId INTEGER,
  ChequeNo TEXT,
  ChequeDate TEXT,
  Notes TEXT,
  CreatedAt DATETIME DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (CreditNoteID) REFERENCES CreditNoteM(CreditNoteID),
  FOREIGN KEY (SalesReturnID) REFERENCES SalesReturn(SalesReturnID),
  FOREIGN KEY (CustomerID) REFERENCES CustomerM(CustomerID),
  FOREIGN KEY (MethodId) REFERENCES RefundMethodM(Id),
  FOREIGN KEY (StatusId) REFERENCES RefundStatusM(Id),
  FOREIGN KEY (ProcessedBy) REFERENCES users(id),
  FOREIGN KEY (BankAccountId) REFERENCES Bankdetails(Id)
);

-- Customer Credit Balance
CREATE TABLE IF NOT EXISTS CustomerCreditM (
  CreditID INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerID INTEGER NOT NULL UNIQUE,
  AvailableAmount REAL NOT NULL DEFAULT 0,
  TotalIssued REAL NOT NULL DEFAULT 0,
  TotalUsed REAL NOT NULL DEFAULT 0,
  LastUpdated DATETIME DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (CustomerID) REFERENCES CustomerM(CustomerID)
);

-- Customer Credit Transaction (audit trail)
CREATE TABLE IF NOT EXISTS CustomerCreditTransactionM (
  TransactionID INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerID INTEGER NOT NULL,
  CreditNoteID INTEGER,
  RefundID INTEGER,
  TypeId INTEGER NOT NULL,
  Amount REAL NOT NULL,
  BalanceAfter REAL NOT NULL,
  Reference TEXT,
  CreatedBy INTEGER,
  CreatedAt DATETIME DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (CustomerID) REFERENCES CustomerM(CustomerID),
  FOREIGN KEY (CreditNoteID) REFERENCES CreditNoteM(CreditNoteID),
  FOREIGN KEY (RefundID) REFERENCES RefundM(RefundID),
  FOREIGN KEY (TypeId) REFERENCES CreditTransactionTypeM(Id),
  FOREIGN KEY (CreatedBy) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_note_invoice ON CreditNoteM (InvoiceID);
CREATE INDEX IF NOT EXISTS idx_credit_note_sales_return ON CreditNoteM (SalesReturnID);
CREATE INDEX IF NOT EXISTS idx_credit_note_customer ON CreditNoteM (CustomerID);
CREATE INDEX IF NOT EXISTS idx_credit_note_status ON CreditNoteM (StatusId);
CREATE INDEX IF NOT EXISTS idx_credit_note_no ON CreditNoteM (CreditNoteNo);
CREATE INDEX IF NOT EXISTS idx_credit_note_created ON CreditNoteM (CreatedAt);

CREATE INDEX IF NOT EXISTS idx_credit_note_line_cn ON CreditNoteLineM (CreditNoteID);
CREATE INDEX IF NOT EXISTS idx_credit_note_line_tyre ON CreditNoteLineM (TyreID);
CREATE INDEX IF NOT EXISTS idx_credit_note_line_allocation ON CreditNoteLineM (AllocationId);

CREATE INDEX IF NOT EXISTS idx_refund_credit_note ON RefundM (CreditNoteID);
CREATE INDEX IF NOT EXISTS idx_refund_sales_return ON RefundM (SalesReturnID);
CREATE INDEX IF NOT EXISTS idx_refund_customer ON RefundM (CustomerID);
CREATE INDEX IF NOT EXISTS idx_refund_status ON RefundM (StatusId);
CREATE INDEX IF NOT EXISTS idx_refund_no ON RefundM (RefundNo);

CREATE INDEX IF NOT EXISTS idx_customer_credit_customer ON CustomerCreditM (CustomerID);

CREATE INDEX IF NOT EXISTS idx_credit_trans_customer ON CustomerCreditTransactionM (CustomerID);
CREATE INDEX IF NOT EXISTS idx_credit_trans_credit_note ON CustomerCreditTransactionM (CreditNoteID);
CREATE INDEX IF NOT EXISTS idx_credit_trans_refund ON CustomerCreditTransactionM (RefundID);
CREATE INDEX IF NOT EXISTS idx_credit_trans_type ON CustomerCreditTransactionM (TypeId);
