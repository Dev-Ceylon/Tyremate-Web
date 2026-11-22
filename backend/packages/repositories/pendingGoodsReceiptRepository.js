const db = require("../database/connection")
const { STATUS_CODES } = require("../constants/statusConstants")

exports.getPendingGoodsReceipts = (filters = {}) => {
  const includeTyres = !filters.Category || filters.Category === "all" || filters.Category === "tyre"
  const includeBatteries = !filters.Category || filters.Category === "all" || filters.Category === "battery"

  const buildTyreQuery = () => {
    const conditions = [
      "pts.IsApproved = 1",
      "pts.Qty - COALESCE(accepted.AcceptedQty, 0) > 0",
      "tyreLineStatus.StatusCode = ?",
    ]
    const params = [STATUS_CODES.ARRIVING]

    if (filters.POID != null) {
      conditions.push("pt.POID = ?")
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

    const sql = `
      SELECT
        pts.ID AS PoTyresSupplierID,
        NULL AS PoBatterySupplierID,
        pts.PoTyresID,
        NULL AS PoBatteriesID,
        'tyre' AS Category,
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
        tyreLineStatus.StatusCode AS LineStatusCode,
        pt.TyreID,
        NULL AS BatteryID,
        t.Brand,
        t.Size,
        t.Pattern,
        NULL AS Model,
        NULL AS Capacity,
        NULL AS Voltage,
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
        WHERE gr.Status = 'Posted' AND grl.PoTyresSupplierID IS NOT NULL
        GROUP BY grl.PoTyresSupplierID
      ) accepted ON accepted.PoTyresSupplierID = pts.ID
      WHERE ${conditions.join(" AND ")}
    `
    return { sql, params }
  }

  const buildBatteryQuery = () => {
    const conditions = [
      "pbs.IsApproved = 1",
      "pbs.Qty - COALESCE(accepted.AcceptedQty, 0) > 0",
      "batteryLineStatus.StatusCode = ?",
    ]
    const params = [STATUS_CODES.ARRIVING]

    if (filters.POID != null) {
      conditions.push("pb.POID = ?")
      params.push(filters.POID)
    }

    if (filters.SupplierID != null) {
      conditions.push("pbs.SupplierID = ?")
      params.push(filters.SupplierID)
    }

    if (filters.PoBatteriesID != null || filters.PoTyresID != null) {
      conditions.push("pbs.PoBatteriesID = ?")
      params.push(filters.PoBatteriesID ?? filters.PoTyresID)
    }

    if (filters.ExpectedFrom) {
      conditions.push("pbs.ExpectedDeliveryDate >= ?")
      params.push(filters.ExpectedFrom)
    }

    if (filters.ExpectedTo) {
      conditions.push("pbs.ExpectedDeliveryDate <= ?")
      params.push(filters.ExpectedTo)
    }

    if (filters.OverdueOnly) {
      conditions.push("pbs.ExpectedDeliveryDate < ?")
      params.push(filters.TodayDate ?? new Date().toISOString().slice(0, 10))
    }

    const sql = `
      SELECT
        pbs.ID AS PoTyresSupplierID,
        pbs.ID AS PoBatterySupplierID,
        pbs.PoBatteriesID AS PoTyresID,
        pbs.PoBatteriesID AS PoBatteriesID,
        'battery' AS Category,
        pbs.Qty AS AllocatedQty,
        COALESCE(accepted.AcceptedQty, 0) AS AcceptedToDateQty,
        MAX(pbs.Qty - COALESCE(accepted.AcceptedQty, 0), 0) AS PendingQty,
        COALESCE(accepted.GoodsReceiptCount, 0) AS GoodsReceiptCount,
        pbs.SupplierID,
        sm.SupplierCode,
        sm.Name AS SupplierName,
        pbs.IsApproved,
        pbs.ExpectedDeliveryDate,
        pbs.ActualDeliveryDate,
        pb.POID,
        po.Date AS PODate,
        po.StatusID AS POStatusID,
        poStatus.StatusCode AS POStatusCode,
        po.IsAdminApproved AS POIsAdminApproved,
        po.IsSupplierApproved AS POIsSupplierApproved,
        batteryLineStatus.StatusCode AS TyreLineStatusCode,
        batteryLineStatus.StatusCode AS LineStatusCode,
        NULL AS TyreID,
        pb.BatteryID AS BatteryID,
        b.Brand,
        COALESCE(b.Model, b.Voltage, '') AS Size,
        COALESCE(b.Capacity, b.Technology, '') AS Pattern,
        b.Model,
        b.Capacity,
        b.Voltage,
        pb.Price,
        pb.Discount,
        pba.LocationId AS AllocatedLocationId,
        COALESCE(blm.LocationCode, slm.LocationCode) AS AllocatedLocationCode,
        COALESCE(blm.LocationName, slm.LocationName) AS AllocatedLocationName
      FROM PoBatterySuppliers pbs
      INNER JOIN POBatteries pb ON pb.ID = pbs.PoBatteriesID
      INNER JOIN PO po ON po.ID = pb.POID
      INNER JOIN SupplierM sm ON sm.SupplierID = pbs.SupplierID
      INNER JOIN BatteryM b ON b.Id = pb.BatteryID
      LEFT JOIN StatusM poStatus ON poStatus.Id = po.StatusID
      LEFT JOIN StatusM batteryLineStatus ON batteryLineStatus.Id = pb.StatusID
      LEFT JOIN PoBatteryAllocations pba ON pba.POID = po.ID AND pba.PoBatteriesID = pb.ID
      LEFT JOIN BatteryLocationM blm ON blm.Id = pba.LocationId
      LEFT JOIN StorageLocationM slm ON slm.Id = pba.LocationId
      LEFT JOIN (
        SELECT
          grl.PoBatterySupplierID,
          COALESCE(SUM(grl.AcceptedQty), 0) AS AcceptedQty,
          COUNT(DISTINCT grl.GoodsReceiptID) AS GoodsReceiptCount
        FROM POGoodsReceiptLines grl
        INNER JOIN POGoodsReceipts gr ON gr.ID = grl.GoodsReceiptID
        WHERE gr.Status = 'Posted' AND grl.PoBatterySupplierID IS NOT NULL
        GROUP BY grl.PoBatterySupplierID
      ) accepted ON accepted.PoBatterySupplierID = pbs.ID
      WHERE ${conditions.join(" AND ")}
    `
    return { sql, params }
  }

  let fullSql = ""
  let allParams = []

  if (includeTyres && includeBatteries) {
    const tyreQ = buildTyreQuery()
    const batteryQ = buildBatteryQuery()
    fullSql = `
      SELECT * FROM (
        ${tyreQ.sql}
        UNION ALL
        ${batteryQ.sql}
      )
      ORDER BY
        ExpectedDeliveryDate IS NULL,
        ExpectedDeliveryDate ASC,
        POID DESC,
        PoTyresID ASC,
        SupplierName ASC
    `
    allParams = [...tyreQ.params, ...batteryQ.params]
  } else if (includeTyres) {
    const tyreQ = buildTyreQuery()
    fullSql = `${tyreQ.sql} ORDER BY pts.ExpectedDeliveryDate IS NULL, pts.ExpectedDeliveryDate ASC, po.ID DESC, pt.ID ASC, sm.Name ASC`
    allParams = tyreQ.params
  } else {
    const batteryQ = buildBatteryQuery()
    fullSql = `${batteryQ.sql} ORDER BY pbs.ExpectedDeliveryDate IS NULL, pbs.ExpectedDeliveryDate ASC, po.ID DESC, pb.ID ASC, sm.Name ASC`
    allParams = batteryQ.params
  }

  return db.prepare(fullSql).all(...allParams)
}