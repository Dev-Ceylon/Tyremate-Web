const db = require("../database/connection")

exports.createQuarantineStock = (quarantineStock) => {
  const result = db
    .prepare(`
      INSERT INTO QuarantineStock (
        SourceTypeId,
        SourceId,
        SourceLineId,
        TyreID,
        StorageManagerID,
        StorageManagerBatchID,
        SerialNo,
        Qty,
        UnitCost,
        UnitPrice,
        StatusId,
        Reason,
        ReceivedBy,
        Notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      quarantineStock.SourceTypeId,
      quarantineStock.SourceId,
      quarantineStock.SourceLineId ?? null,
      quarantineStock.TyreID,
      quarantineStock.StorageManagerID ?? null,
      quarantineStock.StorageManagerBatchID ?? null,
      quarantineStock.SerialNo ?? null,
      quarantineStock.Qty,
      quarantineStock.UnitCost ?? 0,
      quarantineStock.UnitPrice ?? 0,
      quarantineStock.StatusId,
      quarantineStock.Reason ?? null,
      quarantineStock.ReceivedBy ?? null,
      quarantineStock.Notes ?? null
    )

  return exports.getQuarantineStockById(result.lastInsertRowid)
}

exports.getQuarantineStockById = (id) => {
  return db
    .prepare(`
      SELECT 
        qs.*,
        qsm.SourceCode,
        qsm.SourceName,
        qst.StatusCode,
        qst.StatusName
      FROM QuarantineStock qs
      LEFT JOIN QuarantineSourceM qsm ON qsm.Id = qs.SourceTypeId
      LEFT JOIN QuarantineStatusM qst ON qst.Id = qs.StatusId
      WHERE qs.QuarantineID = ?
    `)
    .get(id)
}

exports.getQuarantineStockBySource = (sourceTypeId, sourceId) => {
  return db
    .prepare(`
      SELECT 
        qs.*,
        qsm.SourceCode,
        qsm.SourceName,
        qst.StatusCode,
        qst.StatusName
      FROM QuarantineStock qs
      LEFT JOIN QuarantineSourceM qsm ON qsm.Id = qs.SourceTypeId
      LEFT JOIN QuarantineStatusM qst ON qst.Id = qs.StatusId
      WHERE qs.SourceTypeId = ? AND qs.SourceId = ?
      ORDER BY qs.QuarantineID DESC
    `)
    .all(sourceTypeId, sourceId)
}

exports.getQuarantineStockBySourceLine = (sourceTypeId, sourceId, sourceLineId) => {
  return db
    .prepare(`
      SELECT 
        qs.*,
        qsm.SourceCode,
        qsm.SourceName,
        qst.StatusCode,
        qst.StatusName
      FROM QuarantineStock qs
      LEFT JOIN QuarantineSourceM qsm ON qsm.Id = qs.SourceTypeId
      LEFT JOIN QuarantineStatusM qst ON qst.Id = qs.StatusId
      WHERE qs.SourceTypeId = ? AND qs.SourceId = ? AND qs.SourceLineId = ?
    `)
    .get(sourceTypeId, sourceId, sourceLineId)
}

exports.updateQuarantineStockStatus = (quarantineId, statusId, payload = {}) => {
  const fields = []
  const values = []

  fields.push("StatusId = ?")
  values.push(statusId)

  if (payload.ReleasedBy !== undefined) {
    fields.push("ReleasedBy = ?")
    values.push(payload.ReleasedBy)
  }

  if (payload.ReleasedAt !== undefined) {
    fields.push("ReleasedAt = ?")
    values.push(payload.ReleasedAt)
  } else if (payload.setReleasedAt) {
    fields.push("ReleasedAt = datetime('now','localtime')")
  }

  if (payload.ReleaseRef !== undefined) {
    fields.push("ReleaseRef = ?")
    values.push(payload.ReleaseRef)
  }

  if (payload.Notes !== undefined) {
    fields.push("Notes = ?")
    values.push(payload.Notes)
  }

  values.push(quarantineId)

  return db
    .prepare(`UPDATE QuarantineStock SET ${fields.join(", ")} WHERE QuarantineID = ?`)
    .run(...values)
}

exports.createQuarantineMovement = (movement) => {
  const result = db
    .prepare(`
      INSERT INTO QuarantineMovement (
        QuarantineID,
        FromStatusId,
        ToStatusId,
        ActionId,
        Qty,
        MovedBy,
        Remarks,
        TargetStorageManagerID,
        TargetStorageManagerBatchID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      movement.QuarantineID,
      movement.FromStatusId ?? null,
      movement.ToStatusId ?? null,
      movement.ActionId,
      movement.Qty,
      movement.MovedBy ?? null,
      movement.Remarks ?? null,
      movement.TargetStorageManagerID ?? null,
      movement.TargetStorageManagerBatchID ?? null
    )

  return exports.getQuarantineMovementById(result.lastInsertRowid)
}

exports.getQuarantineMovementById = (id) => {
  return db
    .prepare(`
      SELECT 
        qm.*,
        qf.StatusCode AS FromStatusCode,
        qf.StatusName AS FromStatusName,
        qt.StatusCode AS ToStatusCode,
        qt.StatusName AS ToStatusName,
        qma.ActionCode,
        qma.ActionName
      FROM QuarantineMovement qm
      LEFT JOIN QuarantineStatusM qf ON qf.Id = qm.FromStatusId
      LEFT JOIN QuarantineStatusM qt ON qt.Id = qm.ToStatusId
      LEFT JOIN QuarantineMovementActionM qma ON qma.Id = qm.ActionId
      WHERE qm.MovementID = ?
    `)
    .get(id)
}

exports.getQuarantineMovementsByQuarantineId = (quarantineId) => {
  return db
    .prepare(`
      SELECT 
        qm.*,
        qf.StatusCode AS FromStatusCode,
        qf.StatusName AS FromStatusName,
        qt.StatusCode AS ToStatusCode,
        qt.StatusName AS ToStatusName,
        qma.ActionCode,
        qma.ActionName
      FROM QuarantineMovement qm
      LEFT JOIN QuarantineStatusM qf ON qf.Id = qm.FromStatusId
      LEFT JOIN QuarantineStatusM qt ON qt.Id = qm.ToStatusId
      LEFT JOIN QuarantineMovementActionM qma ON qma.Id = qm.ActionId
      WHERE qm.QuarantineID = ?
      ORDER BY qm.MovementID ASC
    `)
    .all(quarantineId)
}
