const db = require("../database/connection")

exports.getWalkinCustomerForSo = (soId) => {
  return db
    .prepare(`
      SELECT wc.ID, wc.CustomerName, wc.CustomerPhone, wc.CustomerAddress,
             wc.CustomerEmail, wc.VehicleNumber, wc.TinNo, wc.VatNo
      FROM SOWalkinLink l
      INNER JOIN WalkinCustomer wc ON wc.ID = l.WalkinCustomerID
      WHERE l.SoID = ?
    `)
    .get(soId)
}

exports.linkSoToWalkinCustomer = (soId, walkinCustomerId) => {
  return db
    .prepare(`
      INSERT OR REPLACE INTO SOWalkinLink (SoID, WalkinCustomerID)
      VALUES (?, ?)
    `)
    .run(soId, walkinCustomerId)
}

exports.unlinkSoWalkin = (soId) => {
  return db
    .prepare("DELETE FROM SOWalkinLink WHERE SoID = ?")
    .run(soId)
}
