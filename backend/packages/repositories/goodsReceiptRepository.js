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
      GoodsReceiptID, PoTyresID, PoTyresSupplierID, PoBatteriesID, PoBatterySupplierID, LocationID,
      DispatchedQty, ReceivedQty, AcceptedQty, DamagedQty,
      ShortageQty, OverReceiptQty, DiscrepancyReason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    line.GoodsReceiptID,
    line.PoTyresID ?? null,
    line.PoTyresSupplierID ?? null,
    line.PoBatteriesID ?? null,
    line.PoBatterySupplierID ?? null,
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
      GoodsReceiptLineID, DOT, BatchCode, ReceivedQty, AcceptedQty
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    batch.GoodsReceiptLineID,
    batch.DOT ?? batch.BatchCode ?? null,
    batch.BatchCode ?? batch.DOT ?? null,
    batch.ReceivedQty,
    batch.AcceptedQty
  )

  return Number(result.lastInsertRowid)
}

exports.getPostedAcceptedQtyByAllocationId = (allocationId) => {
  const row = db.prepare(`
    SELECT COALESCE(SUM(grl.AcceptedQty), 0) AS AcceptedQty
    FROM POGoodsReceiptLines grl
    INNER JOIN POGoodsReceipts gr ON gr.ID = grl.GoodsReceiptID
    WHERE (grl.PoTyresSupplierID = ? OR grl.PoBatterySupplierID = ?) AND gr.Status = 'Posted'
  `).get(allocationId, allocationId)

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

exports.getPostedAcceptedQtyByPoBatteriesId = (poBatteriesId) => {
  const row = db.prepare(`
    SELECT COALESCE(SUM(grl.AcceptedQty), 0) AS AcceptedQty
    FROM POGoodsReceiptLines grl
    INNER JOIN POGoodsReceipts gr ON gr.ID = grl.GoodsReceiptID
    WHERE grl.PoBatteriesID = ? AND gr.Status = 'Posted'
  `).get(poBatteriesId)

  return Number(row?.AcceptedQty ?? 0)
}

exports.getGoodsReceiptsByPoId = (poId) => {
  return db.prepare(`
    SELECT
      gr.ID AS GoodsReceiptID,
      gr.GRNNumber,
      gr.POID,
      po.Category,
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
      grl.PoBatteriesID,
      grl.PoBatterySupplierID,
      COALESCE(grl.PoBatterySupplierID, grl.PoTyresSupplierID) AS SupplierAllocationID,
      grl.LocationID,
      COALESCE(blm.LocationName, slm.LocationName) AS LocationName,
      COALESCE(blm.LocationCode, slm.LocationCode) AS LocationCode,
      grl.DispatchedQty,
      grl.ReceivedQty,
      grl.AcceptedQty,
      grl.DamagedQty,
      grl.ShortageQty,
      grl.OverReceiptQty,
      grl.DiscrepancyReason,
      COALESCE(t.Brand, b.Brand) AS Brand,
      t.Size,
      t.Pattern,
      b.Model,
      b.Capacity,
      b.Voltage
    FROM POGoodsReceipts gr
    INNER JOIN PO po ON po.ID = gr.POID
    INNER JOIN SupplierM sm ON sm.SupplierID = gr.SupplierID
    INNER JOIN POGoodsReceiptLines grl ON grl.GoodsReceiptID = gr.ID
    LEFT JOIN POTyres pt ON pt.ID = grl.PoTyresID
    LEFT JOIN TyreM t ON t.Id = pt.TyreID
    LEFT JOIN POBatteries pb ON pb.ID = grl.PoBatteriesID
    LEFT JOIN BatteryM b ON b.Id = pb.BatteryID
    LEFT JOIN StorageLocationM slm ON slm.Id = grl.LocationID
    LEFT JOIN BatteryLocationM blm ON blm.Id = grl.LocationID
    WHERE gr.POID = ?
    ORDER BY gr.ID DESC, grl.ID ASC
  `).all(poId)
}

exports.getGoodsReceiptBatchesByLineId = (lineId) => {
  return db.prepare(`
    SELECT
      ID,
      GoodsReceiptLineID,
      DOT,
      COALESCE(BatchCode, DOT) AS BatchCode,
      ReceivedQty,
      AcceptedQty
    FROM POGoodsReceiptBatches
    WHERE GoodsReceiptLineID = ?
    ORDER BY ID ASC
  `).all(lineId)
}