const soTyresRepo = require("../repositories/soTyresRepository")

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

const toSoTyrePayload = (payload = {}) => {
  return {
    SoID: normalizeId(payload.SoID, "SoID"),
    TyreID: normalizeId(payload.TyreID, "TyreID"),
    Price: normalizeNumber(payload.Price, "Price"),
    Discount: normalizeNumber(payload.Discount, "Discount"),
    Qty: normalizeInteger(payload.Qty, "Qty"),
    NeedToOrderQty: normalizeInteger(payload.NeedToOrderQty, "NeedToOrderQty"),
    IsAdminApproved: normalizeBooleanFlag(payload.IsAdminApproved, "IsAdminApproved")
  }
}

exports.getSoTyres = () => {
  return soTyresRepo.getAllSoTyres()
}

exports.getSoTyresBySoId = (soId) => {
  const normalizedSoId = normalizeId(soId, "SoID")

  return soTyresRepo.getSoTyresBySoId?.(normalizedSoId) || []
}

exports.getSoTyre = (soId, tyreId) => {
  const normalizedSoId = normalizeId(soId, "SoID")
  const normalizedTyreId = normalizeId(tyreId, "TyreID")
  const row = soTyresRepo.getSoTyre(normalizedSoId, normalizedTyreId)

  if (!row) {
    throw new Error("SO-Tyre link not found")
  }

  return row
}

exports.createSoTyre = (payload) => {
  const soTyre = toSoTyrePayload(payload)
  const existing = soTyresRepo.getSoTyre(soTyre.SoID, soTyre.TyreID)

  if (existing) {
    throw new Error("SO-Tyre link already exists")
  }

  return soTyresRepo.createSoTyre(soTyre)
}

exports.updateSoTyre = (soId, tyreId, payload) => {
  const normalizedSoId = normalizeId(soId, "SoID")
  const normalizedTyreId = normalizeId(tyreId, "TyreID")
  const soTyre = toSoTyrePayload(payload)
  const current = soTyresRepo.getSoTyre(normalizedSoId, normalizedTyreId)

  if (!current) {
    throw new Error("SO-Tyre link not found")
  }

  if (
    soTyre.SoID !== normalizedSoId ||
    soTyre.TyreID !== normalizedTyreId
  ) {
    const existingTarget = soTyresRepo.getSoTyre(soTyre.SoID, soTyre.TyreID)

    if (existingTarget) {
      throw new Error("SO-Tyre link already exists")
    }
  }

  return soTyresRepo.updateSoTyre(normalizedSoId, normalizedTyreId, soTyre)
}

exports.deleteSoTyre = (soId, tyreId) => {
  const normalizedSoId = normalizeId(soId, "SoID")
  const normalizedTyreId = normalizeId(tyreId, "TyreID")
  const result = soTyresRepo.deleteSoTyre(normalizedSoId, normalizedTyreId)

  if (result.changes === 0) {
    throw new Error("SO-Tyre link not found")
  }

  return { success: true }
}
