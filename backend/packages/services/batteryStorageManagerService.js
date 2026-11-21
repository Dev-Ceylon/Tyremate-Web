const db = require("../database/connection")
const batteryStorageManagerRepo = require("../repositories/batteryStorageManagerRepository")
const batteryStorageManagerBatchRepo = require("../repositories/batteryStorageManagerBatchRepository")
const batteryRepo = require("../repositories/batteryRepository")
const storageLocationRepo = require("../repositories/storageLocationRepository")
const { getStorageSourceId } = require("../constants/storageSourceConstants")

const MS_PER_DAY = 24 * 60 * 60 * 1000

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

const normalizeOptionalId = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  return normalizeId(value, fieldName)
}

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()

  return normalized === "" ? null : normalized
}

const ensureReferencesExist = (payload) => {
  const battery = batteryRepo.getBatteryById(payload.BatteryId)

  if (!battery) {
    throw new Error("Battery not found")
  }

  const storageLocation = storageLocationRepo.getStorageLocationById(payload.LocationID)

  if (!storageLocation) {
    throw new Error("Storage location not found")
  }
}

const toBatteryStorageManagerPayload = (payload = {}) => {
  const normalized = {
    BatteryId: normalizeId(payload.BatteryId, "BatteryId"),
    LocationID: normalizeId(payload.LocationID, "LocationID"),
    Qty: normalizeInteger(payload.Qty, "Qty"),
    OrderID: normalizeOptionalId(payload.OrderID, "OrderID"),
    SourceTypeId: normalizeOptionalId(payload.SourceTypeId, "SourceTypeId"),
    SourceId: normalizeOptionalId(payload.SourceId, "SourceId"),
    CreatedBy: payload.CreatedBy ?? null,
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

    const batchCode = normalizeText(batch.BatchCode)
    const mfgDate = normalizeText(batch.MfgDate)
    const expiryDate = normalizeText(batch.ExpiryDate)

    return {
      BatchCode: batchCode,
      MfgDate: mfgDate,
      ExpiryDate: expiryDate,
      Qty: qty,
    }
  })
}

const resolveCreatedBy = (ctx) => {
  const { user, changedBy } = ctx ?? {}

  return user?.displayName || user?.username || changedBy || null
}

const ensureLocationCapacityNotExceeded = ({
  locationId,
  nextQty,
  existingQtyInTargetLocation = 0,
}) => {
  const storageLocation = batteryStorageManagerRepo.getStorageLocationByIdForBatteries(locationId)

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

const calculateBatchExpiryInfo = (expiryDateStr, mfgDateStr) => {
  const today = new Date()
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  let daysLeft = null
  let expiryDate = null

  if (expiryDateStr) {
    const parsed = new Date(expiryDateStr)
    if (!Number.isNaN(parsed.getTime())) {
      const utcExpiry = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
      daysLeft = Math.floor((utcExpiry - utcToday) / MS_PER_DAY)
      expiryDate = expiryDateStr
    }
  }

  return {
    ManufactureDate: mfgDateStr || null,
    ExpiryDate: expiryDate,
    DaysLeft: daysLeft,
  }
}

exports.getBatteryStorageManagers = () => {
  return batteryStorageManagerRepo.getAllBatteryStorageManagers()
}

exports.getBatteryStorageManagersByLocationId = (locationId) => {
  const normalizedLocationId = normalizeId(locationId, "LocationID")
  const storageLocation = storageLocationRepo.getStorageLocationById(normalizedLocationId)

  if (!storageLocation) {
    throw new Error("Storage location not found")
  }

  return batteryStorageManagerRepo.getBatteryStorageManagersByLocationId(normalizedLocationId)
}

exports.getBatteryStorageManagerById = (id) => {
  const normalizedId = normalizeId(id, "Id")
  const record = batteryStorageManagerRepo.getBatteryStorageManagerById(normalizedId)

  if (!record) {
    throw new Error("Battery storage manager record not found")
  }

  return record
}

exports.getBatteryStorageManagersByBatteryId = (batteryId) => {
  const normalizedBatteryId = normalizeId(batteryId, "BatteryId")

  return batteryStorageManagerRepo.getBatteryStorageManagersByBatteryId(normalizedBatteryId)
}

exports.getBatchesByBatteryId = (batteryId) => {
  const normalizedBatteryId = normalizeId(batteryId, "BatteryId")

  return batteryStorageManagerBatchRepo
    .getBatchesByBatteryIdOrderedByExpiry(normalizedBatteryId)
    .map((batch) => ({
      ...batch,
      ...calculateBatchExpiryInfo(batch.ExpiryDate, batch.MfgDate),
    }))
}

exports.getBatchesByStorageManagerId = (id) => {
  const normalizedId = normalizeId(id, "Id")

  if (!batteryStorageManagerRepo.getBatteryStorageManagerById(normalizedId)) {
    throw new Error("Battery storage manager record not found")
  }

  return batteryStorageManagerBatchRepo
    .getBatchesByStorageManagerId(normalizedId)
    .map((batch) => ({
      ...batch,
      ...calculateBatchExpiryInfo(batch.ExpiryDate, batch.MfgDate),
    }))
}

exports.getBatchesByLocationId = (locationId) => {
  const normalizedLocationId = normalizeId(locationId, "LocationID")

  if (!storageLocationRepo.getStorageLocationById(normalizedLocationId)) {
    throw new Error("Storage location not found")
  }

  return batteryStorageManagerBatchRepo
    .getBatchesByLocationId(normalizedLocationId)
    .map((batch) => ({
      ...batch,
      ...calculateBatchExpiryInfo(batch.ExpiryDate, batch.MfgDate),
    }))
}

exports.getStorageLocationsByBranch = (branchId) => {
  const normalizedBranchId = normalizeId(branchId, "BranchId")
  return batteryStorageManagerRepo.getStorageLocationsByBranchIdForBatteries(normalizedBranchId)
}

exports.getStorageLocationById = (id) => {
  const normalizedId = normalizeId(id, "Id")
  const location = batteryStorageManagerRepo.getStorageLocationByIdForBatteries(normalizedId)

  if (!location) {
    throw new Error("Storage location not found")
  }

  return location
}

exports.createBatteryStorageManager = (payload, ctx) => {
  const batteryStorageManager = toBatteryStorageManagerPayload(payload)
  const batches = normalizeBatches(payload.batches)

  if (batches.length > 0) {
    const batchesTotal = batches.reduce((sum, b) => sum + b.Qty, 0)
    if (batchesTotal !== batteryStorageManager.Qty) {
      throw new Error("Sum of batch quantities must equal the storage lot quantity")
    }
  }

  ensureLocationCapacityNotExceeded({
    locationId: batteryStorageManager.LocationID,
    nextQty: batteryStorageManager.Qty,
  })

  const creator = resolveCreatedBy(ctx)

  const transaction = db.transaction(() => {
    const createdLot = batteryStorageManagerRepo.createBatteryStorageManager({
      ...batteryStorageManager,
      SourceTypeId: batteryStorageManager.SourceTypeId ?? getStorageSourceId("MANUAL"),
      CreatedBy: creator,
    })

    if (batches.length > 0) {
      for (const batch of batches) {
        batteryStorageManagerBatchRepo.createBatteryStorageManagerBatch({
          BatteryStorageManagerID: createdLot.Id,
          BatchCode: batch.BatchCode,
          MfgDate: batch.MfgDate,
          ExpiryDate: batch.ExpiryDate,
          Qty: batch.Qty,
          CreatedBy: creator,
        })
      }
    } else if (payload.BatchCode || payload.MfgDate || payload.ExpiryDate) {
      // Single batch specified inline with lot
      batteryStorageManagerBatchRepo.createBatteryStorageManagerBatch({
        BatteryStorageManagerID: createdLot.Id,
        BatchCode: normalizeText(payload.BatchCode),
        MfgDate: normalizeText(payload.MfgDate),
        ExpiryDate: normalizeText(payload.ExpiryDate),
        Qty: createdLot.Qty,
        CreatedBy: creator,
      })
    }

    return createdLot
  })

  return transaction()
}

exports.updateBatteryStorageManager = (id, payload, ctx) => {
  const normalizedId = normalizeId(id, "Id")
  const batteryStorageManager = toBatteryStorageManagerPayload(payload)
  const current = batteryStorageManagerRepo.getBatteryStorageManagerById(normalizedId)

  if (!current) {
    throw new Error("Battery storage manager record not found")
  }

  const existingQtyInTargetLocation =
    current.LocationID === batteryStorageManager.LocationID ? Number(current.Qty ?? 0) : 0

  ensureLocationCapacityNotExceeded({
    locationId: batteryStorageManager.LocationID,
    nextQty: batteryStorageManager.Qty,
    existingQtyInTargetLocation,
  })

  return batteryStorageManagerRepo.updateBatteryStorageManager(normalizedId, {
    ...batteryStorageManager,
    OrderID: payload.OrderID ?? null,
    CreatedBy: payload.CreatedBy ?? null,
  })
}

exports.deleteBatteryStorageManager = (id) => {
  const normalizedId = normalizeId(id, "Id")

  const deleteTransaction = db.transaction(() => {
    batteryStorageManagerBatchRepo.deleteBatchesByBatteryStorageManagerId(normalizedId)
    return batteryStorageManagerRepo.deleteBatteryStorageManager(normalizedId)
  })

  const result = deleteTransaction()

  if (result.changes === 0) {
    throw new Error("Battery storage manager record not found")
  }

  return { success: true }
}

exports.createBatch = (batteryStorageManagerId, payload, ctx) => {
  const normalizedSmId = normalizeId(batteryStorageManagerId, "BatteryStorageManagerID")
  const lot = batteryStorageManagerRepo.getBatteryStorageManagerById(normalizedSmId)

  if (!lot) {
    throw new Error("Battery storage manager record not found")
  }

  const qty = normalizeInteger(payload.Qty, "Qty")
  if (qty <= 0) {
    throw new Error("Batch Qty must be greater than 0")
  }

  const currentBatchTotal = batteryStorageManagerBatchRepo.getBatchesTotalQty(normalizedSmId)
  if (currentBatchTotal + qty > lot.Qty) {
    throw new Error("Total batch quantity cannot exceed stored battery quantity")
  }

  return batteryStorageManagerBatchRepo.createBatteryStorageManagerBatch({
    BatteryStorageManagerID: normalizedSmId,
    BatchCode: normalizeText(payload.BatchCode),
    MfgDate: normalizeText(payload.MfgDate),
    ExpiryDate: normalizeText(payload.ExpiryDate),
    Qty: qty,
    CreatedBy: resolveCreatedBy(ctx),
  })
}

exports.updateBatch = (id, payload) => {
  const normalizedId = normalizeId(id, "Id")
  const current = batteryStorageManagerBatchRepo.getBatchById(normalizedId)

  if (!current) {
    throw new Error("Batch record not found")
  }

  const lot = batteryStorageManagerRepo.getBatteryStorageManagerById(current.BatteryStorageManagerID)
  const nextQty = normalizeInteger(payload.Qty, "Qty")

  if (nextQty <= 0) {
    throw new Error("Batch Qty must be greater than 0")
  }

  const currentBatchTotal = batteryStorageManagerBatchRepo.getBatchesTotalQty(current.BatteryStorageManagerID)
  const projectedTotal = currentBatchTotal - current.Qty + nextQty

  if (projectedTotal > (lot?.Qty ?? 0)) {
    throw new Error("Total batch quantity cannot exceed stored battery quantity")
  }

  return batteryStorageManagerBatchRepo.updateBatteryStorageManagerBatch(normalizedId, {
    BatchCode: normalizeText(payload.BatchCode),
    MfgDate: normalizeText(payload.MfgDate),
    ExpiryDate: normalizeText(payload.ExpiryDate),
    Qty: nextQty,
  })
}

exports.deleteBatch = (id) => {
  const normalizedId = normalizeId(id, "Id")
  const result = batteryStorageManagerBatchRepo.deleteBatch(normalizedId)

  if (result.changes === 0) {
    throw new Error("Batch record not found")
  }

  return { success: true }
}

exports.addArrivedPOToStorage = (batteryId, locationId, qty, options = {}) => {
  const normalizedBatteryId = normalizeId(batteryId, "BatteryId")
  const normalizedLocationId = normalizeId(locationId, "LocationID")
  const normalizedQty = normalizeInteger(qty, "Qty")
  const orderId = normalizeId(options.orderId, "OrderID")
  const batches = normalizeBatches(options.batches)

  const batchesTotal = batches.reduce((sum, batch) => sum + batch.Qty, 0)

  if (batches.length > 0 && batchesTotal !== normalizedQty) {
    throw new Error("Sum of batch quantities must equal the storage lot quantity")
  }

  ensureLocationCapacityNotExceeded({
    locationId: normalizedLocationId,
    nextQty: normalizedQty,
  })

  const creator = resolveCreatedBy(options.ctx)

  const addTransaction = db.transaction(() => {
    const created = batteryStorageManagerRepo.createBatteryStorageManager({
      BatteryId: normalizedBatteryId,
      LocationID: normalizedLocationId,
      Qty: normalizedQty,
      OrderID: orderId,
      SourceTypeId: getStorageSourceId("PO"),
      SourceId: orderId,
      CreatedBy: creator,
    })

    for (const batch of batches) {
      batteryStorageManagerBatchRepo.createBatteryStorageManagerBatch({
        BatteryStorageManagerID: created.Id,
        BatchCode: batch.BatchCode,
        MfgDate: batch.MfgDate,
        ExpiryDate: batch.ExpiryDate,
        Qty: batch.Qty,
        CreatedBy: creator,
      })
    }

    return created
  })

  return addTransaction()
}

exports.restoreBatteryStockToStorage = (batteryId, qty, options = {}) => {
  const normalizedBatteryId = normalizeId(batteryId, "BatteryId")
  const normalizedQty = normalizeInteger(qty, "Qty")
  const requestedLotId = options.storageManagerId ? Number(options.storageManagerId) : null
  const requestedBatchId = options.storageManagerBatchId ? Number(options.storageManagerBatchId) : null

  let target = null

  if (requestedLotId) {
    target = batteryStorageManagerRepo.getBatteryStorageManagerById(requestedLotId)

    if (!target || target.BatteryId !== normalizedBatteryId) {
      target = batteryStorageManagerRepo.getOldestBatteryStorageManagerByBatteryId(normalizedBatteryId)
    }
  } else {
    target = batteryStorageManagerRepo.getOldestBatteryStorageManagerByBatteryId(normalizedBatteryId)
  }

  if (!target) {
    throw new Error(`No storage lot exists for BatteryId ${normalizedBatteryId} to restore stock into`)
  }

  const updated = batteryStorageManagerRepo.updateBatteryStorageManager(target.Id, {
    ...target,
    Qty: Number(target.Qty || 0) + normalizedQty,
  })

  let targetBatch = null

  if (requestedBatchId) {
    const requestedBatch = batteryStorageManagerBatchRepo.getBatchById(requestedBatchId)
    if (requestedBatch && requestedBatch.BatteryStorageManagerID === target.Id) {
      targetBatch = requestedBatch
    }
  }

  if (!targetBatch) {
    const lotBatches = batteryStorageManagerBatchRepo.getBatchesByStorageManagerIdOrderedByExpiry(target.Id)
    if (lotBatches.length > 0) {
      targetBatch = lotBatches[0]
    }
  }

  if (targetBatch) {
    batteryStorageManagerBatchRepo.updateBatteryStorageManagerBatch(targetBatch.Id, {
      ...targetBatch,
      Qty: Number(targetBatch.Qty ?? 0) + normalizedQty,
    })
  }

  return updated
}
