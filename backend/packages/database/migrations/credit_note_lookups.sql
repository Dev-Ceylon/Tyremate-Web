-- Credit Note Lookup Tables
-- Run after core tables, before credit_note_tables.sql

-- Credit Note Status
CREATE TABLE IF NOT EXISTS CreditNoteStatusM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  StatusCode TEXT NOT NULL UNIQUE,
  StatusName TEXT NOT NULL,
  SortOrder INTEGER NOT NULL DEFAULT 0,
  IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1))
);

-- Credit Note Reason
CREATE TABLE IF NOT EXISTS CreditNoteReasonM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  ReasonCode TEXT NOT NULL UNIQUE,
  ReasonName TEXT NOT NULL,
  SortOrder INTEGER NOT NULL DEFAULT 0,
  IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1))
);

-- Credit Note Source
CREATE TABLE IF NOT EXISTS CreditNoteSourceM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  SourceCode TEXT NOT NULL UNIQUE,
  SourceName TEXT NOT NULL,
  SortOrder INTEGER NOT NULL DEFAULT 0,
  IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1))
);

-- Refund Method
CREATE TABLE IF NOT EXISTS RefundMethodM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  MethodCode TEXT NOT NULL UNIQUE,
  MethodName TEXT NOT NULL,
  SortOrder INTEGER NOT NULL DEFAULT 0,
  IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1))
);

-- Credit Transaction Type
CREATE TABLE IF NOT EXISTS CreditTransactionTypeM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  TypeCode TEXT NOT NULL UNIQUE,
  TypeName TEXT NOT NULL,
  SortOrder INTEGER NOT NULL DEFAULT 0,
  IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1))
);

-- Refund Status
CREATE TABLE IF NOT EXISTS RefundStatusM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  StatusCode TEXT NOT NULL UNIQUE,
  StatusName TEXT NOT NULL,
  SortOrder INTEGER NOT NULL DEFAULT 0,
  IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_note_status_active ON CreditNoteStatusM (IsActive);
CREATE INDEX IF NOT EXISTS idx_credit_note_reason_active ON CreditNoteReasonM (IsActive);
CREATE INDEX IF NOT EXISTS idx_credit_note_source_active ON CreditNoteSourceM (IsActive);
CREATE INDEX IF NOT EXISTS idx_refund_method_active ON RefundMethodM (IsActive);
CREATE INDEX IF NOT EXISTS idx_credit_transaction_type_active ON CreditTransactionTypeM (IsActive);
CREATE INDEX IF NOT EXISTS idx_refund_status_active ON RefundStatusM (IsActive);