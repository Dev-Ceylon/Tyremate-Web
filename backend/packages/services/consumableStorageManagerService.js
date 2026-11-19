const consumableStorageManagerRepo = require("../repositories/consumableStorageManagerRepository")
const consumableRepo = require("../repositories/consumableRepository")
const consumableLocationRepo = require("../repositories/consumableLocationRepository")

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

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()

  return normalized === "" ? null : normalized
}

const ensureReferencesExist = (payload) => {
  const consumable = consumableRepo.getConsumableById(payload.ConsumableID)

  if (!consumable) {
    throw new Error("Consumable not found")
  }

  const location = consumableLocationRepo.getConsumableLocationById(payload.LocationID)

  if (!location) {
    throw new Error("Consumable location not found")
  }
}

const toConsumableStorageManagerPayload = (payload = {}) => {
  const normalized = {
    ConsumableID: normalizeId(payload.ConsumableID, "ConsumableID"),
    LocationID: normalizeId(payload.LocationID, "LocationID"),
    Qty: normalizeInteger(payload.Qty, "Qty"),
    BatchNumber: normalizeText(payload.BatchNumber),
    ExpiryDate: normalizeText(payload.ExpiryDate),
  }

  ensureReferencesExist(normalized)

  return normalized
}

const ensureLocationCapacityNotExceeded = ({
  locationId,
  nextQty,
  existingQtyInTargetLocation = 0
}) => {
  const location = consumableLocationRepo.getConsumableLocationById(locationId)

  if (!location) {
    throw new Error("Consumable location not found")
  }

  const capacity = Number(location.Capacity ?? 0)
  const usedCapacity = Number(location.UsedCapacity ?? 0)
  const projectedUsedCapacity = usedCapacity - existingQtyInTargetLocation + nextQty

  if (projectedUsedCapacity > capacity) {
    throw new Error("Qty exceeds consumable location capacity")
  }
}

exports.getConsumableStorageManagers = () => {
  return consumableStorageManagerRepo.getAllConsumableStorageManagers()
}

exports.getConsumableStorageManagersByLocationId = (locationId) => {
  const normalizedLocationId = normalizeId(locationId, "LocationID")
  const location = consumableLocationRepo.getConsumableLocationById(normalizedLocationId)

  if (!location) {
    throw new Error("Consumable location not found")
  }

  return consumableStorageManagerRepo.getConsumableStorageManagersByLocationId(normalizedLocationId)
}

exports.getConsumableStorageManagerById = (id) => {
  const normalizedId = normalizeId(id, "Id")
  const record = consumableStorageManagerRepo.getConsumableStorageManagerById(normalizedId)

  if (!record) {
    throw new Error("Consumable storage manager record not found")
  }

  return record
}

exports.createConsumableStorageManager = (payload) => {
  const record = toConsumableStorageManagerPayload(payload)
  const existing = consumableStorageManagerRepo.getConsumableStorageManagerByPair(
    record.ConsumableID,
    record.LocationID,
    record.BatchNumber
  )

  if (existing) {
    throw new Error("Consumable storage manager record already exists for this consumable, location, and batch")
  }

  ensureLocationCapacityNotExceeded({
    locationId: record.LocationID,
    nextQty: record.Qty
  })

  return consumableStorageManagerRepo.createConsumableStorageManager(record)
}

exports.updateConsumableStorageManager = (id, payload) => {
  const normalizedId = normalizeId(id, "Id")
  const record = toConsumableStorageManagerPayload(payload)
  const current = consumableStorageManagerRepo.getConsumableStorageManagerById(normalizedId)

  if (!current) {
    throw new Error("Consumable storage manager record not found")
  }

  const existingTarget = consumableStorageManagerRepo.getConsumableStorageManagerByPair(
    record.ConsumableID,
    record.LocationID,
    record.BatchNumber
  )

  if (existingTarget && existingTarget.Id !== normalizedId) {
    throw new Error("Consumable storage manager record already exists for this consumable, location, and batch")
  }

  const existingQtyInTargetLocation =
    current.LocationID === record.LocationID ? Number(current.Qty ?? 0) : 0

  ensureLocationCapacityNotExceeded({
    locationId: record.LocationID,
    nextQty: record.Qty,
    existingQtyInTargetLocation
  })

  return consumableStorageManagerRepo.updateConsumableStorageManager(normalizedId, record)
}

exports.deleteConsumableStorageManager = (id) => {
  const normalizedId = normalizeId(id, "Id")
  const result = consumableStorageManagerRepo.deleteConsumableStorageManager(normalizedId)

  if (result.changes === 0) {
    throw new Error("Consumable storage manager record not found")
  }

  return { success: true }
}
