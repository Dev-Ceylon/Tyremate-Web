const db = require("../database/connection")

exports.createDelivery = (delivery) => {
  const result = db
    .prepare(`
      INSERT INTO SODelivery (
        SoID,
        DeliveryDate,
        DeliveredBy,
        Notes,
        GatePassNo
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      delivery.SoID,
      delivery.DeliveryDate,
      delivery.DeliveredBy ?? null,
      delivery.Notes ?? null,
      delivery.GatePassNo ?? null
    )

  return exports.getDeliveryById(result.lastInsertRowid)
}

exports.getDeliveryById = (id) => {
  return db
    .prepare(`
      SELECT
        d.ID,
        d.SoID,
        d.DeliveryDate,
        d.DeliveredBy,
        d.Notes,
        d.GatePassNo,
        d.GatePassIssuedAt,
        d.GatePassIssuedBy,
        d.GatePassPaymentOverride,
        d.GatePassPaymentOverrideShortfall,
        d.CreatedDateTime
      FROM SODelivery d
      WHERE d.ID = ?
    `)
    .get(id)
}

exports.setGatePassNo = (id, gatePassNo, issuedBy = null, paymentOverride = false, overrideShortfall = 0) => {
  db.prepare(`
    UPDATE SODelivery
    SET GatePassNo = ?,
        GatePassIssuedAt = datetime('now', 'localtime'),
        GatePassIssuedBy = ?,
        GatePassPaymentOverride = ?,
        GatePassPaymentOverrideShortfall = ?
    WHERE ID = ? AND (GatePassNo IS NULL OR TRIM(GatePassNo) = '')
  `).run(gatePassNo, issuedBy, paymentOverride ? 1 : 0, paymentOverride ? overrideShortfall : 0, id)
  return exports.getDeliveryById(id)
}

exports.getSOGatePassDeliveries = () => {
  return db.prepare(`
    SELECT d.ID, d.SoID, d.DeliveryDate, d.GatePassNo, d.GatePassIssuedAt, d.GatePassIssuedBy, d.GatePassPaymentOverride, d.GatePassPaymentOverrideShortfall,
      d.Notes, d.CreatedDateTime, COALESCE(SUM(dl.Qty), 0) AS TotalQty
    FROM SODelivery d
    LEFT JOIN SODeliveryLine dl ON dl.SODeliveryID = d.ID
    WHERE d.GatePassNo IS NOT NULL AND TRIM(d.GatePassNo) <> ''
    GROUP BY d.ID
    ORDER BY d.ID DESC
  `).all()
}

// Deliveries that were handed over without a gate pass. These are the ones the
// warehouse must not release, so they need to be visible at the gate.
exports.getPendingGatePassDeliveries = () => {
  return db.prepare(`
    SELECT d.ID, d.SoID, d.DeliveryDate, d.GatePassNo, d.GatePassIssuedAt, d.GatePassIssuedBy, d.GatePassPaymentOverride, d.GatePassPaymentOverrideShortfall,
      d.Notes, d.CreatedDateTime, COALESCE(SUM(dl.Qty), 0) AS TotalQty
    FROM SODelivery d
    LEFT JOIN SODeliveryLine dl ON dl.SODeliveryID = d.ID
    WHERE d.GatePassNo IS NULL OR TRIM(d.GatePassNo) = ''
    GROUP BY d.ID
    ORDER BY d.ID DESC
  `).all()
}

exports.getDeliveriesBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        d.ID,
        d.SoID,
        d.DeliveryDate,
        d.DeliveredBy,
        d.Notes,
        d.GatePassNo,
        d.GatePassIssuedAt,
        d.GatePassIssuedBy,
        d.GatePassPaymentOverride,
        d.GatePassPaymentOverrideShortfall,
        d.CreatedDateTime,
        COALESCE(SUM(dl.Qty), 0) AS TotalQty
      FROM SODelivery d
      LEFT JOIN SODeliveryLine dl ON dl.SODeliveryID = d.ID
      WHERE d.SoID = ?
      GROUP BY d.ID
      ORDER BY d.ID DESC
    `)
    .all(soId)
}

exports.getDeliveriesWithLinesBySoId = (soId) => {
  const deliveries = exports.getDeliveriesBySoId(soId)

  if (deliveries.length === 0) return []

  return deliveries.map((delivery) => ({
    ...delivery,
    Lines: getDeliveryLines(delivery.ID),
  }))
}

exports.getDeliveryWithLinesById = (id) => {
  const delivery = exports.getDeliveryById(id)

  if (!delivery) return null

  return {
    ...delivery,
    Lines: getDeliveryLines(id),
  }
}

const getDeliveryLines = (deliveryId) => {
  return db
    .prepare(`
      SELECT
        dl.ID,
        dl.SODeliveryID,
        dl.SoTyreID,
        dl.TyreID,
        dl.SoTyreStorageAllocationID,
        dl.StorageManagerID,
        dl.StorageManagerBatchID,
        dl.Qty,
        dl.Amount,
        t.Brand,
        t.Size,
        t.Pattern,
        sl.Id AS LocationID,
        sl.LocationName,
        sl.LocationCode,
        smb.DOT
      FROM SODeliveryLine dl
      INNER JOIN TyreM t ON t.Id = dl.TyreID
      LEFT JOIN StorageManager sm ON sm.Id = dl.StorageManagerID
      LEFT JOIN StorageLocationM sl ON sl.Id = sm.LocationID
      LEFT JOIN StorageManagerBatch smb ON smb.Id = dl.StorageManagerBatchID
      WHERE dl.SODeliveryID = ?
      ORDER BY dl.ID ASC
    `)
    .all(deliveryId)
}

exports.deleteDelivery = (id) => {
  return db
    .prepare("DELETE FROM SODelivery WHERE ID = ?")
    .run(id)
}
