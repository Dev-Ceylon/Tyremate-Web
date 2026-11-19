const db = require("../database/connection")

exports.getSoReturnTyresById = (id) => {
  return db
    .prepare(`
      SELECT
        ID,
        SoTyreID,
        Qty,
        ReturnDate,
        Reason,
        CreatedAt
      FROM SoReturnTyres
      WHERE ID = ?
    `)
    .get(id)
}

exports.getReturnsBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        srt.ID,
        srt.SoTyreID,
        srt.Qty,
        srt.ReturnDate,
        srt.Reason,
        srt.CreatedAt,
        srt.StatusId,
        srt.SalesReturnID,
        st.TyreID,
        st.Price,
        t.Size,
        t.Pattern,
        t.Brand,
        srs.StatusCode,
        srs.StatusName
      FROM SoReturnTyres srt
      INNER JOIN SoTyres st ON srt.SoTyreID = st.ID
      INNER JOIN TyreM t ON t.Id = st.TyreID
      LEFT JOIN SalesReturnStatusM srs ON srs.Id = srt.StatusId
      WHERE st.SoID = ?
      ORDER BY srt.ID DESC
    `)
    .all(soId)
}

exports.getReturnedQtyBySoTyreId = (soTyreId) => {
  const row = db
    .prepare(`
      SELECT COALESCE(SUM(Qty), 0) AS totalReturned
      FROM SoReturnTyres
      WHERE SoTyreID = ?
    `)
    .get(soTyreId)
  return row?.totalReturned ?? 0
}

exports.getReturnedQtyByAllocationId = (allocationId) => {
  const row = db
    .prepare(`
      SELECT COALESCE(SUM(Qty), 0) AS totalReturned
      FROM SoReturnTyres
      WHERE SoTyreStorageAllocationID = ?
    `)
    .get(allocationId)
  return row?.totalReturned ?? 0
}

exports.getSoTyreWithReturnSummary = (soTyreId) => {
  return db
    .prepare(`
      SELECT 
        st.ID AS SoTyreID,
        st.SoID,
        st.TyreID,
        st.Price,
        st.Discount,
        st.Qty AS SoldQty,
        st.NeedToOrderQty,
        st.IsAdminApproved,
        COALESCE(r.totalReturned, 0) AS TotalReturned,
        (st.Qty - COALESCE(r.totalReturned, 0)) AS ReturnableQty
      FROM SoTyres st
      LEFT JOIN (
        SELECT SoTyreID, SUM(Qty) AS totalReturned
        FROM SoReturnTyres
        GROUP BY SoTyreID
      ) r ON r.SoTyreID = st.ID
      WHERE st.ID = ?
    `)
    .get(soTyreId)
}

exports.createSoReturnTyres = (soReturnTyres) => {
  const result = db
    .prepare(`
      INSERT INTO SoReturnTyres (
        SoTyreID,
        Qty,
        ReturnDate,
        Reason,
        SoTyreStorageAllocationID,
        StorageManagerID,
        StorageManagerBatchID,
        DOT,
        SalesReturnID,
        StatusId
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      soReturnTyres.SoTyreID,
      soReturnTyres.Qty,
      soReturnTyres.ReturnDate,
      soReturnTyres.Reason ?? null,
      soReturnTyres.AllocationId ?? null,
      soReturnTyres.StorageManagerID ?? null,
      soReturnTyres.StorageManagerBatchID ?? null,
      soReturnTyres.DOT ?? null,
      soReturnTyres.SalesReturnID ?? null,
      soReturnTyres.StatusId ?? null
    )

  return exports.getSoReturnTyresById(result.lastInsertRowid)
}

exports.deleteReturnsBySoId = (soId) => {
  return db
    .prepare(`
      DELETE FROM SoReturnTyres
      WHERE SoTyreID IN (SELECT ID FROM SoTyres WHERE SoID = ?)
    `)
    .run(soId)
}
