const db = require("../database/connection")

/**
 * Read-only stock projection.
 * StorageManager.Qty is already reduced during SO allocation, so OnHandQty and
 * AvailableToSellQty intentionally use the same current-stock aggregate.
 */
const baseSnapshotQuery = `
  SELECT
    t.Id AS TyreID,
    t.Size,
    t.Pattern,
    t.LL_SR,
    t.PR,
    t.SideWall,
    t.DOT,
    t.PurchasedPrice,
    t.ActualSellingPrice,
    (
      SELECT GROUP_CONCAT(DISTINCT s.SupplierCode)
      FROM TyreSupplier ts
      INNER JOIN SupplierM s ON s.SupplierID = ts.SupplierID
      WHERE ts.TyreId = t.Id
    ) AS SupplierCodes,
    (
      SELECT GROUP_CONCAT(DISTINCT s.Name)
      FROM TyreSupplier ts
      INNER JOIN SupplierM s ON s.SupplierID = ts.SupplierID
      WHERE ts.TyreId = t.Id
    ) AS SupplierNames,
    COALESCE(stock.TotalQty, 0) AS OnHandQty,
    COALESCE(alloc.TotalAllocated, 0) AS AllocatedSalesQty,
    COALESCE(stock.TotalQty, 0) AS AvailableToSellQty
  FROM TyreM t
  LEFT JOIN (
    SELECT
      TyreId,
      SUM(Qty) AS TotalQty
    FROM StorageManager
    GROUP BY TyreId
  ) stock ON stock.TyreId = t.Id
  LEFT JOIN (
    SELECT
      st.TyreID,
      SUM(sa.Qty) AS TotalAllocated
    FROM SoTyreStorageAllocation sa
    INNER JOIN SoTyres st ON st.ID = sa.SoTyreID
    GROUP BY st.TyreID
  ) alloc ON alloc.TyreID = t.Id
`

exports.getAllStockSnapshots = () => {
  return db
    .prepare(`
      ${baseSnapshotQuery}
      ORDER BY t.Id DESC
    `)
    .all()
}

exports.getStockSnapshotByTyreId = (tyreId) => {
  return db
    .prepare(`
      ${baseSnapshotQuery}
      WHERE t.Id = ?
    `)
    .get(tyreId)
}
