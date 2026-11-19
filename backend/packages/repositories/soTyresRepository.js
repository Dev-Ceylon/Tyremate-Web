const db = require("../database/connection")

exports.getAllSoTyres = () => {
  return db
    .prepare(`
      SELECT
        ID,
        SoID,
        TyreID,
        Price,
        Discount,
        Qty,
        NeedToOrderQty,
        IsAdminApproved
      FROM SoTyres
      ORDER BY ID DESC
    `)
    .all()
}

exports.getSoTyresBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        st.ID,
        st.SoID,
        st.TyreID,
        st.Price,
        st.Discount,
        st.Qty,
        st.NeedToOrderQty,
        st.IsAdminApproved,
        t.Size,
        t.Pattern,
        t.Brand, 
        COALESCE(SUM(srt.Qty), 0) + COALESCE((
          SELECT SUM(srl.ReturnedQty)
          FROM SalesReturnLine srl
          INNER JOIN SalesReturn sr ON sr.SalesReturnID = srl.SalesReturnID
          INNER JOIN SalesReturnStatusM srs ON srs.Id = sr.StatusId
          WHERE srl.SoTyreID = st.ID AND srs.StatusCode NOT IN ('REJECTED', 'CANCELLED')
        ), 0) AS returnedQty,
        CASE 
          WHEN st.Qty > 0 AND st.Qty <= COALESCE(SUM(srt.Qty), 0) + COALESCE((
            SELECT SUM(srl.ReturnedQty)
            FROM SalesReturnLine srl
            INNER JOIN SalesReturn sr ON sr.SalesReturnID = srl.SalesReturnID
            INNER JOIN SalesReturnStatusM srs ON srs.Id = sr.StatusId
            WHERE srl.SoTyreID = st.ID AND srs.StatusCode NOT IN ('REJECTED', 'CANCELLED')
          ), 0) THEN 1 
          ELSE 0 
        END AS reTurnCompleted
      FROM SoTyres st
      INNER JOIN TyreM t ON t.Id = st.TyreID
      LEFT JOIN SoReturnTyres srt ON srt.SoTyreID = st.ID
      WHERE st.SoID = ?
      GROUP BY st.ID, st.SoID, st.TyreID, st.Price, st.Discount, st.Qty, st.NeedToOrderQty, st.IsAdminApproved, t.Size, t.Pattern, t.Brand
      ORDER BY st.ID DESC;
    `)
    .all(soId)
}

exports.getSoTyre = (soId, tyreId) => {
  return db
    .prepare(`
      SELECT
        ID,
        SoID,
        TyreID,
        Price,
        Discount,
        Qty,
        NeedToOrderQty,
        IsAdminApproved
      FROM SoTyres
      WHERE SoID = ? AND TyreID = ?
    `)
    .get(soId, tyreId)
}

exports.getSoTyreById = (id) => {
  return db
    .prepare(`
      SELECT
        ID,
        SoID,
        TyreID,
        Price,
        Discount,
        Qty,
        NeedToOrderQty,
        IsAdminApproved
      FROM SoTyres
      WHERE ID = ?
    `)
    .get(id)
}

exports.createSoTyre = (soTyre) => {
  const result = db
    .prepare(`
      INSERT INTO SoTyres (
        SoID,
        TyreID,
        Price,
        Discount,
        Qty,
        NeedToOrderQty,
        IsAdminApproved
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      soTyre.SoID,
      soTyre.TyreID,
      soTyre.Price,
      soTyre.Discount,
      soTyre.Qty,
      soTyre.NeedToOrderQty,
      soTyre.IsAdminApproved
    )

  return db
    .prepare(`
      SELECT
        ID,
        SoID,
        TyreID,
        Price,
        Discount,
        Qty,
        NeedToOrderQty,
        IsAdminApproved
      FROM SoTyres
      WHERE ID = ?
    `)
    .get(result.lastInsertRowid)
}

exports.updateSoTyre = (soId, tyreId, soTyre) => {
  const result = db
    .prepare(`
      UPDATE SoTyres
      SET
        SoID = ?,
        TyreID = ?,
        Price = ?,
        Discount = ?,
        Qty = ?,
        NeedToOrderQty = ?,
        IsAdminApproved = ?
      WHERE SoID = ? AND TyreID = ?
    `)
    .run(
      soTyre.SoID,
      soTyre.TyreID,
      soTyre.Price,
      soTyre.Discount,
      soTyre.Qty,
      soTyre.NeedToOrderQty,
      soTyre.IsAdminApproved,
      soId,
      tyreId
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getSoTyre(soTyre.SoID, soTyre.TyreID)
}

// Sets the outstanding "to order" quantity for one order line.
exports.setNeedToOrderQtyForSoTyre = (soId, tyreId, needToOrderQty) => {
  return db
    .prepare(`
      UPDATE SoTyres
      SET NeedToOrderQty = ?
      WHERE SoID = ? AND TyreID = ?
    `)
    .run(Math.max(0, Number(needToOrderQty) || 0), soId, tyreId)
}

// Reduces the outstanding "to order" quantity for one order line by the amount
// a linked purchase order supplied. Only the ordered quantity is cleared, so a
// PO that covers just part of an order line (or only some tyres) leaves the
// remainder still flagged as needing to be ordered.
exports.reduceNeedToOrderQtyForSoTyre = (soId, tyreId, qty) => {
  return db
    .prepare(`
      UPDATE SoTyres
      SET NeedToOrderQty = MAX(0, NeedToOrderQty - ?)
      WHERE SoID = ? AND TyreID = ?
    `)
    .run(qty, soId, tyreId)
}

exports.deleteSoTyre = (soId, tyreId) => {
  return db
    .prepare(`
      DELETE FROM SoTyres
      WHERE SoID = ? AND TyreID = ?
    `)
    .run(soId, tyreId)
}

exports.deleteSoTyresBySoId = (soId) => {
  return db
    .prepare(`
      DELETE FROM SoTyres
      WHERE SoID = ?
    `)
    .run(soId)
}
