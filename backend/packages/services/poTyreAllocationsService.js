const poTyreAllocationsRepo = require("../repositories/poTyreAllocationsRepository")
const poRepo = require("../repositories/poRepository")
const poTyresRepo = require("../repositories/poTyresRepository")
const storageLocationRepo = require("../repositories/storageLocationRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const assertPOExists = (poId) => {
  const po = poRepo.getPOById(poId)
  if (!po) {
    throw new Error("Purchase Order not found")
  }
}

const assertPoTyresExists = (poTyresId) => {
  // Note: POTyres table has ID. Assuming standard existence check logic
  // derived from the linked PO ID for safety if a direct getById isn't present,
  // but generally repos in this project follow a getById pattern.
  const tyres = poTyresRepo.getAllPoTyres()
  const exists = tyres.some(t => t.ID === poTyresId)
  if (!exists) {
    throw new Error("Purchase Order Tyre line item not found")
  }
}

const assertLocationExists = (locationId) => {
  const location = storageLocationRepo.getStorageLocationById(locationId)
  if (!location) {
    throw new Error("Storage Location not found")
  }
}

const toAllocationPayload = (payload = {}) => {
  const normalized = {
    POID: normalizeId(payload.POID, "POID"),
    PoTyresID: normalizeId(payload.PoTyresID, "PoTyresID"),
    LocationId: normalizeId(payload.LocationId, "LocationId"),
  }

  assertPOExists(normalized.POID)
  assertPoTyresExists(normalized.PoTyresID)
  assertLocationExists(normalized.LocationId)

  return normalized
}

exports.getPoTyreAllocations = () => {
  return poTyreAllocationsRepo.getAllAllocations()
}

exports.getPoTyreAllocationById = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const allocation = poTyreAllocationsRepo.getAllocationById(normalizedId)

  if (!allocation) {
    throw new Error("Allocation record not found")
  }

  return allocation
}

exports.getPoTyreAllocationsByPoId = (poId) => {
  const normalizedPoId = normalizeId(poId, "POID")
  return poTyreAllocationsRepo.getAllocationsByPoId(normalizedPoId)
}

exports.getPoTyreAllocationsByPoTyresId = (poTyresId) => {
  const normalizedPoTyresId = normalizeId(poTyresId, "PoTyresID")
  return poTyreAllocationsRepo.getAllocationsByPoTyresId(normalizedPoTyresId)
}

exports.createPoTyreAllocation = (payload) => {
  const validatedPayload = toAllocationPayload(payload)
  return poTyreAllocationsRepo.createAllocation(validatedPayload)
}

exports.updatePoTyreAllocation = (id, payload) => {
  const normalizedId = normalizeId(id, "ID")

  const existing = poTyreAllocationsRepo.getAllocationById(normalizedId)
  if (!existing) {
    throw new Error("Allocation record not found")
  }

  const validatedPayload = toAllocationPayload(payload)
  const updated = poTyreAllocationsRepo.updateAllocation(normalizedId, validatedPayload)

  if (!updated) {
    throw new Error("Failed to update allocation record")
  }

  return updated
}

exports.deletePoTyreAllocation = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const result = poTyreAllocationsRepo.deleteAllocation(normalizedId)

  if (result.changes === 0) {
    throw new Error("Allocation record not found")
  }

  return { success: true }
}