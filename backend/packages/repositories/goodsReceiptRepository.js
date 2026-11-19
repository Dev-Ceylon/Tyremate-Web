const db = require("../database/connection")

exports.createGoodsReceipt = (receipt) => {
  const result = db.prepare(`
    INSERT INTO POGoodsReceipts (
      POID, SupplierID, ReceiptDate, DeliveryNoteNumber, CreatedBy
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    receipt.POID,
    receipt.SupplierID,
    receipt.ReceiptDate,
    receipt.DeliveryNoteNumber ?? null,
    receipt.CreatedBy ?? null
  )

  const id = Number(result.lastInsertRowid)
  const grnNumber = `GRN-${String(id).padStart(7, "0")}`
  db.prepare("UPDATE POGoodsReceipts SET GRNNumber = ? WHERE ID = ?").run(grnNumber, id)
  return { ID: id, GRNNumber: grnNumber }
}

exports.createGoodsReceiptLine = (line) => {
  const result = db.prepare(`
    INSERT INTO POGoodsReceiptLines (
      GoodsReceiptID, PoTyresID, PoTyresSupplierID, LocationID,
      DispatchedQty, ReceivedQty, AcceptedQty, DamagedQty,
      ShortageQty, OverReceiptQty, DiscrepancyReason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    line.GoodsReceiptID,
    line.PoTyresID,
    line.PoTyresSupplierID,
    line.LocationID,
    line.DispatchedQty,
    line.ReceivedQty,
    line.AcceptedQty,
    line.DamagedQty,
    line.ShortageQty,
    line.OverReceiptQty,
    line.DiscrepancyReason ?? null
  )

  return Number(result.lastInsertRowid)
}

exports.createGoodsReceiptBatch = (batch) => {
  const result = db.prepare(`
    INSERT INTO POGoodsReceiptBatches (
      GoodsReceiptLineID, DOT, ReceivedQty, AcceptedQty
    ) VALUES (?, ?, ?, ?)
  `).run(batch.GoodsReceiptLineID, batch.DOT ?? null, batch.ReceivedQty, batch.AcceptedQty)

  return Number(result.lastInsertRowid)
}

exports.getPostedAcceptedQtyByAllocationId = (allocationId) => {
  const row = db.prepare(`
    SELECT COALESCE(SUM(grl.AcceptedQty), 0) AS AcceptedQty
    FROM POGoodsReceiptLines grl
    INNER JOIN POGoodsReceipts gr ON gr.ID = grl.GoodsReceiptID
    WHERE grl.PoTyresSupplierID = ? AND gr.Status = 'Posted'
  `).get(allocationId)

  return Number(row?.AcceptedQty ?? 0)
}

exports.getPostedAcceptedQtyByPoTyresId = (poTyresId) => {
  const row = db.prepare(`
    SELECT COALESCE(SUM(grl.AcceptedQty), 0) AS AcceptedQty
    FROM POGoodsReceiptLines grl
    INNER JOIN POGoodsReceipts gr ON gr.ID = grl.GoodsReceiptID
    WHERE grl.PoTyresID = ? AND gr.Status = 'Posted'
  `).get(poTyresId)

  return Number(row?.AcceptedQty ?? 0)
}

exports.getGoodsReceiptsByPoId = (poId) => {
  return db.prepare(`
    SELECT
      gr.ID AS GoodsReceiptID,
      gr.GRNNumber,
      gr.POID,
      gr.SupplierID,
      sm.Name AS SupplierName,
      gr.ReceiptDate,
      gr.DeliveryNoteNumber,
      gr.Status,
      gr.CreatedAt,
      gr.PostedAt,
      grl.ID AS GoodsReceiptLineID,
      grl.PoTyresID,
      grl.PoTyresSupplierID,
      grl.LocationID,
      grl.DispatchedQty,
      grl.ReceivedQty,
      grl.AcceptedQty,
      grl.DamagedQty,
      grl.ShortageQty,
      grl.OverReceiptQty,
      grl.DiscrepancyReason,
      t.Brand,
      t.Size,
      t.Pattern
    FROM POGoodsReceipts gr
    INNER JOIN SupplierM sm ON sm.SupplierID = gr.SupplierID
    INNER JOIN POGoodsReceiptLines grl ON grl.GoodsReceiptID = gr.ID
    INNER JOIN POTyres pt ON pt.ID = grl.PoTyresID
    INNER JOIN TyreM t ON t.Id = pt.TyreID
    WHERE gr.POID = ?
    ORDER BY gr.ID DESC, grl.ID ASC
  `).all(poId)
}

exports.getGoodsReceiptBatchesByLineId = (lineId) => {
  return db.prepare(`
    SELECT ID, GoodsReceiptLineID, DOT, ReceivedQty, AcceptedQty
    FROM POGoodsReceiptBatches
    WHERE GoodsReceiptLineID = ?
    ORDER BY ID ASC
  `).all(lineId)
}