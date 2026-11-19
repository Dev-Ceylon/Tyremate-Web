const consumableRepo = require("../repositories/consumableRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")

const ENTITY_TYPE = "Consumable"

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeText = (value, fieldName) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()

  if (normalized === "") {
    return null
  }

  return normalized
}

const normalizeRequiredText = (value, fieldName) => {
  const normalized = normalizeText(value, fieldName)

  if (!normalized) {
    throw new Error(`${fieldName} is required`)
  }

  return normalized
}

const normalizeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`)
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

const normalizeBooleanFlag = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 1
  }

  if (value === true || value === "true" || value === 1) {
    return 1
  }

  return 0
}

const toConsumablePayload = (payload = {}) => {
  return {
    Name: normalizeRequiredText(payload.Name, "Name"),
    Category: normalizeText(payload.Category, "Category"),
    Unit: normalizeRequiredText(payload.Unit, "Unit"),
    CostPrice: normalizeNumber(payload.CostPrice, "CostPrice"),
    ReorderLevel: normalizeInteger(payload.ReorderLevel, "ReorderLevel"),
    IsActive: normalizeBooleanFlag(payload.IsActive, "IsActive"),
  }
}

exports.getConsumables = () => {
  return consumableRepo.getAllConsumables()
}

exports.getConsumableById = (id) => {
  const normalizedId = normalizeId(id, "Id")
  const consumable = consumableRepo.getConsumableById(normalizedId)

  if (!consumable) {
    throw new Error("Consumable not found")
  }

  return consumable
}

exports.getConsumablesWithStock = () => {
  return consumableRepo.getConsumablesWithStock()
}

exports.getLowStockCount = () => {
  return consumableRepo.getLowStockCount()
}

exports.getConsumablesByCategory = (category) => {
  const normalizedCategory = normalizeRequiredText(category, "Category")
  return consumableRepo.getConsumablesByCategory(normalizedCategory)
}

exports.createConsumable = (payload, ctx) => {
  const consumable = toConsumablePayload(payload)
  const createdConsumable = consumableRepo.createConsumable(consumable)

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdConsumable),
    after: createdConsumable,
    ctx,
  })

  return createdConsumable
}

exports.updateConsumable = (id, payload, ctx) => {
  const normalizedId = normalizeId(id, "Id")
  const consumable = toConsumablePayload(payload)
  const before = consumableRepo.getConsumableById(normalizedId)
  const updated = consumableRepo.updateConsumable(normalizedId, consumable)

  if (!updated) {
    throw new Error("Consumable not found")
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

exports.deleteConsumable = (id, ctx) => {
  const normalizedId = normalizeId(id, "Id")
  const before = consumableRepo.getConsumableById(normalizedId)
  const result = consumableRepo.deleteConsumable(normalizedId)

  if (result.changes === 0) {
    throw new Error("Consumable not found")
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
