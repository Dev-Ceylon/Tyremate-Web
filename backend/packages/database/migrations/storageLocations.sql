CREATE TABLE IF NOT EXISTS StorageLocationM (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  LocationCode TEXT,
  LocationName TEXT,
  BranchId INTEGER,
  LocationTypeId INTEGER,
  Capacity INTEGER,
  FOREIGN KEY (BranchId) REFERENCES BranchM(Id),
  FOREIGN KEY (LocationTypeId) REFERENCES StorageLocationTypeM(Id)
);
