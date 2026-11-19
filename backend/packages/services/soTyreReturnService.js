const soTyreReturnRepo = require("../repositories/soTyreReturnRepository")
const soTyresRepo = require("../repositories/soTyresRepository")
const allocationRepo = require("../repositories/soTyreStorageAllocationRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeQty = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`)
  }

  const normalized = String(value).trim()

  if (!normalized) {
    throw new Error(`${fieldName} is required`)
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`)
  }

  return normalized
}

const normalizeReason = (value) => {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : null
}

const toSoTyreReturnPayload = (payload = {}) => {
  const soTyreID = normalizeId(payload.SoTyreID, "SoTyreID")
  const qty = normalizeQty(payload.Qty, "Qty")
  const returnDate = normalizeDate(payload.ReturnDate, "ReturnDate")
  const reason = normalizeReason(payload.Reason)
  const allocationId = payload.AllocationId ? normalizeId(payload.AllocationId, "AllocationId") : null
  const storageManagerId = payload.StorageManagerID ? normalizeId(payload.StorageManagerID, "StorageManagerID") : null
  const storageManagerBatchId = payload.StorageManagerBatchID ? normalizeId(payload.StorageManagerBatchID, "StorageManagerBatchID") : null
  const dot = payload.DOT ? String(payload.DOT).trim() : null

  const soTyre = soTyresRepo.getSoTyreById(soTyreID)
  if (!soTyre) {
    throw new Error(`Sales Order Tyre line with ID ${soTyreID} not found.`)
  }

  return {
    SoTyreID: soTyreID,
    Qty: qty,
    ReturnDate: returnDate,
    Reason: reason,
    AllocationId: allocationId,
    StorageManagerID: storageManagerId,
    StorageManagerBatchID: storageManagerBatchId,
    DOT: dot,
  }
}

exports.getReturnsBySoId = (soId) => {
  const normalizedSoId = normalizeId(soId, "SoID")
  return soTyreReturnRepo.getReturnsBySoId(normalizedSoId)
}

exports.getReturnableSummaryBySoTyreId = (soTyreId) => {
  const normalizedId = normalizeId(soTyreId, "SoTyreID")
  return soTyreReturnRepo.getSoTyreWithReturnSummary(normalizedId)
}

exports.createSoTyreReturn = (payload) => {
  const soTyreReturn = toSoTyreReturnPayload(payload)
  
  // Validate allocation qty if allocation provided
  if (soTyreReturn.AllocationId) {
    const allocation = allocationRepo.getAllocationById(soTyreReturn.AllocationId)
    if (!allocation) {
      throw new Error(`Allocation with ID ${soTyreReturn.AllocationId} not found`)
    }
    const alreadyReturned = soTyreReturnRepo.getReturnedQtyByAllocationId(soTyreReturn.AllocationId)
    const available = allocation.Qty - alreadyReturned
    if (soTyreReturn.Qty > available) {
      throw new Error(`Return quantity (${soTyreReturn.Qty}) exceeds available for this allocation (${available})`)
    }
  }
  
  return soTyreReturnRepo.createSoReturnTyres(soTyreReturn)
}
