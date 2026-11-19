const db = require("../database/connection")
const { STATUS_CODES } = require("../constants/statusConstants")

exports.getPendingGoodsReceipts = (filters = {}) => {
  const conditions = [
    "pts.IsApproved = 1",
    `pts.Qty - COALESCE(accepted.AcceptedQty, 0) > 0`,
    "tyreLineStatus.StatusCode = ?",
  ]
  const params = [STATUS_CODES.ARRIVING]

  if (filters.POID != null) {
    conditions.push("pts.PoTyresID IN (SELECT pt.ID FROM POTyres pt WHERE pt.POID = ?)")
    params.push(filters.POID)
  }

  if (filters.SupplierID != null) {
    conditions.push("pts.SupplierID = ?")
    params.push(filters.SupplierID)
  }

  if (filters.PoTyresID != null) {
    conditions.push("pts.PoTyresID = ?")
    params.push(filters.PoTyresID)
  }

  if (filters.ExpectedFrom) {
    conditions.push("pts.ExpectedDeliveryDate >= ?")
    params.push(filters.ExpectedFrom)
  }

  if (filters.ExpectedTo) {
    conditions.push("pts.ExpectedDeliveryDate <= ?")
    params.push(filters.ExpectedTo)
  }

  if (filters.OverdueOnly) {
    conditions.push("pts.ExpectedDeliveryDate < ?")
    params.push(filters.TodayDate ?? new Date().toISOString().slice(0, 10))
  }

  return db
    .prepare(`
      SELECT
        pts.ID AS PoTyresSupplierID,
        pts.PoTyresID,
        pts.Qty AS AllocatedQty,
        COALESCE(accepted.AcceptedQty, 0) AS AcceptedToDateQty,
        MAX(pts.Qty - COALESCE(accepted.AcceptedQty, 0), 0) AS PendingQty,
        COALESCE(accepted.GoodsReceiptCount, 0) AS GoodsReceiptCount,
        pts.SupplierID,
        sm.SupplierCode,
        sm.Name AS SupplierName,
        pts.IsApproved,
        pts.ExpectedDeliveryDate,
        pts.ActualDeliveryDate,
        pt.POID,
        po.Date AS PODate,
        po.StatusID AS POStatusID,
        poStatus.StatusCode AS POStatusCode,
        po.IsAdminApproved AS POIsAdminApproved,
        po.IsSupplierApproved AS POIsSupplierApproved,
        tyreLineStatus.StatusCode AS TyreLineStatusCode,
        pt.TyreID,
        t.Brand,
        t.Size,
        t.Pattern,
        pt.Price,
        pt.Discount,
        pta.LocationId AS AllocatedLocationId,
        slm.LocationCode AS AllocatedLocationCode,
        slm.LocationName AS AllocatedLocationName
      FROM PoTyresSuppliers pts
      INNER JOIN POTyres pt ON pt.ID = pts.PoTyresID
      INNER JOIN PO po ON po.ID = pt.POID
      INNER JOIN SupplierM sm ON sm.SupplierID = pts.SupplierID
      INNER JOIN TyreM t ON t.Id = pt.TyreID
      LEFT JOIN StatusM poStatus ON poStatus.Id = po.StatusID
      LEFT JOIN StatusM tyreLineStatus ON tyreLineStatus.Id = pt.StatusID
      LEFT JOIN PoTyreAllocations pta ON pta.POID = po.ID AND pta.PoTyresID = pt.ID
      LEFT JOIN StorageLocationM slm ON slm.Id = pta.LocationId
      LEFT JOIN (
        SELECT
          grl.PoTyresSupplierID,
          COALESCE(SUM(grl.AcceptedQty), 0) AS AcceptedQty,
          COUNT(DISTINCT grl.GoodsReceiptID) AS GoodsReceiptCount
        FROM POGoodsReceiptLines grl
        INNER JOIN POGoodsReceipts gr ON gr.ID = grl.GoodsReceiptID
        WHERE gr.Status = 'Posted'
        GROUP BY grl.PoTyresSupplierID
      ) accepted ON accepted.PoTyresSupplierID = pts.ID
      WHERE ${conditions.join(" AND ")}
      ORDER BY
        pts.ExpectedDeliveryDate IS NULL,
        pts.ExpectedDeliveryDate ASC,
        po.ID DESC,
        pt.ID ASC,
        sm.Name ASC
    `)
    .all(...params)
}