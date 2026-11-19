const consumableLocationRepo = require("../repositories/consumableLocationRepository")
const branchRepo = require("../repositories/branchRepository")
const storageLocationTypeRepo = require("../repositories/storageLocationTypeRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")

const ENTITY_TYPE = "Consumable Location"

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()

  return normalized === "" ? null : normalized
}

const normalizeRequiredText = (value, fieldName) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    throw new Error(`${fieldName} is required`)
  }

  return normalized
}

const normalizeInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  const normalized = Number(value)

  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${fieldName} must be a valid non-negative integer`)
  }

  return normalized
}

const normalizeOptionalId = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const parsedId = Number(value)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsedId
}

const toConsumableLocationPayload = (payload = {}) => {
  const branchId = normalizeOptionalId(payload.BranchId, "Branch")
  const locationTypeId = normalizeOptionalId(payload.LocationTypeId, "Location type")

  if (branchId !== null) {
    const branch = branchRepo.getBranchById(branchId)

    if (!branch) {
      throw new Error("Branch not found")
    }
  }

  if (locationTypeId === null) {
    throw new Error("Location type is required")
  }

  const locationType = storageLocationTypeRepo.getStorageLocationTypeById(locationTypeId)
  if (!locationType) {
    throw new Error("Storage location type not found")
  }

  return {
    LocationCode: normalizeRequiredText(payload.LocationCode, "Location code"),
    LocationName: normalizeRequiredText(payload.LocationName, "Location name"),
    BranchId: branchId,
    LocationTypeId: locationTypeId,
    Capacity: normalizeInteger(payload.Capacity, "Capacity")
  }
}

const normalizeConsumableLocationId = (id) => {
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid consumable location id is required")
  }

  return parsedId
}

exports.getConsumableLocations = () => {
  return consumableLocationRepo.getAllConsumableLocations()
}

exports.getConsumableLocationsByBranchId = (branchId) => {
  const normalizedBranchId = normalizeOptionalId(branchId, "Branch")

  if (normalizedBranchId === null) {
    throw new Error("Branch is required")
  }

  const branch = branchRepo.getBranchById(normalizedBranchId)

  if (!branch) {
    throw new Error("Branch not found")
  }

  return consumableLocationRepo.getConsumableLocationsByBranchId(normalizedBranchId)
}

exports.getConsumableLocationById = (id) => {
  const normalizedId = normalizeConsumableLocationId(id)
  const consumableLocation = consumableLocationRepo.getConsumableLocationById(normalizedId)

  if (!consumableLocation) {
    throw new Error("Consumable location not found")
  }

  return consumableLocation
}

exports.createConsumableLocation = (payload, ctx) => {
  const consumableLocation = toConsumableLocationPayload(payload)
  const existing = consumableLocationRepo.getConsumableLocationByCode(consumableLocation.LocationCode)

  if (existing) {
    throw new Error("Location code already exists")
  }

  const createdConsumableLocation = consumableLocationRepo.createConsumableLocation(consumableLocation)

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdConsumableLocation),
    after: createdConsumableLocation,
    ctx,
  })

  return createdConsumableLocation
}

exports.updateConsumableLocation = (id, payload, ctx) => {
  const normalizedId = normalizeConsumableLocationId(id)
  const consumableLocation = toConsumableLocationPayload(payload)
  const before = consumableLocationRepo.getConsumableLocationById(normalizedId)
  const existing = consumableLocationRepo.getConsumableLocationByCode(consumableLocation.LocationCode)

  if (existing && existing.Id !== normalizedId) {
    throw new Error("Location code already exists")
  }

  const updated = consumableLocationRepo.updateConsumableLocation(normalizedId, consumableLocation)

  if (!updated) {
    throw new Error("Consumable location not found")
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, updated),
    before,
    after: updated,
    ctx,
  })

  return updated
}

exports.deleteConsumableLocation = (id, ctx) => {
  const normalizedId = normalizeConsumableLocationId(id)
  const before = consumableLocationRepo.getConsumableLocationById(normalizedId)
  const result = consumableLocationRepo.deleteConsumableLocation(normalizedId)

  if (result.changes === 0) {
    throw new Error("Consumable location not found")
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, before),
    before,
    ctx,
  })

  return { success: true }
}
