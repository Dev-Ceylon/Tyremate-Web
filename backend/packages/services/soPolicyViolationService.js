const soPolicyViolationRepo = require("../repositories/soPolicyViolationRepository")
const { POLICY_VIOLATION_CODES, getPolicyViolationName } = require("../constants/policyViolationConstants")

const normalizeId = (value, fieldName = "Id") => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeOptionalId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  return normalizeId(value)
}

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()

  return trimmed || null
}

const normalizeQuantity = (value) => {
  const parsed = Number(value ?? 1)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Qty must be a valid positive integer")
  }

  return parsed
}

const normalizeNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    throw new Error("Numeric value is invalid")
  }

  return parsed
}

const resolveResponsibleUser = (ctx) => {
  const { user, changedBy } = ctx ?? {}

  return user?.displayName || user?.username || changedBy || null
}

const normalizeDOTs = (dots, fallback) => {
  const legacy = fallback && normalizeString(fallback.DOT) ? [fallback] : []
  const source = Array.isArray(dots) && dots.length > 0 ? dots : legacy

  return source.map((dot) => {
    if (!dot || typeof dot !== "object") {
      throw new Error("Each DOT entry must be an object")
    }

    return {
      DOT: normalizeString(dot.DOT),
      OldestAvailableDOT: normalizeString(dot.OldestAvailableDOT),
      StorageManagerID: normalizeOptionalId(dot.StorageManagerID),
      StorageManagerBatchID: normalizeOptionalId(dot.StorageManagerBatchID),
      Qty: normalizeQuantity(dot.Qty)
    }
  })
}

const toViolationPayload = (payload = {}) => {
  const violationCode = payload.ViolationTypeCode

  const knownCodes = Object.values(POLICY_VIOLATION_CODES)

  if (!knownCodes.includes(violationCode)) {
    throw new Error(`Unknown ViolationTypeCode: ${violationCode}`)
  }

  if (payload.DOTs !== undefined && payload.DOTs !== null && !Array.isArray(payload.DOTs)) {
    throw new Error("DOTs must be an array")
  }

  const DOTs = normalizeDOTs(payload.DOTs, {
    DOT: payload.DOT,
    OldestAvailableDOT: payload.OldestAvailableDOT,
    StorageManagerID: payload.StorageManagerID,
    StorageManagerBatchID: payload.StorageManagerBatchID,
    Qty: payload.Qty
  })

  if (violationCode === POLICY_VIOLATION_CODES.SKIPPED_OLD_STOCK && DOTs.length === 0) {
    throw new Error(`${POLICY_VIOLATION_CODES.SKIPPED_OLD_STOCK} violations require at least one DOT entry`)
  }

  return {
    SoID: normalizeId(payload.SoID, "SoID"),
    SoTyreID: normalizeOptionalId(payload.SoTyreID),
    TyreID: normalizeId(payload.TyreID, "TyreID"),
    ViolationTypeCode: violationCode,
    Qty: normalizeQuantity(payload.Qty),
    Price: normalizeNullableNumber(payload.Price),
    MaxDiscountAllowed: normalizeNullableNumber(payload.MaxDiscountAllowed),
    AppliedDiscount: normalizeNullableNumber(payload.AppliedDiscount),
    DiscountExcess: normalizeNullableNumber(payload.DiscountExcess),
    Details: payload.Details ? JSON.stringify(payload.Details) : null,
    DOTs
  }
}

exports.getSOPolicyViolations = () => {
  return soPolicyViolationRepo.getSOPolicyViolations()
}

exports.getPendingSOPolicyViolations = () => {
  return soPolicyViolationRepo.getPendingSOPolicyViolations()
}

exports.getSOPolicyViolationById = (id) => {
  const violation = soPolicyViolationRepo.getSOPolicyViolationById(normalizeId(id))

  if (!violation) {
    throw new Error("Policy violation record not found")
  }

  return violation
}

exports.getSOPolicyViolationsBySoId = (soId) => {
  return soPolicyViolationRepo.getSOPolicyViolationsBySoId(normalizeId(soId, "SoID"))
}

exports.getSOPolicyViolationDOTsBySoId = (soId) => {
  return soPolicyViolationRepo.getSOPolicyViolationDOTsBySoId(normalizeId(soId, "SoID"))
}

const toViolationGroup = (violation) => {
  const dots = violation.DOTs ?? []
  const approved = violation.IsApproved === 1

  return {
    ...violation,
    DOTSold: dots.map((dot) => dot.DOT).filter(Boolean),
    OldestAvailableDOTSold: [...new Set(dots.map((dot) => dot.OldestAvailableDOT).filter(Boolean))],
    DOTCount: dots.length,
    OffendingQty: dots.reduce((total, dot) => total + (dot.Qty ?? 0), 0),
    IsApproved: approved,
    PendingDOTCount: approved ? 0 : dots.length
  }
}

exports.getSOPolicyViolationGroupsBySoId = (soId) => {
  const violations = exports.getSOPolicyViolationsBySoId(soId)
  const groups = new Map()

  for (const violation of violations) {
    const group = toViolationGroup(violation)
    const key = `${violation.SoTyreID ?? "so"}::${violation.ViolationTypeCode}`

    const existing = groups.get(key)

    if (existing) {
      existing.DOTSold.push(...group.DOTSold)
      existing.OldestAvailableDOTSold.push(...group.OldestAvailableDOTSold)
      existing.DOTCount += group.DOTCount
      existing.OffendingQty += group.OffendingQty
      existing.PendingDOTCount += group.PendingDOTCount
      existing.IsApproved = existing.IsApproved && group.IsApproved
      existing.Details = [existing.Details, group.Details].filter(Boolean).join(" | ")
    } else {
      groups.set(key, group)
    }
  }

  return [...groups.values()]
}

exports.getSOPolicyViolationsByTyreId = (tyreId) => {
  return soPolicyViolationRepo.getSOPolicyViolationsByTyreId(normalizeId(tyreId, "TyreID"))
}

exports.createSOPolicyViolation = (payload, ctx) => {
  const violation = toViolationPayload(payload)

  return soPolicyViolationRepo.insertSOPolicyViolation({
    ...violation,
    ResponsibleUser: resolveResponsibleUser(ctx)
  })
}

exports.approveSOPolicyViolation = (id, payload = {}, ctx) => {
  const violation = soPolicyViolationRepo.getSOPolicyViolationById(normalizeId(id))

  if (!violation) {
    throw new Error("Policy violation record not found")
  }

  if (violation.IsApproved === 1) {
    throw new Error("Policy violation is already approved")
  }

  const { user, changedBy } = ctx ?? {}
  const approvedBy = user?.displayName || user?.username || changedBy || null

  const updated = soPolicyViolationRepo.updateSOPolicyViolationApproval(normalizeId(id), {
    approveNote: normalizeString(payload.ApproveNote),
    approvedBy
  })

  return updated
}

exports.deleteSOPolicyViolation = (id) => {
  const result = soPolicyViolationRepo.deleteSOPolicyViolation(normalizeId(id))

  if (result.changes === 0) {
    throw new Error("Policy violation record not found")
  }

  return { success: true }
}

exports.getPolicyViolationName = getPolicyViolationName