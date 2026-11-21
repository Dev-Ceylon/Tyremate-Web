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
