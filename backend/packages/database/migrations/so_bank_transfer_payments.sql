CREATE TABLE IF NOT EXISTS BankTransferPayments (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  PaymentID INTEGER NOT NULL,
  BankDetailsID INTEGER NOT NULL,
  Amount REAL NOT NULL,
  ReceiptPath TEXT,
  ReceiptEncIV TEXT,
  ReceiptEncAuthTag TEXT,
  ReceiptEncKey TEXT,
  FOREIGN KEY (PaymentID) REFERENCES Payments(ID),
  FOREIGN KEY (BankDetailsID) REFERENCES Bankdetails(ID)
);