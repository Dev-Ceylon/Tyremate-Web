-- Sales-order deliveries: a hand-over event where the customer physically
-- collects some (or all) of the tyres already reserved for their order. The SO
-- line keeps the full commitment (SoTyres.Qty); how much has actually changed
-- hands is derived from SODeliveryLine, never stored, so the "remaining to
-- collect" figure cannot drift (same principle as DAG takes).
--
-- Stock is already removed from the sellable pool when the SO reserves it
-- (SoTyreStorageAllocation is created and StorageManager is decremented at SO
-- creation), so a delivery records the event and consumes the reservation - it
-- does not move stock again.
--
-- Gate pass: recording a delivery never moves goods out of the warehouse by
-- itself. GatePassNo is the gate pass document number and is NULL until the
-- pass is issued; the pass is normally issued once settled payments cover the
-- cumulative value of the deliveries handed over up to and including this one.
-- An authorized user may explicitly override a shortfall; the issuer,
-- timestamp, override flag, and shortfall are retained for monitoring.
-- Eligibility itself is derived from payments on read, never stored, so it
-- cannot drift.
CREATE TABLE IF NOT EXISTS SODelivery (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  SoID INTEGER NOT NULL,
  DeliveryDate TEXT NOT NULL,
  DeliveredBy INTEGER,
  Notes TEXT,
  GatePassNo TEXT,
  GatePassIssuedAt DATETIME,
  GatePassIssuedBy INTEGER,
  GatePassPaymentOverride INTEGER NOT NULL DEFAULT 0,
  GatePassPaymentOverrideShortfall REAL NOT NULL DEFAULT 0,
  CreatedDateTime DATETIME DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (SoID) REFERENCES SO(SoID)
);

-- One row per reserved allocation handed over. SoTyreStorageAllocationID pins
-- the exact reservation consumed, so "remaining collectable" per reservation is
-- derived as allocation.Qty minus the delivered quantities for that allocation.
CREATE TABLE IF NOT EXISTS SODeliveryLine (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  SODeliveryID INTEGER NOT NULL,
  SoTyreID INTEGER,
  TyreID INTEGER,
  SoTyreStorageAllocationID INTEGER,
  StorageManagerID INTEGER,
  StorageManagerBatchID INTEGER,
  SoBatteryID INTEGER,
  BatteryID INTEGER,
  SoBatteryStorageAllocationID INTEGER,
  BatteryStorageManagerID INTEGER,
  BatteryStorageManagerBatchID INTEGER,
  Qty INTEGER NOT NULL CHECK (Qty > 0),
  Amount REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (SODeliveryID) REFERENCES SODelivery(ID) ON DELETE CASCADE,
  FOREIGN KEY (SoTyreID) REFERENCES SoTyres(ID),
  FOREIGN KEY (TyreID) REFERENCES TyreM(Id),
  FOREIGN KEY (SoTyreStorageAllocationID) REFERENCES SoTyreStorageAllocation(Id),
  FOREIGN KEY (StorageManagerID) REFERENCES StorageManager(Id),
  FOREIGN KEY (SoBatteryID) REFERENCES SoBatteries(ID),
  FOREIGN KEY (BatteryID) REFERENCES BatteryM(Id),
  FOREIGN KEY (SoBatteryStorageAllocationID) REFERENCES SoBatteryStorageAllocation(Id),
  FOREIGN KEY (BatteryStorageManagerID) REFERENCES BatteryStorageManager(Id)
);

CREATE INDEX IF NOT EXISTS idx_so_delivery_so
  ON SODelivery (SoID, ID DESC);

-- The gate-pass screens filter on "has a pass" vs "still withheld", so the
-- number needs its own index rather than a full scan of SODelivery.
CREATE INDEX IF NOT EXISTS idx_so_delivery_gate_pass
  ON SODelivery (GatePassNo);

CREATE INDEX IF NOT EXISTS idx_so_delivery_line_delivery
  ON SODeliveryLine (SODeliveryID);

CREATE INDEX IF NOT EXISTS idx_so_delivery_line_sotyre
  ON SODeliveryLine (SoTyreID);
