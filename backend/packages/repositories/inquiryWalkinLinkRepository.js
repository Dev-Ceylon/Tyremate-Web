const db = require("../database/connection")

exports.getWalkinCustomerForInquiry = (inquiryId) => {
  return db
    .prepare(`
      SELECT wc.ID, wc.CustomerName, wc.CustomerPhone, wc.CustomerAddress,
             wc.CustomerEmail, wc.VehicleNumber, wc.TinNo, wc.VatNo
      FROM InquiryWalkinLink l
      INNER JOIN WalkinCustomer wc ON wc.ID = l.WalkinCustomerID
      WHERE l.InquiryID = ?
    `)
    .get(inquiryId)
}

exports.linkInquiryToWalkinCustomer = (inquiryId, walkinCustomerId) => {
  return db
    .prepare(`
      INSERT OR REPLACE INTO InquiryWalkinLink (InquiryID, WalkinCustomerID)
      VALUES (?, ?)
    `)
    .run(inquiryId, walkinCustomerId)
}

exports.unlinkInquiryWalkin = (inquiryId) => {
  return db
    .prepare("DELETE FROM InquiryWalkinLink WHERE InquiryID = ?")
    .run(inquiryId)
}
