const db = require("../database/connection")

exports.createSalesReturnLine = (line) => {
  const result = db
    .prepare(`
      INSERT INTO SalesReturnLine (
        SalesReturnID,
        SoTyreID,
        TyreID,
        SerialNo,
        ReturnedQty,
        UnitPrice,
        LineAmount,
        ReturnReason,
        AllocationID,
        StorageManagerID,
        StorageManagerBatchID,
        ConditionId,
        DispositionId,
        Inspected,
        Approved,
        InspectionNotes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      line.SalesReturnID,
      line.SoTyreID,
      line.TyreID,
      line.SerialNo ?? null,
      line.ReturnedQty,
      line.UnitPrice,
      line.LineAmount,
      line.ReturnReason ?? null,
      line.AllocationID ?? null,
      line.StorageManagerID ?? null,
      line.StorageManagerBatchID ?? null,
      line.ConditionId ?? null,
      line.DispositionId ?? null,
      line.Inspected ?? 0,
      line.Approved ?? 0,
      line.InspectionNotes ?? null
    )

  return exports.getSalesReturnLineById(result.lastInsertRowid)
}

exports.getSalesReturnLineById = (id) => {
  return db
    .prepare(`
      SELECT 
        srl.*,
        t.Brand,
        t.Size,
        t.Pattern,
        smb.DOT,
        src.ConditionCode,
        src.ConditionName,
        srd.DispositionCode,
        srd.DispositionName
      FROM SalesReturnLine srl
      LEFT JOIN TyreM t ON t.Id = srl.TyreID
      LEFT JOIN StorageManagerBatch smb ON smb.Id = srl.StorageManagerBatchID
      LEFT JOIN SalesReturnConditionM src ON src.Id = srl.ConditionId
      LEFT JOIN SalesReturnDispositionM srd ON srd.Id = srl.DispositionId
      WHERE srl.SalesReturnLineID = ?
    `)
    .get(id)
}

exports.getSalesReturnLinesBySalesReturnId = (salesReturnId) => {
  return db
    .prepare(`
      SELECT 
        srl.*,
        t.Brand,
        t.Size,
        t.Pattern,
        smb.DOT,
        src.ConditionCode,
        src.ConditionName,
        srd.DispositionCode,
        srd.DispositionName
      FROM SalesReturnLine srl
      LEFT JOIN TyreM t ON t.Id = srl.TyreID
      LEFT JOIN StorageManagerBatch smb ON smb.Id = srl.StorageManagerBatchID
      LEFT JOIN SalesReturnConditionM src ON src.Id = srl.ConditionId
      LEFT JOIN SalesReturnDispositionM srd ON srd.Id = srl.DispositionId
      WHERE srl.SalesReturnID = ?
      ORDER BY srl.SalesReturnLineID ASC
    `)
    .all(salesReturnId)
}

exports.updateSalesReturnLineInspection = (salesReturnLineId, payload = {}) => {
  const fields = []
  const values = []

  if (payload.ConditionId !== undefined) {
    fields.push("ConditionId = ?")
    values.push(payload.ConditionId)
  }

  if (payload.DispositionId !== undefined) {
    fields.push("DispositionId = ?")
    values.push(payload.DispositionId)
  }

  if (payload.Inspected !== undefined) {
    fields.push("Inspected = ?")
    values.push(payload.Inspected)
  }

  if (payload.Approved !== undefined) {
    fields.push("Approved = ?")
    values.push(payload.Approved)
  }

  if (payload.InspectionNotes !== undefined) {
    fields.push("InspectionNotes = ?")
    values.push(payload.InspectionNotes)
  }

  if (payload.ReturnReason !== undefined) {
    fields.push("ReturnReason = ?")
    values.push(payload.ReturnReason)
  }

  if (fields.length === 0) {
    return { changes: 0 }
  }

  values.push(salesReturnLineId)

  return db
    .prepare(`UPDATE SalesReturnLine SET ${fields.join(", ")} WHERE SalesReturnLineID = ?`)
    .run(...values)
}

exports.createSalesReturnStockMovement = (movement) => {
  const result = db
    .prepare(`
      INSERT INTO SalesReturnStockMovement (
        SalesReturnID,
        SalesReturnLineID,
        TyreID,
        StorageManagerID,
        StorageManagerBatchID,
        Qty,
        MovementType,
        LocationType,
        MovedBy,
        Notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      movement.SalesReturnID,
      movement.SalesReturnLineID,
      movement.TyreID,
      movement.StorageManagerID ?? null,
      movement.StorageManagerBatchID ?? null,
      movement.Qty,
      movement.MovementType,
      movement.LocationType,
      movement.MovedBy ?? null,
      movement.Notes ?? null
    )

  return exports.getSalesReturnStockMovementById(result.lastInsertRowid)
}

exports.getSalesReturnStockMovementById = (id) => {
  return db
    .prepare(`SELECT * FROM SalesReturnStockMovement WHERE MovementID = ?`)
    .get(id)
}

exports.getSalesReturnStockMovementsBySalesReturnId = (salesReturnId) => {
  return db
    .prepare(`SELECT * FROM SalesReturnStockMovement WHERE SalesReturnID = ? ORDER BY MovementID ASC`)
    .all(salesReturnId)
}
