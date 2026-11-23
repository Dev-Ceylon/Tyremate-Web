const db = require("../database/connection")

exports.linkInquiryToSo = ({ InquiryID, SOID, CreatedBy }) => {
  return db
    .prepare(`
      INSERT OR IGNORE INTO InquirySO (InquiryID, SOID, CreatedBy)
      VALUES (?, ?, ?)
    `)
    .run(InquiryID, SOID, CreatedBy ?? null)
}

exports.unlinkInquiryFromSo = (inquiryId, soId) => {
  return db
    .prepare("DELETE FROM InquirySO WHERE InquiryID = ? AND SOID = ?")
    .run(inquiryId, soId)
}

exports.getLink = (inquiryId, soId) => {
  return db
    .prepare("SELECT * FROM InquirySO WHERE InquiryID = ? AND SOID = ?")
    .get(inquiryId, soId)
}

exports.getLinkedSosByInquiryId = (inquiryId) => {
  return db
    .prepare(`
      SELECT
        iso.SOID AS SoID,
        iso.createdDate AS LinkedDate,
        s.Date,
        COALESCE(s.Category, 'tyre') AS Category,
        s.CreatedDateTime,
        s.IsAdminApproved,
        s.IsCompleted,
        s.IsPaymentCompleted,
        COALESCE(c.Name, swc.CustomerName) AS CustomerName,
        c.CustomerCode,
        CASE WHEN LOWER(COALESCE(s.Category, 'tyre')) = 'battery'
          THEN COALESCE((SELECT SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)) FROM SoBatteries sb WHERE sb.SoID = s.SoID), 0)
          ELSE COALESCE((SELECT SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)) FROM SoTyres st WHERE st.SoID = s.SoID), 0)
        END AS TotalSale,
        CASE WHEN LOWER(COALESCE(s.Category, 'tyre')) = 'battery'
          THEN COALESCE((SELECT SUM(sb.Price * sb.Qty * (COALESCE(sb.Discount, 0) / 100.0)) FROM SoBatteries sb WHERE sb.SoID = s.SoID), 0)
          ELSE COALESCE((SELECT SUM(st.Price * st.Qty * (COALESCE(st.Discount, 0) / 100.0)) FROM SoTyres st WHERE st.SoID = s.SoID), 0)
        END AS TotalDiscount
      FROM InquirySO iso
      INNER JOIN SO s ON s.SoID = iso.SOID
      LEFT JOIN SoCustomer sc ON sc.SoID = s.SoID
      LEFT JOIN CustomerM c ON c.CustomerID = sc.CustomerID
      LEFT JOIN SOWalkinLink swl ON swl.SoID = s.SoID
      LEFT JOIN WalkinCustomer swc ON swc.ID = swl.WalkinCustomerID
      WHERE iso.InquiryID = ?
      GROUP BY s.SoID
      ORDER BY iso.ID DESC
    `)
    .all(inquiryId)
}

exports.getLinkedInquiriesBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        iso.InquiryID,
        iso.createdDate AS LinkedDate,
        i.Date,
        i.CustomerID,
        i.IsAdminApproved,
        i.ConvertedSOID,
        COALESCE(c.Name, wc.CustomerName) AS CustomerName,
        CASE WHEN wcl.InquiryID IS NOT NULL THEN 1 ELSE 0 END AS IsWalkinCustomer
      FROM InquirySO iso
      INNER JOIN Inquiry i ON i.InquiryID = iso.InquiryID
      LEFT JOIN CustomerM c ON c.CustomerID = i.CustomerID
      LEFT JOIN InquiryWalkinLink wcl ON wcl.InquiryID = i.InquiryID
      LEFT JOIN WalkinCustomer wc ON wc.ID = wcl.WalkinCustomerID
      WHERE iso.SOID = ?
      ORDER BY iso.ID DESC
    `)
    .all(soId)
}

exports.getAllLinks = () => {
  return db.prepare("SELECT * FROM InquirySO ORDER BY ID DESC").all()
}
