const db = require("../database/connection")

exports.createDeliveryLine = (line) => {
  const result = db
    .prepare(`
      INSERT INTO SODeliveryLine (
        SODeliveryID,
        SoTyreID,
        TyreID,
        SoTyreStorageAllocationID,
        StorageManagerID,
        StorageManagerBatchID,
        SoBatteryID,
        BatteryID,
        SoBatteryStorageAllocationID,
        BatteryStorageManagerID,
        BatteryStorageManagerBatchID,
        Qty,
        Amount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      line.SODeliveryID,
      line.SoTyreID ?? null,
      line.TyreID ?? null,
      line.SoTyreStorageAllocationID ?? null,
      line.StorageManagerID ?? null,
      line.StorageManagerBatchID ?? null,
      line.SoBatteryID ?? null,
      line.BatteryID ?? null,
      line.SoBatteryStorageAllocationID ?? null,
      line.BatteryStorageManagerID ?? null,
      line.BatteryStorageManagerBatchID ?? null,
      line.Qty,
      line.Amount ?? 0
    )

  return { ID: result.lastInsertRowid }
}

exports.getLinesByDeliveryId = (deliveryId) => {
  return db
    .prepare(`
      SELECT
        ID,
        SODeliveryID,
        SoTyreID,
        TyreID,
        SoTyreStorageAllocationID,
        StorageManagerID,
        StorageManagerBatchID,
        SoBatteryID,
        BatteryID,
        SoBatteryStorageAllocationID,
        BatteryStorageManagerID,
        BatteryStorageManagerBatchID,
        Qty,
        Amount
      FROM SODeliveryLine
      WHERE SODeliveryID = ?
      ORDER BY ID ASC
    `)
    .all(deliveryId)
}

// How much of each reservation has already changed hands. Keyed by the storage
// allocation so "remaining collectable" per lot/batch is exact even when the
// same product is spread across several reservations.
exports.getAllocationDeliverySummary = (soId) => {
  return db
    .prepare(`
      SELECT
        COALESCE(dl.SoTyreStorageAllocationID, dl.SoBatteryStorageAllocationID) AS AllocationID,
        dl.SoTyreID,
        dl.SoBatteryID,
        COALESCE(SUM(dl.Qty), 0) AS DeliveredQty
      FROM SODeliveryLine dl
      INNER JOIN SODelivery d ON d.ID = dl.SODeliveryID
      WHERE d.SoID = ? AND (dl.SoTyreStorageAllocationID IS NOT NULL OR dl.SoBatteryStorageAllocationID IS NOT NULL)
      GROUP BY COALESCE(dl.SoTyreStorageAllocationID, dl.SoBatteryStorageAllocationID)
    `)
    .all(soId)
}
