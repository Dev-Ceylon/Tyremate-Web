const db = require("../database/connection")

const SALES_RETURN_SELECT = `
  SELECT sr.*, srt.TypeCode AS ReturnTypeCode, srt.TypeName AS ReturnTypeName,
    srs.StatusCode AS StatusCode, srs.StatusName AS StatusName,
    srwh.HandlingCode AS WarrantyHandlingCode, srwh.HandlingName AS WarrantyHandlingName,
    (SELECT COALESCE(SUM(srl.ReturnedQty), 0) FROM SalesReturnLine srl WHERE srl.SalesReturnID = sr.SalesReturnID) AS TotalQty
  FROM SalesReturn sr
  LEFT JOIN SalesReturnTypeM srt ON srt.Id = sr.ReturnTypeId
  LEFT JOIN SalesReturnStatusM srs ON srs.Id = sr.StatusId
  LEFT JOIN SalesReturnWarrantyHandlingM srwh ON srwh.Id = sr.WarrantyHandlingId
`

exports.getAllSalesReturns = () => db.prepare(`${SALES_RETURN_SELECT} ORDER BY sr.SalesReturnID DESC`).all()

exports.getReservedReturnQtyBySoTyreId = (soTyreId, excludeSalesReturnId = null) => {
  const excludeCurrentReturn = excludeSalesReturnId != null
  return db.prepare(`
    SELECT COALESCE(SUM(srl.ReturnedQty), 0) AS Qty
    FROM SalesReturnLine srl
    INNER JOIN SalesReturn sr ON sr.SalesReturnID = srl.SalesReturnID
    INNER JOIN SalesReturnStatusM srs ON srs.Id = sr.StatusId
    WHERE srl.SoTyreID = ? AND srs.StatusCode NOT IN ('REJECTED', 'CANCELLED')
    ${excludeCurrentReturn ? "AND sr.SalesReturnID != ?" : ""}
  `).get(...(excludeCurrentReturn ? [soTyreId, excludeSalesReturnId] : [soTyreId]))?.Qty ?? 0
}

exports.getReservedReturnQtyByAllocationId = (allocationId, excludeSalesReturnId = null) => {
  const excludeCurrentReturn = excludeSalesReturnId != null
  return db.prepare(`
    SELECT
      (SELECT COALESCE(SUM(Qty), 0) FROM SoReturnTyres WHERE SoTyreStorageAllocationID = ?) +
      (SELECT COALESCE(SUM(srl.ReturnedQty), 0)
       FROM SalesReturnLine srl
       INNER JOIN SalesReturn sr ON sr.SalesReturnID = srl.SalesReturnID
       INNER JOIN SalesReturnStatusM srs ON srs.Id = sr.StatusId
       WHERE srl.AllocationID = ? AND srs.StatusCode NOT IN ('REJECTED', 'CANCELLED')
       ${excludeCurrentReturn ? "AND sr.SalesReturnID != ?" : ""}) AS Qty
  `).get(...(excludeCurrentReturn
    ? [allocationId, allocationId, excludeSalesReturnId]
    : [allocationId, allocationId]))?.Qty ?? 0
}

exports.getInvoiceForSalesOrder = (soId) => {
  return db.prepare(`
    SELECT i.InvoiceID, i.CustomerID, i.WalkinCustomerID
    FROM Invoice i
    INNER JOIN InvoiceSourceM ism ON ism.Id = i.SourceTypeId
    WHERE (
      (ism.SourceCode = 'SO' AND i.SourceID = ?)
      OR 
      (ism.SourceCode = 'delivery' AND i.SourceID IN (
        SELECT ID FROM SODelivery WHERE SoID = ?
      ))
    )
    AND i.IsCreditNote = 0
    ORDER BY i.InvoiceID DESC LIMIT 1
  `).get(soId, soId)
}

exports.createSalesReturn = (salesReturn) => {
  const result = db
    .prepare(`
      INSERT INTO SalesReturn (
        ReturnNo,
        SoID,
        InvoiceID,
        CustomerID,
        WalkinCustomerID,
        ReturnTypeId,
        StatusId,
        WarrantyHandlingId,
        ExchangeSoID,
        RequestedBy,
        Notes,
        RejectionReason
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      salesReturn.ReturnNo,
      salesReturn.SoID,
      salesReturn.InvoiceID ?? null,
      salesReturn.CustomerID ?? null,
      salesReturn.WalkinCustomerID ?? null,
      salesReturn.ReturnTypeId,
      salesReturn.StatusId,
      salesReturn.WarrantyHandlingId ?? null,
      salesReturn.ExchangeSoID ?? null,
      salesReturn.RequestedBy ?? null,
      salesReturn.Notes ?? null,
      salesReturn.RejectionReason ?? null
    )

  return exports.getSalesReturnById(result.lastInsertRowid)
}

exports.getSalesReturnById = (id) => {
  return db
    .prepare(`
      SELECT 
        sr.*,
        srt.TypeCode AS ReturnTypeCode,
        srt.TypeName AS ReturnTypeName,
        srs.StatusCode AS StatusCode,
        srs.StatusName AS StatusName,
        srwh.HandlingCode AS WarrantyHandlingCode,
        srwh.HandlingName AS WarrantyHandlingName
      FROM SalesReturn sr
      LEFT JOIN SalesReturnTypeM srt ON srt.Id = sr.ReturnTypeId
      LEFT JOIN SalesReturnStatusM srs ON srs.Id = sr.StatusId
      LEFT JOIN SalesReturnWarrantyHandlingM srwh ON srwh.Id = sr.WarrantyHandlingId
      WHERE sr.SalesReturnID = ?
    `)
    .get(id)
}

exports.getSalesReturnByReturnNo = (returnNo) => {
  return db
    .prepare(`
      SELECT 
        sr.*,
        srt.TypeCode AS ReturnTypeCode,
        srt.TypeName AS ReturnTypeName,
        srs.StatusCode AS StatusCode,
        srs.StatusName AS StatusName,
        srwh.HandlingCode AS WarrantyHandlingCode,
        srwh.HandlingName AS WarrantyHandlingName
      FROM SalesReturn sr
      LEFT JOIN SalesReturnTypeM srt ON srt.Id = sr.ReturnTypeId
      LEFT JOIN SalesReturnStatusM srs ON srs.Id = sr.StatusId
      LEFT JOIN SalesReturnWarrantyHandlingM srwh ON srwh.Id = sr.WarrantyHandlingId
      WHERE sr.ReturnNo = ?
    `)
    .get(returnNo)
}

exports.getSalesReturnsBySoId = (soId) => {
  return db.prepare(`
    SELECT sr.*, srt.TypeCode AS ReturnTypeCode, srt.TypeName AS ReturnTypeName,
      srs.StatusCode AS StatusCode, srs.StatusName AS StatusName,
      srwh.HandlingCode AS WarrantyHandlingCode, srwh.HandlingName AS WarrantyHandlingName,
      (SELECT COALESCE(SUM(srl.ReturnedQty), 0) FROM SalesReturnLine srl WHERE srl.SalesReturnID = sr.SalesReturnID) AS TotalQty,
      COALESCE(rf.RefundedAmount, 0) AS RefundedAmount
    FROM SalesReturn sr
    LEFT JOIN SalesReturnTypeM srt ON srt.Id = sr.ReturnTypeId
    LEFT JOIN SalesReturnStatusM srs ON srs.Id = sr.StatusId
    LEFT JOIN SalesReturnWarrantyHandlingM srwh ON srwh.Id = sr.WarrantyHandlingId
    LEFT JOIN (
      SELECT sr.SalesReturnID, COALESCE(SUM(r.Amount), 0) AS RefundedAmount
      FROM SalesReturn sr
      LEFT JOIN CreditNoteM cn ON cn.SalesReturnID = sr.SalesReturnID
      LEFT JOIN RefundM r ON r.CreditNoteID = cn.CreditNoteID
      LEFT JOIN RefundStatusM rs ON rs.Id = r.StatusId
      WHERE rs.StatusCode NOT IN ('CANCELLED', 'FAILED')
      GROUP BY sr.SalesReturnID
    ) rf ON rf.SalesReturnID = sr.SalesReturnID
    WHERE sr.SoID = ? ORDER BY sr.SalesReturnID DESC
  `).all(soId)
}

exports.updateSalesReturnStatus = (salesReturnId, statusId, payload = {}) => {
  const fields = []
  const values = []

  fields.push("StatusId = ?")
  values.push(statusId)

  if (payload.InspectedBy !== undefined) {
    fields.push("InspectedBy = ?")
    values.push(payload.InspectedBy)
  }

  if (payload.InspectedDate !== undefined) {
    fields.push("InspectedDate = ?")
    values.push(payload.InspectedDate)
  } else if (payload.setInspectedDate) {
    fields.push("InspectedDate = datetime('now','localtime')")
  }

  if (payload.ApprovedBy !== undefined) {
    fields.push("ApprovedBy = ?")
    values.push(payload.ApprovedBy)
  }

  if (payload.ApprovedDate !== undefined) {
    fields.push("ApprovedDate = ?")
    values.push(payload.ApprovedDate)
  } else if (payload.setApprovedDate) {
    fields.push("ApprovedDate = datetime('now','localtime')")
  }

  if (payload.ClosedDate !== undefined) {
    fields.push("ClosedDate = ?")
    values.push(payload.ClosedDate)
  } else if (payload.setClosedDate) {
    fields.push("ClosedDate = datetime('now','localtime')")
  }

  if (payload.ExchangeSoID !== undefined) {
    fields.push("ExchangeSoID = ?")
    values.push(payload.ExchangeSoID)
  }

  if (payload.RejectionReason !== undefined) {
    fields.push("RejectionReason = ?")
    values.push(payload.RejectionReason)
  }

  if (payload.Notes !== undefined) {
    fields.push("Notes = ?")
    values.push(payload.Notes)
  }

  values.push(salesReturnId)

  const result = db
    .prepare(`UPDATE SalesReturn SET ${fields.join(", ")} WHERE SalesReturnID = ?`)
    .run(...values)

  // Also update linked legacy SoReturnTyres records for status tracking in SO Return History
  db.prepare(`UPDATE SoReturnTyres SET StatusId = ? WHERE SalesReturnID = ?`).run(statusId, salesReturnId)

  return result
}

exports.createSalesReturnRefund = (refund) => {
  const result = db
    .prepare(`
      INSERT INTO SalesReturnRefund (
        SalesReturnID,
        CreditNoteID,
        Method,
        Amount,
        ReferenceNo,
        PaidBy,
        Notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      refund.SalesReturnID,
      refund.CreditNoteID ?? null,
      refund.Method,
      refund.Amount,
      refund.ReferenceNo ?? null,
      refund.PaidBy ?? null,
      refund.Notes ?? null
    )

  return exports.getSalesReturnRefundById(result.lastInsertRowid)
}

exports.getSalesReturnRefundById = (id) => {
  return db
    .prepare(`SELECT * FROM SalesReturnRefund WHERE RefundID = ?`)
    .get(id)
}

exports.getSalesReturnRefundsBySalesReturnId = (salesReturnId) => {
  return db
    .prepare(`SELECT * FROM SalesReturnRefund WHERE SalesReturnID = ? ORDER BY RefundID ASC`)
    .all(salesReturnId)
}

exports.createWarrantyClaim = (claim) => {
  const result = db
    .prepare(`
      INSERT INTO WarrantyClaim (
        ClaimNo,
        SalesReturnID,
        SalesReturnLineID,
        SupplierID,
        Status,
        SubmittedBy,
        SupplierRefNo,
        Notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      claim.ClaimNo,
      claim.SalesReturnID,
      claim.SalesReturnLineID,
      claim.SupplierID ?? null,
      claim.Status ?? 'SUBMITTED',
      claim.SubmittedBy ?? null,
      claim.SupplierRefNo ?? null,
      claim.Notes ?? null
    )

  return exports.getWarrantyClaimById(result.lastInsertRowid)
}

exports.getWarrantyClaimById = (id) => {
  return db
    .prepare(`SELECT * FROM WarrantyClaim WHERE ClaimID = ?`)
    .get(id)
}

exports.getWarrantyClaimsBySalesReturnId = (salesReturnId) => {
  return db
    .prepare(`SELECT * FROM WarrantyClaim WHERE SalesReturnID = ? ORDER BY ClaimID ASC`)
    .all(salesReturnId)
}
