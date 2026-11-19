const db = require("../database/connection")

exports.getWalkinCustomerForDag = (dagId) => {
  return db
    .prepare(`
      SELECT wc.ID, wc.CustomerName, wc.CustomerPhone, wc.CustomerAddress,
             wc.CustomerEmail, wc.VehicleNumber, wc.TinNo, wc.VatNo
      FROM DAGWalkinLink l
      INNER JOIN WalkinCustomer wc ON wc.ID = l.WalkinCustomerID
      WHERE l.DAGID = ?
    `)
    .get(dagId)
}

exports.linkDagToWalkinCustomer = (dagId, walkinCustomerId) => {
  return db
    .prepare(`
      INSERT OR REPLACE INTO DAGWalkinLink (DAGID, WalkinCustomerID)
      VALUES (?, ?)
    `)
    .run(dagId, walkinCustomerId)
}

exports.unlinkDagWalkin = (dagId) => {
  return db
    .prepare("DELETE FROM DAGWalkinLink WHERE DAGID = ?")
    .run(dagId)
}
