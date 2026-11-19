const db = require("../database/connection");

exports.createPayment = () => {
  const info = db.prepare("INSERT INTO Payments DEFAULT VALUES").run();
  return { ID: Number(info.lastInsertRowid) };
};

exports.getPaymentById = (id) => {
  return db.prepare("SELECT * FROM Payments WHERE ID = ?").get(id);
};

exports.deletePaymentById = (id) => {
  return db.prepare("DELETE FROM Payments WHERE ID = ?").run(id);
};