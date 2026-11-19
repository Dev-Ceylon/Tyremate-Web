const db = require("../database/connection")

exports.createDAGPayment = (data) => {
  const result = db.prepare(`
    INSERT INTO DAGPayments (DAGID, PaymentID)
    VALUES (?, ?)
  `).run(data.DAGID, data.PaymentID)

  return {
    ID: result.lastInsertRowid,
    ...data,
  }
}

exports.getDAGPaymentsByDAGId = (dagId) => {
  return db.prepare(`
    SELECT * FROM DAGPayments WHERE DAGID = ?
  `).all(dagId)
}

exports.deleteDAGPaymentsByDAGId = (dagId) => {
  return db.prepare("DELETE FROM DAGPayments WHERE DAGID = ?").run(dagId)
}
