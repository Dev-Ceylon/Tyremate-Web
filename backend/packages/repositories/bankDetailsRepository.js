const db = require("../database/connection");

exports.getAllBankDetails = () => {
  return db.prepare("SELECT * FROM Bankdetails").all();
};

exports.getBankDetailsById = (id) => {
  return db.prepare("SELECT * FROM Bankdetails WHERE ID = ?").get(id);
};

exports.createBankDetails = (data) => {
  const result = db.prepare(`
    INSERT INTO Bankdetails (BankName, AccountNumber, AccountName, Branch)
    VALUES (?, ?, ?, ?)
  `).run(data.BankName, data.AccountNumber, data.AccountName, data.Branch);

  return {
    ID: result.lastInsertRowid,
    ...data
  };
};

exports.updateBankDetails = (id, data) => {
  return db.prepare(`
    UPDATE Bankdetails
    SET BankName = ?, AccountNumber = ?, AccountName = ?, Branch = ?
    WHERE ID = ?
  `).run(data.BankName, data.AccountNumber, data.AccountName, data.Branch, id);
};

exports.deleteBankDetails = (id) => {
  return db.prepare("DELETE FROM Bankdetails WHERE ID = ?").run(id);
};