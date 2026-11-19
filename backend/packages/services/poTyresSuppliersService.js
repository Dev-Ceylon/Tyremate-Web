const db = require("../database/connection")
const poTyresSuppliersRepo = require("../repositories/poTyresSuppliersRepository")
const poTyresRepo = require("../repositories/poTyresRepository")
const poTyresService = require("./poTyresService")
const poAuditLogService = require("./poAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")
const { STATUS_CODES } = require("../constants/statusConstants")

const normalizeDateValue = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const normalized = String(value).trim()
  if (!normalized) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`)
  }

  return normalized
}

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }
  return parsed
}

const normalizeInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 1
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative integer`)
  }
  return parsed
}

const normalizeBooleanFlag = (value, fieldName, defaultValue = 0) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue
  }

  if (value === true || value === "true") {
    return 1
  }

  if (value === false || value === "false") {
    return 0
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || (parsed !== 0 && parsed !== 1 && parsed !== 2 && parsed !== null)) {
    throw new Error(`${fieldName} must be 0, 1, 2 or null`)
  }

  return parsed
}

const toPoTyresSupplierPayload = (payload = {}) => {
  return {
    PoTyresID: normalizeId(payload.PoTyresID, "PoTyresID"),
    Qty: normalizeInteger(payload.Qty, "Qty"),
    SupplierID: normalizeId(payload.SupplierID, "SupplierID"),
    IsApproved: normalizeBooleanFlag(payload.IsApproved, "IsApproved", null),
    ExpectedDeliveryDate: normalizeDateValue(payload.ExpectedDeliveryDate, "ExpectedDeliveryDate"),
    ActualDeliveryDate: normalizeDateValue(payload.ActualDeliveryDate, "ActualDeliveryDate"),
  }
}

exports.getPoTyresSuppliers = () => {
  return poTyresSuppliersRepo.getAllPoTyresSuppliers()
}

exports.getPoTyresSupplierById = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const row = poTyresSuppliersRepo.getPoTyresSupplierById(normalizedId)
  if (!row) {
    throw new Error("PoTyresSupplier not found")
  }
  return row
}

exports.getPoTyresSuppliersByPoTyresId = (poTyresId) => {
  const normalizedPoTyresId = normalizeId(poTyresId, "PoTyresID")
  return poTyresSuppliersRepo.getPoTyresSuppliersByPoTyresId(normalizedPoTyresId)
}

exports.createPoTyresSupplier = (payload) => {
  const validated = toPoTyresSupplierPayload(payload)
  
  const existing = poTyresSuppliersRepo.getPoTyresSupplier(
    validated.PoTyresID, 
    validated.SupplierID
  )
  if (existing) {
    throw new Error("PoTyresSupplier link already exists")
  }

  return poTyresSuppliersRepo.createPoTyresSupplier(validated)
}

exports.updatePoTyresSupplier = (id, payload) => {
  const normalizedId = normalizeId(id, "ID")
  const validated = toPoTyresSupplierPayload(payload)
  
  const current = poTyresSuppliersRepo.getPoTyresSupplierById(normalizedId)
  if (!current) {
    throw new Error("PoTyresSupplier not found")
  }

  // Check for uniqueness conflict if the unique pair is being changed
  if (
    validated.PoTyresID !== current.PoTyresID || 
    validated.SupplierID !== current.SupplierID
  ) {
    const existingConflict = poTyresSuppliersRepo.getPoTyresSupplier(
      validated.PoTyresID, 
      validated.SupplierID
    )
    if (existingConflict) {
      throw new Error("PoTyresSupplier link already exists")
    }
  }

  return poTyresSuppliersRepo.updatePoTyresSupplier(normalizedId, validated)
}

exports.updateApprovalById = (id, isApproved, ctx) => {
  const normalizedId = normalizeId(id, "ID")
  const normalizedApproved = normalizeBooleanFlag(isApproved, "IsApproved", null)

  const current = poTyresSuppliersRepo.getPoTyresSupplierById(normalizedId)
  if (!current) {
    throw new Error("PoTyresSupplier not found")
  }

  const updated = poTyresSuppliersRepo.updateApprovalStatus(normalizedId, normalizedApproved)
  if (!updated) {
    throw new Error("Failed to update approval status")
  }

  const poTyre = poTyresRepo.getPoTyreById(current.PoTyresID)

  poAuditLogService.recordPOAction({
    action: AUDIT_ACTIONS.SUPPLIER_APPROVAL,
    poId: poTyre?.POID ?? null,
    eventData: {
      PoTyresID: current.PoTyresID,
      SupplierID: current.SupplierID,
      IsApproved: normalizedApproved,
    },
    before: current,
    after: updated,
    ctx,
  })

  return updated
}

exports.updateDeliveryDatesById = (id, dates = {}, ctx) => {
  const normalizedId = normalizeId(id, "ID")
  const current = poTyresSuppliersRepo.getPoTyresSupplierById(normalizedId)
  if (!current) {
    throw new Error("PoTyresSupplier not found")
  }

  const isApproved = current.IsApproved === 1 || current.IsApproved === true
  if (!isApproved) {
    throw new Error("Supplier delivery dates can only be set after the supplier is approved.")
  }

  const payload = {
    ExpectedDeliveryDate: normalizeDateValue(dates.ExpectedDeliveryDate ?? current.ExpectedDeliveryDate, "ExpectedDeliveryDate"),
    ActualDeliveryDate: normalizeDateValue(dates.ActualDeliveryDate ?? current.ActualDeliveryDate, "ActualDeliveryDate"),
  }

  const poTyre = poTyresRepo.getPoTyreById(current.PoTyresID)
  let lineAdvancedToArriving = false
  const updated = db.transaction(() => {
    const updatedAllocation = poTyresSuppliersRepo.updateDeliveryDates(normalizedId, payload)
    if (!updatedAllocation) {
      throw new Error("Failed to update supplier delivery dates")
    }

    // A line with no status is treated as pending, mirroring updatePoTyreStatus.
    const currentStatusCode = poTyre?.StatusCode || STATUS_CODES.PENDING
    if (dates.ExpectedDeliveryDate && currentStatusCode === STATUS_CODES.PENDING) {
      poTyresService.updatePoTyreStatus(current.PoTyresID, STATUS_CODES.ARRIVING)
      lineAdvancedToArriving = true
    }

    return updatedAllocation
  })()

  poAuditLogService.recordPOAction({
    action: AUDIT_ACTIONS.UPDATE,
    poId: poTyre?.POID ?? null,
    eventData: {
      PoTyresID: current.PoTyresID,
      SupplierID: current.SupplierID,
      ExpectedDeliveryDate: payload.ExpectedDeliveryDate,
      ActualDeliveryDate: payload.ActualDeliveryDate,
      ...(lineAdvancedToArriving ? { TyreLineStatus: STATUS_CODES.ARRIVING } : {}),
    },
    before: current,
    after: updated,
    ctx,
  })

  return updated
}

exports.setExpectedDeliveryDate = (id, expectedDeliveryDate, ctx) => {
  return exports.updateDeliveryDatesById(id, { ExpectedDeliveryDate: expectedDeliveryDate }, ctx)
}

exports.setActualDeliveryDate = (id, actualDeliveryDate, ctx) => {
  return exports.updateDeliveryDatesById(id, { ActualDeliveryDate: actualDeliveryDate }, ctx)
}

exports.deletePoTyresSupplier = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const result = poTyresSuppliersRepo.deletePoTyresSupplier(normalizedId)

  if (result.changes === 0) {
    throw new Error("PoTyresSupplier not found")
  }
  return { success: true }
}