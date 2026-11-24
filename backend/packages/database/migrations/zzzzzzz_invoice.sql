-- Invoicing: a formal, customer-facing sales document generated from a Sales
-- Order (source 'so'), an Other Service (source 'other_service'), or a
-- direct/counter sale (source 'direct'). Customer details and line amounts are
-- snapshotted onto the invoice so an issued invoice never changes when its
-- source is later edited. Credit notes are ordinary Invoice rows flagged with
-- IsCreditNote = 1 and CreditNoteOf pointing at the original invoice.
--
-- Status and source are lookup tables (InvoiceStatusM / InvoiceSourceM, seeded
-- from packages/constants/invoiceConstants.js) and the Invoice row stores the
-- resolved Id, mirroring the StatusM / StorageSourceM pattern.
CREATE TABLE IF NOT EXISTS InvoiceStatusM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  StatusCode TEXT NOT NULL UNIQUE,
  StatusName TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS InvoiceSourceM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  SourceCode TEXT NOT NULL UNIQUE,
  SourceName TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Invoice (
  InvoiceID INTEGER PRIMARY KEY AUTOINCREMENT,
  InvoiceNumber TEXT UNIQUE,
  InvoiceDate TEXT NOT NULL,
  DueDate TEXT,
  CreatedDateTime DATETIME DEFAULT (datetime('now', 'localtime')),
  SourceTypeId INTEGER NOT NULL,
  SourceID INTEGER,
  CustomerID INTEGER,
  WalkinCustomerID INTEGER,
  CustomerName TEXT,
  CustomerAddress TEXT,
  CustomerPhone TEXT,
  CustomerVatNo TEXT,
  Subtotal REAL NOT NULL DEFAULT 0,
  DiscountTotal REAL NOT NULL DEFAULT 0,
  TaxLabel TEXT,
  TaxAmount REAL NOT NULL DEFAULT 0,
  Total REAL NOT NULL DEFAULT 0,
  AmountPaid REAL NOT NULL DEFAULT 0,
  BalanceDue REAL NOT NULL DEFAULT 0,
  StatusId INTEGER NOT NULL,
  IsCreditNote INTEGER NOT NULL DEFAULT 0 CHECK (IsCreditNote IN (0, 1)),
  CreditNoteOf INTEGER,
  Notes TEXT,
  VoidReason TEXT,
  CreatedBy INTEGER,
  FOREIGN KEY (SourceTypeId) REFERENCES InvoiceSourceM(Id),
  FOREIGN KEY (StatusId) REFERENCES InvoiceStatusM(Id),
  FOREIGN KEY (CustomerID) REFERENCES CustomerM(CustomerID),
  FOREIGN KEY (WalkinCustomerID) REFERENCES WalkinCustomer(ID),
  FOREIGN KEY (CreditNoteOf) REFERENCES Invoice(InvoiceID)
);

CREATE INDEX IF NOT EXISTS idx_invoice_source ON Invoice (SourceTypeId, SourceID);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON Invoice (StatusId, InvoiceDate DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_customer ON Invoice (CustomerID);

-- One row per sold item. LineType distinguishes tyre lines (with a serial) from
-- service/consumable/other lines so a single invoice shape covers every source.
CREATE TABLE IF NOT EXISTS InvoiceLine (
  InvoiceLineID INTEGER PRIMARY KEY AUTOINCREMENT,
  InvoiceID INTEGER NOT NULL,
  LineType TEXT NOT NULL CHECK (LineType IN ('tyre', 'battery', 'service', 'consumable', 'other')),
  TyreID INTEGER,
  BatteryID INTEGER,
  SerialNo TEXT,
  Description TEXT,
  Size TEXT,
  Pattern TEXT,
  Brand TEXT,
  Model TEXT,
  Capacity TEXT,
  Voltage TEXT,
  Qty REAL NOT NULL DEFAULT 0,
  UnitPrice REAL NOT NULL DEFAULT 0,
  Discount REAL NOT NULL DEFAULT 0,
  LineTotal REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (InvoiceID) REFERENCES Invoice(InvoiceID) ON DELETE CASCADE,
  FOREIGN KEY (TyreID) REFERENCES TyreM(Id),
  FOREIGN KEY (BatteryID) REFERENCES BatteryM(Id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_invoice ON InvoiceLine (InvoiceID);

-- Ties an existing Payments row to the invoice it settles, mirroring SOPayments /
-- DAGPayments so the money trail is shared rather than duplicated.
CREATE TABLE IF NOT EXISTS InvoicePaymentLink (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  InvoiceID INTEGER NOT NULL,
  PaymentID INTEGER NOT NULL,
  AmountApplied REAL NOT NULL DEFAULT 0,
  CreatedDateTime DATETIME DEFAULT (datetime('now', 'localtime')),
  UNIQUE (InvoiceID, PaymentID),
  FOREIGN KEY (InvoiceID) REFERENCES Invoice(InvoiceID) ON DELETE CASCADE,
  FOREIGN KEY (PaymentID) REFERENCES Payments(ID)
);

CREATE INDEX IF NOT EXISTS idx_invoice_payment_link_invoice ON InvoicePaymentLink (InvoiceID);

-- Per-year counter behind InvoiceNumber (INV-2026-00001). One row per calendar
-- year, incremented inside the invoice-creation transaction.
CREATE TABLE IF NOT EXISTS InvoiceCounter (
  Year INTEGER PRIMARY KEY,
  LastNumber INTEGER NOT NULL DEFAULT 0
);
