const db = require("../database/connection")

exports.linkInquiryToPo = ({ InquiryID, POID, CreatedBy }) => {
  return db
    .prepare(`
      INSERT OR IGNORE INTO InquiryPO (InquiryID, POID, CreatedBy)
      VALUES (?, ?, ?)
    `)
    .run(InquiryID, POID, CreatedBy ?? null)
}

exports.unlinkInquiryFromPo = (inquiryId, poId) => {
  return db
    .prepare("DELETE FROM InquiryPO WHERE InquiryID = ? AND POID = ?")
    .run(inquiryId, poId)
}

exports.getLink = (inquiryId, poId) => {
  return db
    .prepare("SELECT * FROM InquiryPO WHERE InquiryID = ? AND POID = ?")
    .get(inquiryId, poId)
}

exports.getLinkedPosByInquiryId = (inquiryId) => {
  return db
    .prepare(`
      SELECT
        ip.POID AS ID,
        ip.createdDate AS LinkedDate,
        p.Date,
        p.SoID,
        p.StatusID,
        s.StatusCode,
        s.StatusName,
        p.IsAdminApproved,
        p.IsSupplierApproved,
        (SELECT COUNT(*) FROM POTyres pt WHERE pt.POID = p.ID) AS LineCount
      FROM InquiryPO ip
      INNER JOIN PO p ON p.ID = ip.POID
      LEFT JOIN StatusM s ON s.Id = p.StatusID
      WHERE ip.InquiryID = ?
      ORDER BY ip.ID DESC
    `)
    .all(inquiryId)
}

exports.getLinkedInquiriesByPoId = (poId) => {
  return db
    .prepare(`
      SELECT
        ip.InquiryID,
        ip.createdDate AS LinkedDate,
        i.Date,
        i.CustomerID,
        i.IsAdminApproved,
        i.ConvertedSOID,
        COALESCE(c.Name, wc.CustomerName) AS CustomerName,
        CASE WHEN wc.ID IS NOT NULL THEN 1 ELSE 0 END AS IsWalkinCustomer
      FROM InquiryPO ip
      INNER JOIN Inquiry i ON i.InquiryID = ip.InquiryID
      LEFT JOIN CustomerM c ON c.CustomerID = i.CustomerID
      LEFT JOIN InquiryWalkinCustomer wc ON wc.InquiryID = i.InquiryID
      WHERE ip.POID = ?
      ORDER BY ip.ID DESC
    `)
    .all(poId)
}

exports.getAllLinks = () => {
  return db.prepare("SELECT * FROM InquiryPO ORDER BY ID DESC").all()
}
