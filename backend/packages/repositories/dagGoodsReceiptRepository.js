const db = require("../database/connection")

exports.createDagGoodsReceipt = (receipt) => {
  const result = db
    .prepare(`
      INSERT INTO DAGGoodsReceipts (
        DAGID,
        ReceiptDate,
        DeliveryNoteNumber,
        CreatedBy
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(
      receipt.DAGID,
      receipt.ReceiptDate,
      receipt.DeliveryNoteNumber ?? null,
      receipt.CreatedBy ?? null
    )

  const id = Number(result.lastInsertRowid)
  const grnNumber = `DGRN-${String(id).padStart(7, "0")}`
  db.prepare("UPDATE DAGGoodsReceipts SET GRNNumber = ? WHERE ID = ?").run(grnNumber, id)
  return { ID: id, GRNNumber: grnNumber }
}

exports.createDagGoodsReceiptLine = (line) => {
  const result = db
    .prepare(`
      INSERT INTO DAGGoodsReceiptLines (
        GoodsReceiptID,
        DAGID,
        DAGTyresID,
        SourceStorageManagerID,
        DestinationLocationID,
        DispatchedQty,
        ReceivedQty,
        AcceptedQty,
        DamagedQty,
        ShortageQty,
        OverReceiptQty,
        DiscrepancyReason
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      line.GoodsReceiptID,
      line.DAGID,
      line.DAGTyresID ?? null,
      line.SourceStorageManagerID,
      line.DestinationLocationID,
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

exports.getDagGoodsReceiptsByDagId = (dagId) => {
  return db
    .prepare(`
      SELECT
        gr.ID AS GoodsReceiptID,
        gr.GRNNumber,
        gr.DAGID,
        gr.ReceiptDate,
        gr.DeliveryNoteNumber,
        gr.Status,
        gr.CreatedAt,
        gr.PostedAt,
        grl.ID AS GoodsReceiptLineID,
        grl.DAGTyresID,
        grl.SourceStorageManagerID,
        grl.DestinationLocationID,
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
      FROM DAGGoodsReceipts gr
      INNER JOIN DAGGoodsReceiptLines grl ON grl.GoodsReceiptID = gr.ID
      LEFT JOIN DAGTyres dt ON dt.ID = grl.DAGTyresID
      LEFT JOIN TyreM t ON t.Id = dt.TyreID
      WHERE gr.DAGID = ?
      ORDER BY gr.ID DESC, grl.ID ASC
    `)
    .all(dagId)
}

exports.getDagGoodsReceiptById = (id) => {
  return db
    .prepare(`
      SELECT
        ID AS GoodsReceiptID,
        GRNNumber,
        DAGID,
        ReceiptDate,
        DeliveryNoteNumber,
        Status,
        CreatedBy,
        CreatedAt,
        PostedAt
      FROM DAGGoodsReceipts
      WHERE ID = ?
    `)
    .get(id)
}

/**
 * Aggregates the receipted quantities for a DAG so callers (e.g. the DAG
 * details screen) can tell how much has been released from quarantine without
 * crawling the individual receipt lines.
 */
exports.getDagGoodsReceiptSummary = (dagId) => {
  return db
    .prepare(`
      SELECT
        COUNT(*) AS ReceiptCount,
        COALESCE(SUM(AcceptedQty), 0) AS AcceptedQty,
        COALESCE(SUM(DamagedQty), 0) AS DamagedQty,
        COALESCE(SUM(ShortageQty), 0) AS ShortageQty,
        COALESCE(SUM(OverReceiptQty), 0) AS OverReceiptQty
      FROM DAGGoodsReceiptLines
      WHERE DAGID = ?
    `)
    .get(dagId)
}
