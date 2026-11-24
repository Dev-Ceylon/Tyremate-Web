const batteryLocationRepo = require("../repositories/batteryLocationRepository")
const branchRepo = require("../repositories/branchRepository")
const storageLocationTypeRepo = require("../repositories/storageLocationTypeRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")

const ENTITY_TYPE = "Battery Location"

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

const toBatteryLocationPayload = (payload = {}) => {
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

const normalizeBatteryLocationId = (id) => {
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid battery location id is required")
  }

  return parsedId
}

exports.getBatteryLocations = () => {
  return batteryLocationRepo.getAllBatteryLocations()
}

exports.getBatteryLocationsByBranchId = (branchId) => {
  const normalizedBranchId = normalizeOptionalId(branchId, "Branch")

  if (normalizedBranchId === null) {
    throw new Error("Branch is required")
  }

  const branch = branchRepo.getBranchById(normalizedBranchId)

  if (!branch) {
    throw new Error("Branch not found")
  }

  return batteryLocationRepo.getBatteryLocationsByBranchId(normalizedBranchId)
}

exports.getBatteryLocationById = (id) => {
  const normalizedId = normalizeBatteryLocationId(id)
  const batteryLocation = batteryLocationRepo.getBatteryLocationById(normalizedId)

  if (!batteryLocation) {
    throw new Error("Battery location not found")
  }

  return batteryLocation
}

exports.createBatteryLocation = (payload, ctx) => {
  const batteryLocation = toBatteryLocationPayload(payload)
  const existing = batteryLocationRepo.getBatteryLocationByCode(batteryLocation.LocationCode)

  if (existing) {
    throw new Error("Location code already exists")
  }

  const createdBatteryLocation = batteryLocationRepo.createBatteryLocation(batteryLocation)

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdBatteryLocation),
    after: createdBatteryLocation,
    ctx,
  })

  return createdBatteryLocation
}

exports.updateBatteryLocation = (id, payload, ctx) => {
  const normalizedId = normalizeBatteryLocationId(id)
  const batteryLocation = toBatteryLocationPayload(payload)
  const before = batteryLocationRepo.getBatteryLocationById(normalizedId)
  const existing = batteryLocationRepo.getBatteryLocationByCode(batteryLocation.LocationCode)

  if (existing && existing.Id !== normalizedId) {
    throw new Error("Location code already exists")
  }

  const updated = batteryLocationRepo.updateBatteryLocation(normalizedId, batteryLocation)

  if (!updated) {
    throw new Error("Battery location not found")
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

exports.deleteBatteryLocation = (id, ctx) => {
  const normalizedId = normalizeBatteryLocationId(id)
  const before = batteryLocationRepo.getBatteryLocationById(normalizedId)

  if (!before) {
    throw new Error("Battery location not found")
  }

  if (batteryLocationRepo.hasStock(normalizedId)) {
    throw new Error("Cannot delete battery location with existing stock")
  }

  const result = batteryLocationRepo.deleteBatteryLocation(normalizedId)

  if (result.changes === 0) {
    throw new Error("Battery location not found")
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
