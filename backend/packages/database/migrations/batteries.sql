-- Migration: Battery Management System (mirrors Tyre architecture)
-- Adds BatteryM, BatterySupplier, BatteryStorageManager, BatteryStorageManagerBatch,
-- BatteryExpiryReminder, and Order Line tables (Inquiry, PO, SO).
-- Pre-seeds Lucas motorcycle batteries from official price lists.

-- ============================================================================
-- 1. MASTER TABLE: BatteryM (mirrors TyreM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS BatteryM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Brand TEXT NOT NULL,
  Model TEXT NOT NULL,
  Series TEXT,
  Voltage TEXT NOT NULL DEFAULT '12V',
  Capacity TEXT NOT NULL,
  Technology TEXT,
  Application TEXT NOT NULL DEFAULT 'Motorcycle',
  WarrantyMonths INTEGER NOT NULL DEFAULT 12,
  BatchCode TEXT,
  PriceValidityFrom TEXT,
  PriceValidityTo TEXT,
  PurchasedPrice REAL DEFAULT 0,
  DiscountOffered REAL DEFAULT 0,
  DiscountAmount REAL DEFAULT 0,
  MRP_WithoutVAT REAL DEFAULT 0,
  MRP_WithVAT REAL DEFAULT 0,
  ActualSellingPrice REAL DEFAULT 0,
  CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (Brand, Model)
);

CREATE INDEX IF NOT EXISTS idx_battery_m_brand ON BatteryM (Brand);
CREATE INDEX IF NOT EXISTS idx_battery_m_model ON BatteryM (Model);
CREATE INDEX IF NOT EXISTS idx_battery_m_capacity ON BatteryM (Capacity);

-- ============================================================================
-- 2. SUPPLIER LINK: BatterySupplier (mirrors TyreSupplier)
-- ============================================================================
CREATE TABLE IF NOT EXISTS BatterySupplier (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  BatteryId INTEGER NOT NULL,
  SupplierID INTEGER NOT NULL,
  Price REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (BatteryId) REFERENCES BatteryM(Id) ON DELETE CASCADE,
  FOREIGN KEY (SupplierID) REFERENCES SupplierM(SupplierID),
  UNIQUE (BatteryId, SupplierID)
);

CREATE INDEX IF NOT EXISTS idx_battery_supplier_battery ON BatterySupplier (BatteryId);
CREATE INDEX IF NOT EXISTS idx_battery_supplier_supplier ON BatterySupplier (SupplierID);

-- ============================================================================
-- 3. MASTER TABLE: BatteryLocationM (mirrors StorageLocationM & ConsumableLocationM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS BatteryLocationM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  LocationCode TEXT,
  LocationName TEXT,
  BranchId INTEGER,
  LocationTypeId INTEGER,
  Capacity INTEGER,
  FOREIGN KEY (BranchId) REFERENCES BranchM(Id),
  FOREIGN KEY (LocationTypeId) REFERENCES StorageLocationTypeM(Id)
);

CREATE INDEX IF NOT EXISTS idx_battery_location_branch ON BatteryLocationM (BranchId);
CREATE INDEX IF NOT EXISTS idx_battery_location_code ON BatteryLocationM (LocationCode);

-- ============================================================================
-- 4. INVENTORY & BATCH STORAGE: BatteryStorageManager (mirrors StorageManager)
-- ============================================================================
CREATE TABLE IF NOT EXISTS BatteryStorageManager (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  BatteryId INTEGER NOT NULL,
  LocationID INTEGER NOT NULL,
  Qty INTEGER NOT NULL DEFAULT 0 CHECK (Qty >= 0),
  OrderID INTEGER,
  SourceTypeId INTEGER,
  SourceId INTEGER,
  CreatedBy TEXT,
  createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (BatteryId) REFERENCES BatteryM(Id),
  FOREIGN KEY (SourceTypeId) REFERENCES StorageSourceM(Id)
);

CREATE INDEX IF NOT EXISTS idx_battery_storage_manager_location ON BatteryStorageManager (LocationID);
CREATE INDEX IF NOT EXISTS idx_battery_storage_manager_battery ON BatteryStorageManager (BatteryId);

CREATE TABLE IF NOT EXISTS BatteryStorageManagerBatch (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  BatteryStorageManagerID INTEGER NOT NULL,
  BatchCode TEXT,
  MfgDate TEXT,
  ExpiryDate TEXT,
  Qty INTEGER NOT NULL DEFAULT 0 CHECK (Qty >= 0),
  CreatedBy TEXT,
  createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (BatteryStorageManagerID) REFERENCES BatteryStorageManager(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_battery_storage_manager_batch_smid ON BatteryStorageManagerBatch (BatteryStorageManagerID);

-- ============================================================================
-- 4. EXPIRY & WARRANTY REMINDERS: BatteryExpiryReminder (mirrors TyreExpiryReminder)
-- ============================================================================
CREATE TABLE IF NOT EXISTS BatteryExpiryReminder (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  BatteryStorageManagerBatchID INTEGER,
  BatteryID INTEGER NOT NULL,
  LocationID INTEGER,
  ReminderID INTEGER NOT NULL,
  BatchCode TEXT,
  ExpiryDate TEXT,
  IsDone INTEGER NOT NULL DEFAULT 0,
  CreatedBy TEXT,
  createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (BatteryStorageManagerBatchID) REFERENCES BatteryStorageManagerBatch(Id) ON DELETE CASCADE,
  FOREIGN KEY (BatteryID) REFERENCES BatteryM(Id),
  FOREIGN KEY (ReminderID) REFERENCES Reminders(ID)
);

CREATE INDEX IF NOT EXISTS idx_battery_expiry_reminder_batch ON BatteryExpiryReminder (BatteryStorageManagerBatchID);
CREATE INDEX IF NOT EXISTS idx_battery_expiry_reminder_reminder ON BatteryExpiryReminder (ReminderID);

-- ============================================================================
-- 5. INQUIRIES: InquiryBatteries (mirrors InquiryTyres)
-- ============================================================================
CREATE TABLE IF NOT EXISTS InquiryBatteries (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  InquiryID INTEGER NOT NULL,
  BatteryID INTEGER NOT NULL,
  Price REAL NOT NULL DEFAULT 0,
  Discount REAL NOT NULL DEFAULT 0,
  Qty INTEGER NOT NULL DEFAULT 1,
  IsAdminApproved INTEGER NOT NULL DEFAULT 0 CHECK (IsAdminApproved IN (0, 1)),
  FOREIGN KEY (InquiryID) REFERENCES Inquiry(InquiryID),
  FOREIGN KEY (BatteryID) REFERENCES BatteryM(Id)
);

CREATE INDEX IF NOT EXISTS idx_inquiry_batteries_inquiry ON InquiryBatteries (InquiryID);
CREATE INDEX IF NOT EXISTS idx_inquiry_batteries_battery ON InquiryBatteries (BatteryID);

-- ============================================================================
-- 6. PURCHASE ORDERS: POBatteries & Allocations (mirrors POTyres)
-- ============================================================================
CREATE TABLE IF NOT EXISTS POBatteries (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  POID INTEGER NOT NULL,
  BatteryID INTEGER NOT NULL,
  Price REAL NOT NULL DEFAULT 0,
  Discount REAL NOT NULL DEFAULT 0,
  Qty INTEGER NOT NULL DEFAULT 1,
  IsAdminApproved INTEGER NOT NULL DEFAULT 0 CHECK (IsAdminApproved IN (0, 1)),
  StatusID INTEGER,
  FOREIGN KEY (POID) REFERENCES PO(ID),
  FOREIGN KEY (BatteryID) REFERENCES BatteryM(Id),
  FOREIGN KEY (StatusID) REFERENCES StatusM(Id),
  UNIQUE (POID, BatteryID)
);

CREATE TABLE IF NOT EXISTS PoBatterySuppliers (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  PoBatteriesID INTEGER NOT NULL,
  Qty INTEGER NOT NULL DEFAULT 1,
  SupplierID INTEGER NOT NULL,
  IsApproved INTEGER CHECK (IsApproved IN (0, 1)),
  ExpectedDeliveryDate DATE,
  ActualDeliveryDate DATE,
  FOREIGN KEY (PoBatteriesID) REFERENCES POBatteries(ID),
  FOREIGN KEY (SupplierID) REFERENCES SupplierM(SupplierID),
  UNIQUE (PoBatteriesID, SupplierID)
);

CREATE TABLE IF NOT EXISTS PoBatteryAllocations (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  POID INTEGER NOT NULL,
  PoBatteriesID INTEGER NOT NULL,
  LocationId INTEGER NOT NULL,
  FOREIGN KEY (POID) REFERENCES PO(ID),
  FOREIGN KEY (PoBatteriesID) REFERENCES POBatteries(ID),
  UNIQUE (POID, PoBatteriesID)
);

CREATE TABLE IF NOT EXISTS PoBatteryBatches (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  PoBatteriesID INTEGER NOT NULL,
  BatchCode TEXT,
  Qty INTEGER NOT NULL DEFAULT 0 CHECK (Qty >= 0),
  FOREIGN KEY (PoBatteriesID) REFERENCES POBatteries(ID)
);

-- ============================================================================
-- 7. SALES ORDERS: SoBatteries & Allocations (mirrors SoTyres)
-- ============================================================================
CREATE TABLE IF NOT EXISTS SoBatteries (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  SoID INTEGER NOT NULL,
  BatteryID INTEGER NOT NULL,
  Price REAL NOT NULL DEFAULT 0,
  Discount REAL NOT NULL DEFAULT 0,
  Qty INTEGER NOT NULL DEFAULT 1,
  NeedToOrderQty INTEGER NOT NULL DEFAULT 0,
  IsAdminApproved INTEGER NOT NULL DEFAULT 0 CHECK (IsAdminApproved IN (0, 1)),
  FOREIGN KEY (SoID) REFERENCES SO(SoID),
  FOREIGN KEY (BatteryID) REFERENCES BatteryM(Id)
);

CREATE TABLE IF NOT EXISTS SoBatteryStorageAllocation (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  SoBatteryID INTEGER NOT NULL,
  BatteryStorageManagerID INTEGER,
  BatteryStorageManagerBatchID INTEGER,
  Qty INTEGER NOT NULL CHECK (Qty > 0),
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (SoBatteryID) REFERENCES SoBatteries(ID),
  FOREIGN KEY (BatteryStorageManagerID) REFERENCES BatteryStorageManager(Id)
);

CREATE INDEX IF NOT EXISTS idx_so_battery_storage_allocation_batch
ON SoBatteryStorageAllocation (BatteryStorageManagerBatchID);

CREATE TABLE IF NOT EXISTS SoReturnBatteries (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  SoBatteryID INTEGER NOT NULL,
  Qty INTEGER NOT NULL,
  ReturnDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Reason TEXT,
  CreatedAt DATETIME DEFAULT (datetime('now', 'localtime')),
  SoBatteryStorageAllocationID INTEGER,
  BatteryStorageManagerID INTEGER,
  BatteryStorageManagerBatchID INTEGER,
  BatchCode TEXT,
  SalesReturnID INTEGER,
  StatusId INTEGER,
  FOREIGN KEY (SoBatteryID) REFERENCES SoBatteries(ID),
  FOREIGN KEY (SoBatteryStorageAllocationID) REFERENCES SoBatteryStorageAllocation(Id),
  FOREIGN KEY (SalesReturnID) REFERENCES SalesReturn(SalesReturnID),
  FOREIGN KEY (StatusId) REFERENCES SalesReturnStatusM(Id)
);
