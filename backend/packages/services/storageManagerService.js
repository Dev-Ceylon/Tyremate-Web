const db = require("../database/connection")
const storageManagerRepo = require("../repositories/storageManagerRepository")
const storageManagerBatchRepo = require("../repositories/storageManagerBatchRepository")
const tyreRepo = require("../repositories/tyreRepository")
const storageLocationRepo = require("../repositories/storageLocationRepository")
const tyreService = require("./tyreService")
const { getStorageSourceId } = require("../constants/storageSourceConstants")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative integer`)
  }

  return parsed
}

const ensureReferencesExist = (payload) => {
  const tyre = tyreRepo.getTyreById(payload.TyreId)

  if (!tyre) {
    throw new Error("Tyre not found")
  }

  const storageLocation = storageLocationRepo.getStorageLocationById(payload.LocationID)

  if (!storageLocation) {
    throw new Error("Storage location not found")
  }
}

const normalizeOptionalId = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  return normalizeId(value, fieldName)
}

const toStorageManagerPayload = (payload = {}) => {
  const normalized = {
    TyreId: normalizeId(payload.TyreId, "TyreId"),
    LocationID: normalizeId(payload.LocationID, "LocationID"),
    Qty: normalizeInteger(payload.Qty, "Qty"),
    OrderID: normalizeOptionalId(payload.OrderID, "OrderID"),
    SourceTypeId: normalizeOptionalId(payload.SourceTypeId, "SourceTypeId"),
    SourceId: normalizeOptionalId(payload.SourceId, "SourceId"),
    CreatedBy: payload.CreatedBy ?? null
  }

  ensureReferencesExist(normalized)

  return normalized
}

const normalizeBatches = (batches) => {
  if (batches === undefined || batches === null) {
    return []
  }

  if (!Array.isArray(batches)) {
    throw new Error("Batches must be an array")
  }

  return batches.map((batch, index) => {
    const qty = normalizeInteger(batch.Qty, `Batches[${index}].Qty`)

    if (qty <= 0) {
      throw new Error(`Batches[${index}].Qty must be greater than 0`)
    }

    const dot =
      batch.DOT === undefined || batch.DOT === null
        ? null
        : String(batch.DOT).trim() || null

    return { DOT: dot, Qty: qty }
  })
}

const resolveCreatedBy = (ctx) => {
  const { user, changedBy } = ctx ?? {}

  return user?.displayName || user?.username || changedBy || null
}

const ensureLocationCapacityNotExceeded = ({
  locationId,
  nextQty,
  existingQtyInTargetLocation = 0
}) => {
  const storageLocation = storageLocationRepo.getStorageLocationById(locationId)

  if (!storageLocation) {
    throw new Error("Storage location not found")
  }

  const capacity = Number(storageLocation.Capacity ?? 0)
  const usedCapacity = Number(storageLocation.UsedCapacity ?? 0)
  const projectedUsedCapacity = usedCapacity - existingQtyInTargetLocation + nextQty

  if (projectedUsedCapacity > capacity) {
    throw new Error("Qty exceeds storage location capacity")
  }
}

exports.getStorageManagers = () => {
  return storageManagerRepo.getAllStorageManagers()
}

exports.getStorageManagersByLocationId = (locationId) => {
  const normalizedLocationId = normalizeId(locationId, "LocationID")
  const storageLocation = storageLocationRepo.getStorageLocationById(normalizedLocationId)

  if (!storageLocation) {
    throw new Error("Storage location not found")
  }

  return storageManagerRepo.getStorageManagersByLocationId(normalizedLocationId)
}

exports.getStorageManagerById = (id) => {
  const normalizedId = normalizeId(id, "Id")
  const storageManager = storageManagerRepo.getStorageManagerById(normalizedId)

  if (!storageManager) {
    throw new Error("Storage manager record not found")
  }

  return storageManager
}

exports.getStorageManagersByTyreId = (tyreId) => {
  const normalizedTyreId = normalizeId(tyreId, "TyreId")

  return storageManagerRepo.getStorageManagersByTyreId(normalizedTyreId)
}

exports.getBatchesByTyreId = (tyreId) => {
  const normalizedTyreId = normalizeId(tyreId, "TyreId")

  return storageManagerBatchRepo.getBatchesByTyreIdOrderedByDOT(normalizedTyreId)
}

exports.getBatchesByStorageManagerId = (id) => {
  const normalizedId = normalizeId(id, "Id")

  if (!storageManagerRepo.getStorageManagerById(normalizedId)) {
    throw new Error("Storage manager record not found")
  }

  return storageManagerBatchRepo.getBatchesByStorageManagerId(normalizedId)
}

exports.getBatchesByLocationId = (locationId) => {
  const normalizedLocationId = normalizeId(locationId, "LocationID")

  if (!storageLocationRepo.getStorageLocationById(normalizedLocationId)) {
    throw new Error("Storage location not found")
  }

  return storageManagerBatchRepo
    .getBatchesByLocationId(normalizedLocationId)
    .map((batch) => ({
      ...batch,
      ...(tyreService.getBatchExpiryInfo(batch.DOT) || {})
    }))
}

exports.createStorageManager = (payload, ctx) => {
  const storageManager = toStorageManagerPayload(payload)

  ensureLocationCapacityNotExceeded({
    locationId: storageManager.LocationID,
    nextQty: storageManager.Qty
  })

  return storageManagerRepo.createStorageManager({
    ...storageManager,
    // Lots created through this path are hand-entered from the storage manager
    // screen unless the caller explicitly identifies another origin.
    SourceTypeId: storageManager.SourceTypeId ?? getStorageSourceId("MANUAL"),
    CreatedBy: resolveCreatedBy(ctx)
  })
}

/**
 * Records a stock lot created by an internal movement (for example a DAG
 * arriving back into its branch's quarantine location). Unlike
 * createStorageManager this deliberately bypasses the capacity check: the move
 * is not a user action the operator could otherwise complete, and refusing it
 * would strand stock with no valid alternative. SourceTypeId is mandatory so
 * the lot's origin is always explicit; SourceId points at the originating
 * record (DAG id, PO id) and is optional for hand-entered stock.
 */
exports.addInternalStorageLot = ({ tyreId, locationId, qty, sourceTypeId, sourceId, batch }) => {
  const normalizedTyreId = normalizeId(tyreId, "TyreId")
  const normalizedLocationId = normalizeId(locationId, "LocationID")
  const normalizedQty = normalizeInteger(qty, "Qty")
  const normalizedSourceTypeId = normalizeId(sourceTypeId, "SourceTypeId")

  if (normalizedQty <= 0) {
    throw new Error("Qty must be greater than 0")
  }

  if (!tyreRepo.getTyreById(normalizedTyreId)) {
    throw new Error("Tyre not found")
  }

  if (!storageLocationRepo.getStorageLocationById(normalizedLocationId)) {
    throw new Error("Storage location not found")
  }

  const normalizedBatch = batch ? {
    DOT: batch.DOT === undefined || batch.DOT === null ? null : String(batch.DOT).trim() || null,
    Qty: normalizeInteger(batch.Qty, "Batch.Qty"),
  } : null

  if (normalizedBatch && normalizedBatch.Qty !== normalizedQty) {
    throw new Error("Internal stock batch quantity must equal the stock lot quantity")
  }

  const addTransaction = db.transaction(() => {
    const lot = storageManagerRepo.createStorageManager({
      TyreId: normalizedTyreId,
      LocationID: normalizedLocationId,
      Qty: normalizedQty,
      OrderID: null,
      SourceTypeId: normalizedSourceTypeId,
      SourceId: normalizeOptionalId(sourceId, "SourceId"),
      CreatedBy: null
    })
    const createdBatch = normalizedBatch
      ? storageManagerBatchRepo.createStorageManagerBatch({
        StorageManagerID: lot.Id,
        DOT: normalizedBatch.DOT,
        Qty: normalizedBatch.Qty,
      })
      : null

    return { ...lot, StorageManagerBatch: createdBatch }
  })

  return addTransaction()
}

exports.addArrivedPOToStorage = (tyreId, locationId, qty, options = {}) => {
  const normalizedTyreId = normalizeId(tyreId, "TyreId")
  const normalizedLocationId = normalizeId(locationId, "LocationID")
  const normalizedQty = normalizeInteger(qty, "Qty")
  const orderId = normalizeId(options.orderId, "OrderID")
  const batches = normalizeBatches(options.batches)

  const batchesTotal = batches.reduce((sum, batch) => sum + batch.Qty, 0)

  if (batches.length > 0 && batchesTotal !== normalizedQty) {
    throw new Error("Sum of batch quantities must equal the storage lot quantity")
  }

  const storageManager = {
    TyreId: normalizedTyreId,
    LocationID: normalizedLocationId,
    Qty: normalizedQty,
    SourceTypeId: getStorageSourceId("PO"),
    SourceId: orderId
  }

  ensureLocationCapacityNotExceeded({
    locationId: normalizedLocationId,
    nextQty: normalizedQty
  })

  const addTransaction = db.transaction(() => {
    const created = storageManagerRepo.createStorageManager({
      ...storageManager,
      OrderID: orderId,
      CreatedBy: resolveCreatedBy(options.ctx)
    })

    for (const batch of batches) {
      storageManagerBatchRepo.createStorageManagerBatch({
        StorageManagerID: created.Id,
        DOT: batch.DOT,
        Qty: batch.Qty,
        CreatedBy: resolveCreatedBy(options.ctx)
      })
    }

    return created
  })

  return addTransaction()
}

exports.updateStorageManager = (id, payload, ctx) => {
  const normalizedId = normalizeId(id, "Id")
  const storageManager = toStorageManagerPayload(payload)
  const current = storageManagerRepo.getStorageManagerById(normalizedId)

  if (!current) {
    throw new Error("Storage manager record not found")
  }

  const existingQtyInTargetLocation =
    current.LocationID === storageManager.LocationID ? Number(current.Qty ?? 0) : 0

  ensureLocationCapacityNotExceeded({
    locationId: storageManager.LocationID,
    nextQty: storageManager.Qty,
    existingQtyInTargetLocation
  })

  return storageManagerRepo.updateStorageManager(normalizedId, {
    ...storageManager,
    OrderID: payload.OrderID ?? null,
    CreatedBy: payload.CreatedBy ?? null
  })
}

exports.deleteStorageManager = (id) => {
  const normalizedId = normalizeId(id, "Id")

  const deleteTransaction = db.transaction(() => {
    storageManagerBatchRepo.deleteBatchesByStorageManagerId(normalizedId)

    return storageManagerRepo.deleteStorageManager(normalizedId)
  })

  const result = deleteTransaction()

  if (result.changes === 0) {
    throw new Error("Storage manager record not found")
  }

  return { success: true }
}

exports.restoreTyreStockToStorage = (tyreId, qty, options = {}) => {
  const normalizedTyreId = normalizeId(tyreId, "TyreId")
  const normalizedQty = normalizeInteger(qty, "Qty")
  const requestedLotId = options.storageManagerId ? Number(options.storageManagerId) : null
  const requestedBatchId = options.storageManagerBatchId ? Number(options.storageManagerBatchId) : null

  let target = null

  if (requestedLotId) {
    // Restore into the lot the stock was originally drained from when known.
    target = storageManagerRepo.getStorageManagerById(requestedLotId)

    if (!target || target.TyreId !== normalizedTyreId) {
      target = storageManagerRepo.getOldestStorageManagerByTyreId(normalizedTyreId)
    }
  } else {
    target = storageManagerRepo.getOldestStorageManagerByTyreId(normalizedTyreId)
  }

  if (!target) {
    throw new Error(`No storage lot exists for TyreId ${normalizedTyreId} to restore stock into`)
  }

  const updated = storageManagerRepo.updateStorageManager(target.Id, {
    ...target,
    Qty: Number(target.Qty || 0) + normalizedQty
  })

  // Keep the batch ledger in sync: restore into the exact batch the stock was
  // drained from when known, otherwise the lot's oldest DOT batch.
  let targetBatch = null

  if (requestedBatchId) {
    const requestedBatch = storageManagerBatchRepo.getBatchById(requestedBatchId)
    if (requestedBatch && requestedBatch.StorageManagerID === target.Id) {
      targetBatch = requestedBatch
    }
  }

  if (!targetBatch) {
    const lotBatches = storageManagerBatchRepo.getBatchesByStorageManagerIdOrderedByDOT(target.Id)
    if (lotBatches.length > 0) {
      targetBatch = lotBatches[0]
    }
  }

  if (targetBatch) {
    storageManagerBatchRepo.updateStorageManagerBatch(targetBatch.Id, {
      DOT: targetBatch.DOT,
      Qty: Number(targetBatch.Qty ?? 0) + normalizedQty,
    })
  }

  return updated
}
