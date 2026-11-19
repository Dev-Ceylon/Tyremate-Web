CREATE TABLE IF NOT EXISTS TyreM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Brand TEXT,
  Size TEXT,
  Pattern TEXT,
  LL_SR TEXT,
  PR TEXT,
  SideWall TEXT,
  DOT TEXT,
  PriceValidityFrom TEXT,
  PriceValidityTo TEXT,
  PurchasedPrice REAL,
  DAGCost REAL,
  DiscountOffered REAL,
  DiscountAmount REAL,
  MRP_WithoutVAT REAL,
  MRP_WithVAT REAL,
  ActualSellingPrice REAL
);

CREATE TABLE IF NOT EXISTS TyreExpiryReminder (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  StorageManagerBatchID INTEGER NOT NULL,
  TyreID INTEGER NOT NULL,
  LocationID INTEGER,
  ReminderID INTEGER NOT NULL,
  DOT TEXT,
  ExpiryDate TEXT,
  IsDone INTEGER NOT NULL DEFAULT 0,
  CreatedBy TEXT,
  createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (StorageManagerBatchID) REFERENCES StorageManagerBatch(Id) ON DELETE CASCADE,
  FOREIGN KEY (TyreID) REFERENCES TyreM(Id),
  FOREIGN KEY (LocationID) REFERENCES StorageLocationM(Id),
  FOREIGN KEY (ReminderID) REFERENCES Reminders(ID)
);

CREATE INDEX IF NOT EXISTS idx_tyre_expiry_reminder_batch ON TyreExpiryReminder (StorageManagerBatchID);
CREATE INDEX IF NOT EXISTS idx_tyre_expiry_reminder_reminder ON TyreExpiryReminder (ReminderID);
