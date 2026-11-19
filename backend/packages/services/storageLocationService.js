const storageLocationRepo = require("../repositories/storageLocationRepository")
const branchRepo = require("../repositories/branchRepository")
const storageLocationTypeRepo = require("../repositories/storageLocationTypeRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")

const ENTITY_TYPE = "Storage Location"

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

const toStorageLocationPayload = (payload = {}) => {
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

const normalizeStorageLocationId = (id) => {
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid storage location id is required")
  }

  return parsedId
}

exports.getStorageLocations = () => {
  return storageLocationRepo.getAllStorageLocations()
}

exports.getStorageLocationsByBranchId = (branchId) => {
  const normalizedBranchId = normalizeOptionalId(branchId, "Branch")

  if (normalizedBranchId === null) {
    throw new Error("Branch is required")
  }

  const branch = branchRepo.getBranchById(normalizedBranchId)

  if (!branch) {
    throw new Error("Branch not found")
  }

  return storageLocationRepo.getStorageLocationsByBranchId(normalizedBranchId)
}

exports.getStorageLocationsByLocationTypeId = (locationTypeId) => {
  const normalizedTypeId = normalizeOptionalId(locationTypeId, "Location type")

  if (normalizedTypeId === null) {
    throw new Error("Location type is required")
  }

  const locationType = storageLocationTypeRepo.getStorageLocationTypeById(normalizedTypeId)

  if (!locationType) {
    throw new Error("Storage location type not found")
  }

  return storageLocationRepo.getStorageLocationsByLocationTypeId(normalizedTypeId)
}

exports.getStorageLocationById = (id) => {
  const normalizedId = normalizeStorageLocationId(id)
  const storageLocation = storageLocationRepo.getStorageLocationById(normalizedId)

  if (!storageLocation) {
    throw new Error("Storage location not found")
  }

  return storageLocation
}

exports.createStorageLocation = (payload, ctx) => {
  const storageLocation = toStorageLocationPayload(payload)
  const existingStorageLocation = storageLocationRepo.getStorageLocationByCode(storageLocation.LocationCode)

  if (existingStorageLocation) {
    throw new Error("Location code already exists")
  }

  const createdStorageLocation = storageLocationRepo.createStorageLocation(storageLocation)

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdStorageLocation),
    after: createdStorageLocation,
    ctx,
  })

  return createdStorageLocation
}

exports.updateStorageLocation = (id, payload, ctx) => {
  const normalizedId = normalizeStorageLocationId(id)
  const storageLocation = toStorageLocationPayload(payload)
  const before = storageLocationRepo.getStorageLocationById(normalizedId)
  const existingStorageLocation = storageLocationRepo.getStorageLocationByCode(storageLocation.LocationCode)

  if (
    existingStorageLocation &&
    existingStorageLocation.Id !== normalizedId
  ) {
    throw new Error("Location code already exists")
  }

  const updatedStorageLocation = storageLocationRepo.updateStorageLocation(normalizedId, storageLocation)

  if (!updatedStorageLocation) {
    throw new Error("Storage location not found")
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, updatedStorageLocation),
    before,
    after: updatedStorageLocation,
    ctx,
  })

  return updatedStorageLocation
}

exports.deleteStorageLocation = (id, ctx) => {
  const normalizedId = normalizeStorageLocationId(id)
  const before = storageLocationRepo.getStorageLocationById(normalizedId)
  const result = storageLocationRepo.deleteStorageLocation(normalizedId)

  if (result.changes === 0) {
    throw new Error("Storage location not found")
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
