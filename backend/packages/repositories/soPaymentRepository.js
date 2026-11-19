const db = require("../database/connection");

exports.createSOPayment = (data) => {
  const result = db.prepare(`
    INSERT INTO SOPayments (SoID, PaymentID)
    VALUES (?, ?)
  `).run(data.SoID, data.PaymentID);

  return {
    ID: result.lastInsertRowid,
    ...data
  };
};

exports.getSOPaymentsBySoId = (soId) => {
  return db.prepare(`
    SELECT * FROM SOPayments WHERE SoID = ?
  `).all(soId);
};

exports.getSOPaymentById = (id) => {
  return db.prepare(`
    SELECT * FROM SOPayments WHERE ID = ?
  `).get(id);
};

exports.deleteSOPaymentsBySoId = (soId) => {
  return db.prepare("DELETE FROM SOPayments WHERE SoID = ?").run(soId);
};