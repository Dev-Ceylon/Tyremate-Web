CREATE TABLE IF NOT EXISTS QuarantineStock (
  QuarantineID INTEGER PRIMARY KEY AUTOINCREMENT,
  SourceTypeId INTEGER NOT NULL,
  SourceId INTEGER NOT NULL,
  SourceLineId INTEGER,
  TyreID INTEGER NOT NULL,
  StorageManagerID INTEGER,
  StorageManagerBatchID INTEGER,
  SerialNo TEXT,
  Qty INTEGER NOT NULL CHECK(Qty > 0),
  UnitCost REAL DEFAULT 0,
  UnitPrice REAL DEFAULT 0,
  StatusId INTEGER NOT NULL,
  Reason TEXT,
  ReceivedBy INTEGER,
  ReceivedAt DATETIME DEFAULT (datetime('now','localtime')),
  ReleasedBy INTEGER,
  ReleasedAt DATETIME,
  ReleaseRef TEXT,
  Notes TEXT,
  FOREIGN KEY (SourceTypeId) REFERENCES QuarantineSourceM(Id),
  FOREIGN KEY (StatusId) REFERENCES QuarantineStatusM(Id),
  FOREIGN KEY (TyreID) REFERENCES TyreM(Id),
  FOREIGN KEY (StorageManagerID) REFERENCES StorageManager(Id),
  FOREIGN KEY (StorageManagerBatchID) REFERENCES StorageManagerBatch(Id)
);

CREATE INDEX IF NOT EXISTS idx_quarantine_source ON QuarantineStock (SourceTypeId, SourceId);
CREATE INDEX IF NOT EXISTS idx_quarantine_tyre ON QuarantineStock (TyreID);
CREATE INDEX IF NOT EXISTS idx_quarantine_status ON QuarantineStock (StatusId);

CREATE TABLE IF NOT EXISTS QuarantineMovement (
  MovementID INTEGER PRIMARY KEY AUTOINCREMENT,
  QuarantineID INTEGER NOT NULL,
  FromStatusId INTEGER,
  ToStatusId INTEGER,
  ActionId INTEGER NOT NULL,
  Qty INTEGER NOT NULL CHECK(Qty > 0),
  MovedBy INTEGER,
  MovedAt DATETIME DEFAULT (datetime('now','localtime')),
  Remarks TEXT,
  TargetStorageManagerID INTEGER,
  TargetStorageManagerBatchID INTEGER,
  FOREIGN KEY (QuarantineID) REFERENCES QuarantineStock(QuarantineID),
  FOREIGN KEY (FromStatusId) REFERENCES QuarantineStatusM(Id),
  FOREIGN KEY (ToStatusId) REFERENCES QuarantineStatusM(Id),
  FOREIGN KEY (ActionId) REFERENCES QuarantineMovementActionM(Id),
  FOREIGN KEY (TargetStorageManagerID) REFERENCES StorageManager(Id),
  FOREIGN KEY (TargetStorageManagerBatchID) REFERENCES StorageManagerBatch(Id)
);

CREATE INDEX IF NOT EXISTS idx_quarantinemove_qid ON QuarantineMovement (QuarantineID);
