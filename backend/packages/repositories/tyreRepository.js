const db = require("../database/connection")
const tyreSupplierRepo = require("./tyreSupplierRepository")

// "Available to sell" stock: only Default (df) locations count. DAG and
// quarantine lots are not sellable, so they must not inflate the available
// figure. This mirrors the drain queries used by createSOWithAutoPO
// (getBatchesByTyreIdOrderedByDOT / getStorageManagersByTyreIdWithoutBatches),
// which also only consider df locations.
const AVAILABLE_STOCK_SQL = `
        SELECT sm.TyreId, SUM(sm.Qty) AS AvailableQuantity
        FROM StorageManager sm
        INNER JOIN StorageLocationM sl ON sl.Id = sm.LocationID
        INNER JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
        WHERE LOWER(slt.LocationTypeCode) = 'df'
        GROUP BY sm.TyreId
      `

exports.getAllTyres = () => {
  return db
    .prepare(`
      SELECT
        t.Id,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        t.PriceValidityFrom,
        t.PriceValidityTo,
        t.PurchasedPrice,
        t.DAGCost,
        t.DiscountOffered,
        t.DiscountAmount,
        t.MRP_WithoutVAT,
        t.MRP_WithVAT,
        t.ActualSellingPrice,
        GROUP_CONCAT(DISTINCT s.SupplierCode) AS SupplierCodes,
        GROUP_CONCAT(DISTINCT s.Name) AS SupplierNames
      FROM TyreM t
      LEFT JOIN TyreSupplier ts ON ts.TyreId = t.Id
      LEFT JOIN SupplierM s ON s.SupplierID = ts.SupplierID
      GROUP BY
        t.Id,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        t.PriceValidityFrom,
        t.PriceValidityTo,
        t.PurchasedPrice,
        t.DAGCost,
        t.DiscountOffered,
        t.DiscountAmount,
        t.MRP_WithoutVAT,
        t.MRP_WithVAT,
        t.ActualSellingPrice
      ORDER BY t.Id DESC
    `)
    .all()
    .map((tyre) => ({
      ...tyre,
      SupplierIDs: tyreSupplierRepo.getSupplierIdsByTyreId(tyre.Id),
    }))
}

exports.getAllTyresWithAvailableQuantity = () => {
  return db
    .prepare(`
      SELECT
        t.Id,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        t.PriceValidityFrom,
        t.PriceValidityTo,
        t.PurchasedPrice,
        t.DAGCost,
        t.DiscountOffered,
        t.DiscountAmount,
        t.MRP_WithoutVAT,
        t.MRP_WithVAT,
        t.ActualSellingPrice,
        COALESCE(stock.AvailableQuantity, 0) AS AvailableQuantity,
        GROUP_CONCAT(DISTINCT s.SupplierCode) AS SupplierCodes,
        GROUP_CONCAT(DISTINCT s.Name) AS SupplierNames
      FROM TyreM t
      LEFT JOIN (
        ${AVAILABLE_STOCK_SQL}
      ) stock ON stock.TyreId = t.Id
      LEFT JOIN TyreSupplier ts ON ts.TyreId = t.Id
      LEFT JOIN SupplierM s ON s.SupplierID = ts.SupplierID
      GROUP BY
        t.Id,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        t.PriceValidityFrom,
        t.PriceValidityTo,
        t.PurchasedPrice,
        t.DAGCost,
        t.DiscountOffered,
        t.DiscountAmount,
        t.MRP_WithoutVAT,
        t.MRP_WithVAT,
        t.ActualSellingPrice
      ORDER BY t.Id DESC
    `)
    .all()
    .map((tyre) => ({
      ...tyre,
      SupplierIDs: tyreSupplierRepo.getSupplierIdsByTyreId(tyre.Id),
    }))
}

exports.getTyreById = (tyreId) => {
  const tyre = db
    .prepare(`
      SELECT
        t.Id,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        t.PriceValidityFrom,
        t.PriceValidityTo,
        t.PurchasedPrice,
        t.DAGCost,
        t.DiscountOffered,
        t.DiscountAmount,
        t.MRP_WithoutVAT,
        t.MRP_WithVAT,
        t.ActualSellingPrice,
        GROUP_CONCAT(DISTINCT s.SupplierCode) AS SupplierCodes,
        GROUP_CONCAT(DISTINCT s.Name) AS SupplierNames
      FROM TyreM t
      LEFT JOIN TyreSupplier ts ON ts.TyreId = t.Id
      LEFT JOIN SupplierM s ON s.SupplierID = ts.SupplierID
      WHERE t.Id = ?
      GROUP BY
        t.Id,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        t.PriceValidityFrom,
        t.PriceValidityTo,
        t.PurchasedPrice,
        t.DAGCost,
        t.DiscountOffered,
        t.DiscountAmount,
        t.MRP_WithoutVAT,
        t.MRP_WithVAT,
        t.ActualSellingPrice
    `)
    .get(tyreId)

  if (!tyre) {
    return null
  }

  return {
    ...tyre,
    SupplierIDs: tyreSupplierRepo.getSupplierIdsByTyreId(tyre.Id),
  }
}

exports.getTyreByIdWithAvailableQuantity = (tyreId) => {
  const tyre = db
    .prepare(`
      SELECT
        t.Id,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        t.PriceValidityFrom,
        t.PriceValidityTo,
        t.PurchasedPrice,
        t.DAGCost,
        t.DiscountOffered,
        t.DiscountAmount,
        t.MRP_WithoutVAT,
        t.MRP_WithVAT,
        t.ActualSellingPrice,
        COALESCE(stock.AvailableQuantity, 0) AS AvailableQuantity,
        GROUP_CONCAT(DISTINCT s.SupplierCode) AS SupplierCodes,
        GROUP_CONCAT(DISTINCT s.Name) AS SupplierNames
      FROM TyreM t
      LEFT JOIN (
        ${AVAILABLE_STOCK_SQL}
      ) stock ON stock.TyreId = t.Id
      LEFT JOIN TyreSupplier ts ON ts.TyreId = t.Id
      LEFT JOIN SupplierM s ON s.SupplierID = ts.SupplierID
      WHERE t.Id = ?
      GROUP BY
        t.Id,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        t.PriceValidityFrom,
        t.PriceValidityTo,
        t.PurchasedPrice,
        t.DAGCost,
        t.DiscountOffered,
        t.DiscountAmount,
        t.MRP_WithoutVAT,
        t.MRP_WithVAT,
        t.ActualSellingPrice
    `)
    .get(tyreId)

  if (!tyre) {
    return null
  }

  return {
    ...tyre,
    SupplierIDs: tyreSupplierRepo.getSupplierIdsByTyreId(tyre.Id),
  }
}

exports.createTyre = (tyre) => {
  const createTyreWithSupplierLink = db.transaction((payload) => {
    const result = db
      .prepare(`
        INSERT INTO TyreM (
          Brand,
          Size,
          Pattern,
          LL_SR,
          PR,
          SideWall,
          DOT,
          PriceValidityFrom,
          PriceValidityTo,
          PurchasedPrice,
          DAGCost,
          DiscountOffered,
          DiscountAmount,
          MRP_WithoutVAT,
          MRP_WithVAT,
          ActualSellingPrice
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        payload.Brand,
        payload.Size,
        payload.Pattern,
        payload.LL_SR,
        payload.PR,
        payload.SideWall,
        payload.DOT,
        payload.PriceValidityFrom,
        payload.PriceValidityTo,
        payload.PurchasedPrice,
        payload.DAGCost,
        payload.DiscountOffered,
        payload.DiscountAmount,
        payload.MRP_WithoutVAT,
        payload.MRP_WithVAT,
        payload.ActualSellingPrice
      )

    const tyreId = result.lastInsertRowid
    tyreSupplierRepo.syncTyreSuppliers(tyreId, payload.SupplierIDs)

    return exports.getTyreById(tyreId)
  })

  return createTyreWithSupplierLink(tyre)
}

exports.updateTyre = (tyreId, tyre) => {
  const updateTyreWithSupplierLink = db.transaction((id, payload) => {
    const result = db
      .prepare(`
        UPDATE TyreM
        SET
          Brand = ?,
          Size = ?,
          Pattern = ?,
          LL_SR = ?,
          PR = ?,
          SideWall = ?,
          DOT = ?,
          PriceValidityFrom = ?,
          PriceValidityTo = ?,
          PurchasedPrice = ?,
          DAGCost = ?,
          DiscountOffered = ?,
          DiscountAmount = ?,
          MRP_WithoutVAT = ?,
          MRP_WithVAT = ?,
          ActualSellingPrice = ?
        WHERE Id = ?
      `)
      .run(
        payload.Brand,
        payload.Size,
        payload.Pattern,
        payload.LL_SR,
        payload.PR,
        payload.SideWall,
        payload.DOT,
        payload.PriceValidityFrom,
        payload.PriceValidityTo,
        payload.PurchasedPrice,
        payload.DAGCost,
        payload.DiscountOffered,
        payload.DiscountAmount,
        payload.MRP_WithoutVAT,
        payload.MRP_WithVAT,
        payload.ActualSellingPrice,
        id
      )

    if (result.changes === 0) {
      return null
    }

    tyreSupplierRepo.syncTyreSuppliers(id, payload.SupplierIDs)

    return exports.getTyreById(id)
  })

  return updateTyreWithSupplierLink(tyreId, tyre)
}

exports.getLowStockCount = (threshold) => {
  return db
    .prepare(`
      SELECT COUNT(*) AS Count
      FROM (
        SELECT t.Id, COALESCE(SUM(sm.Qty), 0) AS AvailableQty
        FROM TyreM t
        LEFT JOIN StorageManager sm ON sm.TyreId = t.Id
        GROUP BY t.Id
      )
      WHERE AvailableQty <= ?
    `)
    .get(threshold)
}

exports.getStockedTyreBatches = (cutoffYear, cutoffWeek) => {
  return db
    .prepare(`
      SELECT
        smb.Id,
        smb.StorageManagerID,
        smb.DOT,
        smb.Qty,
        smb.createdDate,
        sm.TyreId,
        sm.LocationID,
        t.Brand,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        sl.LocationName
      FROM StorageManagerBatch smb
      INNER JOIN StorageManager sm ON sm.Id = smb.StorageManagerID
      INNER JOIN TyreM t ON t.Id = sm.TyreId
      INNER JOIN StorageLocationM sl ON sl.Id = sm.LocationID
      WHERE smb.Qty > 0
        AND smb.DOT GLOB '[0-9][0-9][0-9][0-9]'
        AND CAST(SUBSTR(smb.DOT, 1, 2) AS INTEGER) BETWEEN 1 AND 53
        AND (
          CAST('20' || SUBSTR(smb.DOT, 3, 2) AS INTEGER) < ?
          OR (
            CAST('20' || SUBSTR(smb.DOT, 3, 2) AS INTEGER) = ?
            AND CAST(SUBSTR(smb.DOT, 1, 2) AS INTEGER) <= ?
          )
        )
      ORDER BY
        CAST('20' || SUBSTR(smb.DOT, -2) AS INTEGER) ASC,
        CAST(SUBSTR(smb.DOT, 1, 2) AS INTEGER) ASC,
        smb.Id ASC
    `)
    .all(cutoffYear, cutoffYear, cutoffWeek)
}

exports.deleteTyre = (tyreId) => {
  return db
    .prepare("DELETE FROM TyreM WHERE Id = ?")
    .run(tyreId)
}
