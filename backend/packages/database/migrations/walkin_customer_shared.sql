-- Shared walk-in customer master table
CREATE TABLE IF NOT EXISTS WalkinCustomer (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerName TEXT NOT NULL,
  CustomerPhone TEXT NOT NULL,
  CustomerAddress TEXT NOT NULL,
  CustomerEmail TEXT,
  VehicleNumber TEXT,
  TinNo TEXT,
  VatNo TEXT,
  CreatedAt DATETIME DEFAULT (datetime('now', 'localtime')),
  UpdatedAt DATETIME DEFAULT (datetime('now', 'localtime'))
);

-- Link Inquiry -> WalkinCustomer (1:1)
CREATE TABLE IF NOT EXISTS InquiryWalkinLink (
  InquiryID INTEGER NOT NULL UNIQUE,
  WalkinCustomerID INTEGER NOT NULL,
  PRIMARY KEY (InquiryID, WalkinCustomerID),
  FOREIGN KEY (InquiryID) REFERENCES Inquiry(InquiryID) ON DELETE CASCADE,
  FOREIGN KEY (WalkinCustomerID) REFERENCES WalkinCustomer(ID) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_inquiry_walkin_link_wc ON InquiryWalkinLink(WalkinCustomerID);

-- Link SO -> WalkinCustomer (1:1)
CREATE TABLE IF NOT EXISTS SOWalkinLink (
  SoID INTEGER NOT NULL UNIQUE,
  WalkinCustomerID INTEGER NOT NULL,
  PRIMARY KEY (SoID, WalkinCustomerID),
  FOREIGN KEY (SoID) REFERENCES SO(SoID) ON DELETE CASCADE,
  FOREIGN KEY (WalkinCustomerID) REFERENCES WalkinCustomer(ID) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_so_walkin_link_wc ON SOWalkinLink(WalkinCustomerID);


