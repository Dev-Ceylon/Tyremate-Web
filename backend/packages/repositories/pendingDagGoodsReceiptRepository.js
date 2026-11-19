const db = require("../database/connection")

/**
 * Lists DAG stock sitting in a quarantine ("q-tine") location and therefore
 * awaiting a goods receipt. Each row is a StorageManager lot whose source is a
 * DAG; the destination is the storage location assigned to the originating DAG
 * tyre line (DAGTyres.StorageLocationID) reached through the DagTyreStorage
 * link, or NULL when that link/location is missing so the UI can block the
 * receipt.
 */
exports.getPendingDagGoodsReceipts = () => {
  return db
    .prepare(`
      SELECT
        sm.Id AS SourceStorageManagerID,
        sm.TyreId AS TyreID,
        sm.Qty AS PendingQty,
        sm.SourceId AS DAGID,
        sm.LocationID AS QuarantineLocationID,
        qsl.LocationName AS QuarantineLocationName,
        qsl.LocationCode AS QuarantineLocationCode,
        qsl.BranchId AS BranchId,
        d.Date AS DAGDate,
        d.DeliveryDate AS DAGDeliveryDate,
        c.CustomerCode,
        c.Name AS CustomerName,
        t.Brand,
        t.Size,
        t.Pattern,
        dl.Id AS DestinationLocationId,
        dl.LocationCode AS DestinationLocationCode,
        dl.LocationName AS DestinationLocationName
      FROM StorageManager sm
      INNER JOIN StorageLocationM qsl ON qsl.Id = sm.LocationID
      INNER JOIN StorageLocationTypeM qlt ON qlt.Id = qsl.LocationTypeId
      INNER JOIN StorageSourceM ss ON ss.Id = sm.SourceTypeId
      INNER JOIN TyreM t ON t.Id = sm.TyreId
      LEFT JOIN DAG d ON d.ID = sm.SourceId
      LEFT JOIN CustomerM c ON c.CustomerID = d.CustomerID
      LEFT JOIN StorageLocationM dl ON dl.Id = (
        SELECT dt.StorageLocationID
        FROM DagTyreStorage ds
        INNER JOIN DAGTyres dt ON dt.ID = ds.DAGTyresID
        WHERE ds.StorageManagerID = sm.Id
        ORDER BY ds.ID ASC
        LIMIT 1
      )
      WHERE LOWER(qlt.LocationTypeCode) = 'q-tine'
        AND LOWER(ss.SourceCode) = 'dag'
        AND sm.Qty > 0
      ORDER BY sm.Id DESC
    `)
    .all()
}
