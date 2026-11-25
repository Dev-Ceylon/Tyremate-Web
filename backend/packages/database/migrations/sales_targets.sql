-- Sales Targets: allows administrators to assign daily, weekly, monthly,
-- and annual sales targets to sales representatives, tracking revenue goals,
-- unit quantities, and product category specifics.
CREATE TABLE IF NOT EXISTS SalesTargets (
  TargetID INTEGER PRIMARY KEY AUTOINCREMENT,
  SalesRepID INTEGER NOT NULL,
  PeriodType TEXT NOT NULL CHECK (PeriodType IN ('daily', 'weekly', 'monthly', 'annually')),
  StartDate TEXT NOT NULL,
  EndDate TEXT NOT NULL,
  TargetAmount REAL NOT NULL DEFAULT 0,
  TargetQty INTEGER NOT NULL DEFAULT 0,
  Category TEXT NOT NULL DEFAULT 'all' CHECK (Category IN ('all', 'tyre', 'battery')),
  Notes TEXT,
  CreatedBy INTEGER,
  CreatedAt DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
  UpdatedAt DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (SalesRepID) REFERENCES users(id),
  FOREIGN KEY (CreatedBy) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_targets_rep ON SalesTargets (SalesRepID, PeriodType, StartDate);
CREATE INDEX IF NOT EXISTS idx_sales_targets_period ON SalesTargets (PeriodType, StartDate, EndDate);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_targets_rep_period ON SalesTargets (SalesRepID, PeriodType, StartDate, Category);
