const tyreRepo = require("../repositories/tyreRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")

const LOW_STOCK_THRESHOLD = 5
const TYRE_DEFAULT_SHELF_LIFE_YEARS = 5
const TYRE_DEFAULT_EXPIRY_LEAD_DAYS = 5
const MS_PER_DAY = 24 * 60 * 60 * 1000

const ENTITY_TYPE = "Tyre"

const toWeekStart = (year, week) => {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay()
  const daysToMonday = (jan4Day + 6) % 7
  const mondayOfWeekOne = new Date(Date.UTC(year, 0, 4 - daysToMonday))
  return new Date(mondayOfWeekOne.getTime() + (week - 1) * 7 * MS_PER_DAY)
}

const decodeDot = (dot) => {
  const normalized = normalizeText(dot)

  if (!normalized || !/^\d{4}$/.test(normalized)) {
    return null
  }

  const week = Number(normalized.slice(0, 2))
  const year = 2000 + Number(normalized.slice(2, 4))

  if (week < 1 || week > 53) {
    return null
  }

  return toWeekStart(year, week)
}

const addYears = (date, years) => {
  const result = new Date(date)
  result.setUTCFullYear(result.getUTCFullYear() + years)
  return result
}

const toIsoDate = (date) => {
  return date.toISOString().slice(0, 10)
}

const toIsoWeek = (date) => {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
  const year = target.getUTCFullYear()
  const weekOneStart = new Date(Date.UTC(year, 0, 4 - (((new Date(Date.UTC(year, 0, 4))).getUTCDay() + 6) % 7)))
  const week = Math.ceil(((target.getTime() - weekOneStart.getTime()) / MS_PER_DAY + 1) / 7)

  return { year, week }
}

const subtractDays = (epochMs, days) => {
  return new Date(epochMs - days * MS_PER_DAY)
}

const subtractYears = (date, years) => {
  const result = new Date(date)
  result.setUTCFullYear(result.getUTCFullYear() - years)
  return result
}

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

const toTyrePayload = (payload = {}) => {
  const normalizedPayload = {
    Brand: normalizeText(payload.Brand),
    Size: normalizeText(payload.Size),
    Pattern: normalizeText(payload.Pattern),
    LL_SR: normalizeText(payload.LL_SR),
    PR: normalizeText(payload.PR),
    SideWall: normalizeText(payload.SideWall),
    DOT: normalizeText(payload.DOT),
    SupplierIDs: normalizeSupplierIds(payload.SupplierIDs),
    PriceValidityFrom: normalizeDate(payload.PriceValidityFrom, "Price validity from"),
    PriceValidityTo: normalizeDate(payload.PriceValidityTo, "Price validity to"),
    PurchasedPrice: normalizeReal(payload.PurchasedPrice, "Purchased price"),
    DAGCost: normalizeReal(payload.DAGCost, "DAG cost"),
    DiscountOffered: normalizeReal(payload.DiscountOffered, "Discount offered"),
    DiscountAmount: normalizeReal(payload.DiscountAmount, "Discount amount"),
    MRP_WithoutVAT: normalizeReal(payload.MRP_WithoutVAT, "MRP without VAT"),
    MRP_WithVAT: normalizeReal(payload.MRP_WithVAT, "MRP with VAT"),
    ActualSellingPrice: normalizeReal(payload.ActualSellingPrice, "Actual selling price")
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

const normalizeTyreId = (tyreId) => {
  const parsedId = Number(tyreId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid tyre id is required")
  }

  return parsedId
}

exports.getTyres = () => {
  return tyreRepo.getAllTyres()
}

exports.getTyresWithAvailableQuantity = () => {
  return tyreRepo.getAllTyresWithAvailableQuantity()
}

exports.getLowStockCount = () => {
  return tyreRepo.getLowStockCount(LOW_STOCK_THRESHOLD)
}

exports.getExpiredTyres = (options = {}) => {
  const shelfLifeYears = options.shelfLifeYears ?? TYRE_DEFAULT_SHELF_LIFE_YEARS
  const leadDays = options.leadDays ?? TYRE_DEFAULT_EXPIRY_LEAD_DAYS

  if (!Number.isInteger(shelfLifeYears) || shelfLifeYears <= 0) {
    throw new Error("Shelf life must be a positive integer number of years")
  }

  if (!Number.isInteger(leadDays) || leadDays < 0) {
    throw new Error("Expiry lead days must be a non-negative integer")
  }

  const today = new Date()
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const deadlineDate = new Date(utcToday + leadDays * MS_PER_DAY)
  const cutoffDate = subtractYears(deadlineDate, shelfLifeYears)
  const { year, week } = toIsoWeek(cutoffDate)

  const batches = tyreRepo.getStockedTyreBatches(year, week)

  return batches
    .map((batch) => {
      const manufactureDate = decodeDot(batch.DOT)
      if (!manufactureDate) return null

      const expiryDate = addYears(manufactureDate, shelfLifeYears)
      const daysLeft = Math.floor((expiryDate.getTime() - utcToday) / MS_PER_DAY)

      return {
        Id: batch.Id,
        TyreId: batch.TyreId,
        Brand: batch.Brand,
        Size: batch.Size,
        Pattern: batch.Pattern,
        LL_SR: batch.LL_SR,
        PR: batch.PR,
        SideWall: batch.SideWall,
        LocationId: batch.LocationID,
        LocationName: batch.LocationName,
        DOT: batch.DOT,
        Qty: batch.Qty,
        ManufactureDate: toIsoDate(manufactureDate),
        ExpiryDate: toIsoDate(expiryDate),
        DaysLeft: daysLeft,
      }
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.DaysLeft - b.DaysLeft)
}

exports.getBatchExpiryInfo = (dot, options = {}) => {
  const shelfLifeYears = options.shelfLifeYears ?? TYRE_DEFAULT_SHELF_LIFE_YEARS
  const manufactureDate = decodeDot(dot)

  if (!manufactureDate) {
    return null
  }

  const expiryDate = addYears(manufactureDate, shelfLifeYears)
  const today = new Date()
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const daysLeft = Math.floor((expiryDate.getTime() - utcToday) / MS_PER_DAY)

  return {
    ManufactureDate: toIsoDate(manufactureDate),
    ExpiryDate: toIsoDate(expiryDate),
    DaysLeft: daysLeft
  }
}

exports.getTyreById = (tyreId) => {
  const normalizedId = normalizeTyreId(tyreId)
  const tyre = tyreRepo.getTyreById(normalizedId)

  if (!tyre) {
    throw new Error("Tyre not found")
  }

  return tyre
}

exports.getTyreByIdWithAvailableQuantity = (tyreId) => {
  const normalizedId = normalizeTyreId(tyreId)
  const tyre = tyreRepo.getTyreByIdWithAvailableQuantity(normalizedId)

  if (!tyre) {
    throw new Error("Tyre not found")
  }

  return tyre
}

exports.createTyre = (payload, ctx) => {
  const tyre = toTyrePayload(payload)
  const createdTyre = tyreRepo.createTyre(tyre)

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdTyre),
    after: createdTyre,
    ctx,
  })

  return createdTyre
}

exports.updateTyre = (tyreId, payload, ctx) => {
  const normalizedId = normalizeTyreId(tyreId)
  const tyre = toTyrePayload(payload)
  const before = tyreRepo.getTyreById(normalizedId)
  const updatedTyre = tyreRepo.updateTyre(normalizedId, tyre)

  if (!updatedTyre) {
    throw new Error("Tyre not found")
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, updatedTyre),
    before,
    after: updatedTyre,
    ctx,
  })

  return updatedTyre
}

exports.deleteTyre = (tyreId, ctx) => {
  const normalizedId = normalizeTyreId(tyreId)
  const before = tyreRepo.getTyreById(normalizedId)
  const result = tyreRepo.deleteTyre(normalizedId)

  if (result.changes === 0) {
    throw new Error("Tyre not found")
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
