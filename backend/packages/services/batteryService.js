const batteryRepo = require("../repositories/batteryRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")

const LOW_STOCK_THRESHOLD = 5
const ENTITY_TYPE = "Battery"

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()

  return normalized === "" ? null : normalized
}

const normalizeReal = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const normalized = Number(value)

  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`)
  }

  return normalized
}

const normalizeInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const normalized = Number(value)

  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${fieldName} must be a valid non-negative integer`)
  }

  return normalized
}

const normalizeDate = (value, fieldName) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`)
  }

  return normalized
}

const normalizeSupplierIds = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized = value
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)

  return [...new Set(normalized)]
}

const toBatteryPayload = (payload = {}) => {
  const brand = normalizeText(payload.Brand)
  const model = normalizeText(payload.Model)
  const capacity = normalizeText(payload.Capacity)

  if (!brand) {
    throw new Error("Battery brand is required")
  }

  if (!model) {
    throw new Error("Battery model is required")
  }

  if (!capacity) {
    throw new Error("Battery capacity is required")
  }

  const normalizedPayload = {
    Brand: brand,
    Model: model,
    Series: normalizeText(payload.Series),
    Voltage: normalizeText(payload.Voltage) || "12V",
    Capacity: capacity,
    Technology: normalizeText(payload.Technology),
    Application: normalizeText(payload.Application) || "Motorcycle",
    WarrantyMonths: normalizeInteger(payload.WarrantyMonths, "Warranty months") ?? 12,
    BatchCode: normalizeText(payload.BatchCode),
    SupplierIDs: normalizeSupplierIds(payload.SupplierIDs),
    PriceValidityFrom: normalizeDate(payload.PriceValidityFrom, "Price validity from"),
    PriceValidityTo: normalizeDate(payload.PriceValidityTo, "Price validity to"),
    PurchasedPrice: normalizeReal(payload.PurchasedPrice, "Purchased price") ?? 0,
    DiscountOffered: normalizeReal(payload.DiscountOffered, "Discount offered") ?? 0,
    DiscountAmount: normalizeReal(payload.DiscountAmount, "Discount amount") ?? 0,
    MRP_WithoutVAT: normalizeReal(payload.MRP_WithoutVAT, "MRP without VAT") ?? 0,
    MRP_WithVAT: normalizeReal(payload.MRP_WithVAT, "MRP with VAT") ?? 0,
    ActualSellingPrice: normalizeReal(payload.ActualSellingPrice, "Actual selling price") ?? 0,
  }

  if (
    normalizedPayload.PriceValidityFrom &&
    normalizedPayload.PriceValidityTo &&
    normalizedPayload.PriceValidityFrom > normalizedPayload.PriceValidityTo
  ) {
    throw new Error("Price validity from date cannot be after price validity to date")
  }

  if (
    normalizedPayload.DiscountOffered !== null &&
    normalizedPayload.DiscountOffered > 100
  ) {
    throw new Error("Discount offered cannot exceed 100%")
  }

  return normalizedPayload
}

const normalizeBatteryId = (batteryId) => {
  const parsedId = Number(batteryId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid battery id is required")
  }

  return parsedId
}

exports.getBatteries = () => {
  return batteryRepo.getAllBatteries()
}

exports.getBatteriesWithAvailableQuantity = () => {
  return batteryRepo.getAllBatteriesWithAvailableQuantity()
}

exports.getLowStockCount = () => {
  return batteryRepo.getLowStockCount(LOW_STOCK_THRESHOLD)
}

exports.getBatteryById = (batteryId) => {
  const normalizedId = normalizeBatteryId(batteryId)
  const battery = batteryRepo.getBatteryById(normalizedId)

  if (!battery) {
    throw new Error("Battery not found")
  }

  return battery
}

exports.getBatteryByIdWithAvailableQuantity = (batteryId) => {
  const normalizedId = normalizeBatteryId(batteryId)
  const battery = batteryRepo.getBatteryByIdWithAvailableQuantity(normalizedId)

  if (!battery) {
    throw new Error("Battery not found")
  }

  return battery
}

exports.createBattery = (payload, ctx) => {
  const battery = toBatteryPayload(payload)
  const createdBattery = batteryRepo.createBattery(battery)

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdBattery),
    after: createdBattery,
    ctx,
  })

  return createdBattery
}

exports.updateBattery = (batteryId, payload, ctx) => {
  const normalizedId = normalizeBatteryId(batteryId)
  const battery = toBatteryPayload(payload)
  const before = batteryRepo.getBatteryById(normalizedId)
  const updatedBattery = batteryRepo.updateBattery(normalizedId, battery)

  if (!updatedBattery) {
    throw new Error("Battery not found")
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, updatedBattery),
    before,
    after: updatedBattery,
    ctx,
  })

  return updatedBattery
}

exports.deleteBattery = (batteryId, ctx) => {
  const normalizedId = normalizeBatteryId(batteryId)
  const before = batteryRepo.getBatteryById(normalizedId)
  const result = batteryRepo.deleteBattery(normalizedId)

  if (result.changes === 0) {
    throw new Error("Battery not found")
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
