CREATE TABLE IF NOT EXISTS CashPayments (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  PaymentID INTEGER NOT NULL,
  AmountReceived REAL NOT NULL,
  BalanceToReturn REAL NOT NULL,
  ReceiptPath TEXT,
  ReceiptEncIV TEXT,
  ReceiptEncAuthTag TEXT,
  ReceiptEncKey TEXT,
  FOREIGN KEY (PaymentID) REFERENCES Payments(ID)
);