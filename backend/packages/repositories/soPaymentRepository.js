const db = require("../database/connection");

const ensureSoPaymentColumns = () => {
  try {
    const columns = db.prepare("PRAGMA table_info(SOPayments)").all();
    const hasIsAdvance = columns.some((c) => c.name.toLowerCase() === "isadvance");
    if (!hasIsAdvance) {
      db.exec("ALTER TABLE SOPayments ADD COLUMN IsAdvance INTEGER NOT NULL DEFAULT 0");
    }
  } catch (err) {
    // ignore
  }
};

ensureSoPaymentColumns();

exports.createSOPayment = (data) => {
  const isAdvance = data.IsAdvance ? 1 : 0;
  const result = db.prepare(`
    INSERT INTO SOPayments (SoID, PaymentID, IsAdvance)
    VALUES (?, ?, ?)
  `).run(data.SoID, data.PaymentID, isAdvance);

  return {
    ID: result.lastInsertRowid,
    ...data,
    IsAdvance: isAdvance
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