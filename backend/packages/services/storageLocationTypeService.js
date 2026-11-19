const storageLocationTypeRepo = require("../repositories/storageLocationTypeRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")

const ENTITY_TYPE = "Storage Location Type"

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

const normalizeStorageLocationTypeId = (id) => {
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid storage location type id is required")
  }

  return parsedId
}

const toStorageLocationTypePayload = (payload = {}) => {
  return {
    LocationTypeCode: normalizeRequiredText(payload.LocationTypeCode, "Location type code"),
    LocationTypeName: normalizeRequiredText(payload.LocationTypeName, "Location type name"),
  }
}

exports.getStorageLocationTypes = () => {
  return storageLocationTypeRepo.getAllStorageLocationTypes()
}

exports.getStorageLocationTypeById = (id) => {
  const normalizedId = normalizeStorageLocationTypeId(id)
  const storageLocationType = storageLocationTypeRepo.getStorageLocationTypeById(normalizedId)

  if (!storageLocationType) {
    throw new Error("Storage location type not found")
  }

  return storageLocationType
}

exports.createStorageLocationType = (payload, ctx) => {
  const storageLocationType = toStorageLocationTypePayload(payload)
  const existingStorageLocationType = storageLocationTypeRepo.getStorageLocationTypeByCode(storageLocationType.LocationTypeCode)

  if (existingStorageLocationType) {
    throw new Error("Location type code already exists")
  }

  const createdStorageLocationType = storageLocationTypeRepo.createStorageLocationType(storageLocationType)

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdStorageLocationType),
    after: createdStorageLocationType,
    ctx,
  })

  return createdStorageLocationType
}

exports.updateStorageLocationType = (id, payload, ctx) => {
  const normalizedId = normalizeStorageLocationTypeId(id)
  const storageLocationType = toStorageLocationTypePayload(payload)
  const before = storageLocationTypeRepo.getStorageLocationTypeById(normalizedId)
  const existingStorageLocationType = storageLocationTypeRepo.getStorageLocationTypeByCode(storageLocationType.LocationTypeCode)

  if (
    existingStorageLocationType &&
    existingStorageLocationType.Id !== normalizedId
  ) {
    throw new Error("Location type code already exists")
  }

  const updatedStorageLocationType = storageLocationTypeRepo.updateStorageLocationType(normalizedId, storageLocationType)

  if (!updatedStorageLocationType) {
    throw new Error("Storage location type not found")
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, updatedStorageLocationType),
    before,
    after: updatedStorageLocationType,
    ctx,
  })

  return updatedStorageLocationType
}

exports.deleteStorageLocationType = (id, ctx) => {
  const normalizedId = normalizeStorageLocationTypeId(id)
  const before = storageLocationTypeRepo.getStorageLocationTypeById(normalizedId)
  const result = storageLocationTypeRepo.deleteStorageLocationType(normalizedId)

  if (result.changes === 0) {
    throw new Error("Storage location type not found")
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