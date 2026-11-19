const poTyresRepo = require("../repositories/poTyresRepository")
const { STATUS_CODES, getStatusIdByCode } = require("../constants/statusConstants")
const { isPoTyreStatusTransitionAllowed, getPoTyreNextStatus } = require("../constants/poStatusConstants")

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

const normalizeBooleanFlag = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  if (value === true || value === "true") {
    return 1
  }

  if (value === false || value === "false") {
    return 0
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || (parsed !== 0 && parsed !== 1)) {
    throw new Error(`${fieldName} must be 0 or 1`)
  }

  return parsed
}

const normalizeStatusCode = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const nextValue = String(value).trim()
  const statusId = getStatusIdByCode(nextValue)

  if (!statusId) {
    throw new Error(`${fieldName} must be a valid status code`)
  }

  return statusId
}

const toPoTyrePayload = (payload = {}) => {
  return {
    POID: normalizeId(payload.POID, "POID"),
    TyreID: normalizeId(payload.TyreID, "TyreID"),
    Price: normalizeNumber(payload.Price, "Price"),
    Discount: normalizeNumber(payload.Discount, "Discount"),
    Qty: normalizeInteger(payload.Qty, "Qty"),
    IsAdminApproved: normalizeBooleanFlag(payload.IsAdminApproved, "IsAdminApproved"),
    StatusID: normalizeStatusCode(payload.StatusCode ?? payload.StatusID, "StatusCode"),
  }
}

exports.getPoTyres = () => {
  return poTyresRepo.getAllPoTyres()
}

exports.getPoTyre = (poId, tyreId) => {
  const normalizedPoId = normalizeId(poId, "POID")
  const normalizedTyreId = normalizeId(tyreId, "TyreID")
  const row = poTyresRepo.getPoTyre(normalizedPoId, normalizedTyreId)

  if (!row) {
    throw new Error("PO-Tyre link not found")
  }

  return row
}

exports.createPoTyre = (payload) => {
  const poTyre = toPoTyrePayload(payload)
  const existing = poTyresRepo.getPoTyre(poTyre.POID, poTyre.TyreID)

  if (existing) {
    throw new Error("PO-Tyre link already exists")
  }

  return poTyresRepo.createPoTyre(poTyre)
}

exports.updatePoTyre = (poId, tyreId, payload) => {
  const normalizedPoId = normalizeId(poId, "POID")
  const normalizedTyreId = normalizeId(tyreId, "TyreID")
  const poTyre = toPoTyrePayload(payload)
  const current = poTyresRepo.getPoTyre(normalizedPoId, normalizedTyreId)

  if (!current) {
    throw new Error("PO-Tyre link not found")
  }

  if (
    poTyre.POID !== normalizedPoId ||
    poTyre.TyreID !== normalizedTyreId
  ) {
    const existingTarget = poTyresRepo.getPoTyre(poTyre.POID, poTyre.TyreID)

    if (existingTarget) {
      throw new Error("PO-Tyre link already exists")
    }
  }

  return poTyresRepo.updatePoTyre(normalizedPoId, normalizedTyreId, poTyre)
}

exports.deletePoTyre = (poId, tyreId) => {
  const normalizedPoId = normalizeId(poId, "POID")
  const normalizedTyreId = normalizeId(tyreId, "TyreID")
  const result = poTyresRepo.deletePoTyre(normalizedPoId, normalizedTyreId)

  if (result.changes === 0) {
    throw new Error("PO-Tyre link not found")
  }

  return { success: true }
}

exports.updatePoTyreStatus = (poTyresId, statusCode) => {
  const normalizedPoTyresId = normalizeId(poTyresId, "PoTyresID")
  const nextStatusCode = String(statusCode || "").trim()
  const statusId = getStatusIdByCode(nextStatusCode)

  if (!statusId) {
    throw new Error(`Invalid status code: ${statusCode}`)
  }

  const current = poTyresRepo.getPoTyreById(normalizedPoTyresId)
  if (!current) {
    throw new Error("PO tyre line not found")
  }

  const currentStatusCode = current.StatusCode || STATUS_CODES.PENDING

  if (currentStatusCode === nextStatusCode) {
    return current
  }

  if (!isPoTyreStatusTransitionAllowed(currentStatusCode, nextStatusCode)) {
    throw new Error(
      `Cannot move tyre line from "${currentStatusCode}" to "${nextStatusCode}". Expected next status: "${getPoTyreNextStatus(currentStatusCode)}".`
    )
  }

  const updated = poTyresRepo.updateStatus(normalizedPoTyresId, statusId)
  if (!updated) {
    throw new Error("Failed to update tyre line status")
  }

  return updated
}
