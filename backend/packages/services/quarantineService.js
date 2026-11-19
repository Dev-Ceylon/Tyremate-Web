const db = require("../database/connection")
const quarantineRepo = require("../repositories/quarantineRepository")
const salesReturnRepo = require("../repositories/salesReturnRepository")
const salesReturnLineRepo = require("../repositories/salesReturnLineRepository")
const soTyresRepo = require("../repositories/soTyresRepository")
const soAllocationRepo = require("../repositories/soTyreStorageAllocationRepository")
const storageManagerRepo = require("../repositories/storageManagerRepository")
const storageManagerService = require("./storageManagerService")
const { getStorageSourceId } = require("../constants/storageSourceConstants")
const {
  QUARANTINE_SOURCE_CODES,
  QUARANTINE_STATUS_CODES,
  QUARANTINE_MOVEMENT_ACTION_CODES,
  getQuarantineSourceIdByCode,
  getQuarantineStatusIdByCode,
  getQuarantineMovementActionIdByCode,
} = require("../constants/quarantineConstants")
const {
  getSalesReturnStatusIdByCode,
  SALES_RETURN_STATUS_CODES,
} = require("../constants/salesReturnConstants")

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

exports.receiveToQuarantine = (payload = {}, ctx = {}) => {
  const transaction = db.transaction(() => {
    const salesReturnId = normalizeId(payload.salesReturnId || payload.SalesReturnID, "SalesReturnID")
    const receivedBy = payload.receivedBy || payload.ReceivedBy || null

    const salesReturn = salesReturnRepo.getSalesReturnById(salesReturnId)
    if (!salesReturn) {
      throw new Error(`Sales Return with ID ${salesReturnId} not found`)
    }

    const sourceTypeId = getQuarantineSourceIdByCode(QUARANTINE_SOURCE_CODES.CUSTOMER_RETURN)
    if (!sourceTypeId) {
      throw new Error("Quarantine source CUSTOMER_RETURN not initialized")
    }

    const statusHoldId = getQuarantineStatusIdByCode(QUARANTINE_STATUS_CODES.HOLD)
    if (!statusHoldId) {
      throw new Error("Quarantine status HOLD not initialized")
    }

    const actionReceiveId = getQuarantineMovementActionIdByCode(QUARANTINE_MOVEMENT_ACTION_CODES.RECEIVE)
    if (!actionReceiveId) {
      throw new Error("Quarantine movement action RECEIVE not initialized")
    }

    const lines = salesReturnLineRepo.getSalesReturnLinesBySalesReturnId(salesReturnId)
    if (!Array.isArray(lines) || lines.length === 0) {
      throw new Error("No sales return lines found to receive to quarantine")
    }

    const results = []

    for (const line of lines) {
      const existing = quarantineRepo.getQuarantineStockBySourceLine(sourceTypeId, salesReturnId, line.SalesReturnLineID)
      if (existing) {
        results.push(existing)
        continue
      }

      const soTyre = soTyresRepo.getSoTyreById(line.SoTyreID)
      if (!soTyre) {
        throw new Error(`SoTyre with ID ${line.SoTyreID} not found`)
      }

      const qty = normalizeQty(line.ReturnedQty || line.Qty, "ReturnedQty")

      const created = quarantineRepo.createQuarantineStock({
        SourceTypeId: sourceTypeId,
        SourceId: salesReturnId,
        SourceLineId: line.SalesReturnLineID,
        TyreID: line.TyreID || soTyre.TyreID,
        StorageManagerID: line.StorageManagerID ?? null,
        StorageManagerBatchID: line.StorageManagerBatchID ?? null,
        SerialNo: line.SerialNo ?? null,
        Qty: qty,
        UnitCost: 0,
        UnitPrice: line.UnitPrice || soTyre.Price || 0,
        StatusId: statusHoldId,
        Reason: line.ReturnReason || salesReturn.Notes || null,
        ReceivedBy: receivedBy,
        Notes: null,
      })

      quarantineRepo.createQuarantineMovement({
        QuarantineID: created.QuarantineID,
        FromStatusId: null,
        ToStatusId: statusHoldId,
        ActionId: actionReceiveId,
        Qty: qty,
        MovedBy: receivedBy,
        Remarks: "Received into quarantine for inspection",
      })
      salesReturnLineRepo.createSalesReturnStockMovement({
        SalesReturnID: salesReturnId,
        SalesReturnLineID: line.SalesReturnLineID,
        TyreID: line.TyreID || soTyre.TyreID,
        StorageManagerID: line.StorageManagerID,
        StorageManagerBatchID: line.StorageManagerBatchID,
        Qty: qty,
        MovementType: "RECEIVE_QUARANTINE",
        LocationType: "QUARANTINE",
        MovedBy: receivedBy,
        Notes: "Customer return received into quarantine for inspection",
      })

      results.push(created)
    }

    // Keep the required SalesReturn.StatusId populated while moving the request
    // into quarantine. A null status update violates the database constraint.
    const receivedInQuarantineId = getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.RECEIVED_IN_QUARANTINE)
    if (!receivedInQuarantineId) {
      throw new Error("Sales return status RECEIVED_IN_QUARANTINE not initialized")
    }
    salesReturnRepo.updateSalesReturnStatus(salesReturnId, receivedInQuarantineId)

    return results
  })

  return transaction()
}

exports.returnRejectedToCustomer = (payload = {}, ctx = {}) => {
  return db.transaction(() => {
    const salesReturnId = normalizeId(payload.salesReturnId || payload.SalesReturnID, "SalesReturnID")
    const sourceTypeId = getQuarantineSourceIdByCode(QUARANTINE_SOURCE_CODES.CUSTOMER_RETURN)
    const cancelledStatusId = getQuarantineStatusIdByCode(QUARANTINE_STATUS_CODES.CANCELLED)
    const rejectActionId = getQuarantineMovementActionIdByCode(QUARANTINE_MOVEMENT_ACTION_CODES.REJECT)
    const selectedLineIds = Array.isArray(payload.salesReturnLineIds) ? new Set(payload.salesReturnLineIds.map(Number)) : null
    const lines = salesReturnLineRepo.getSalesReturnLinesBySalesReturnId(salesReturnId)
    for (const line of lines) {
      if (selectedLineIds && !selectedLineIds.has(Number(line.SalesReturnLineID))) continue
      const quarantine = quarantineRepo.getQuarantineStockBySourceLine(sourceTypeId, salesReturnId, line.SalesReturnLineID)
      if (!quarantine || quarantine.StatusCode !== QUARANTINE_STATUS_CODES.HOLD) continue
      quarantineRepo.updateQuarantineStockStatus(quarantine.QuarantineID, cancelledStatusId, {
        ReleasedBy: payload.rejectedBy || null,
        setReleasedAt: true,
        ReleaseRef: payload.releaseRef || "Rejected customer return",
        Notes: payload.rejectionReason || null,
      })
      quarantineRepo.createQuarantineMovement({
        QuarantineID: quarantine.QuarantineID,
        FromStatusId: quarantine.StatusId,
        ToStatusId: cancelledStatusId,
        ActionId: rejectActionId,
        Qty: line.ReturnedQty,
        MovedBy: payload.rejectedBy || null,
        Remarks: "Rejected return released from quarantine back to customer",
      })
    }
    return { success: true }
  })()
}

exports.transferToSaleable = (payload = {}, ctx = {}) => {
  const transaction = db.transaction(() => {
    const salesReturnId = normalizeId(payload.salesReturnId || payload.SalesReturnID, "SalesReturnID")
    const releasedBy = payload.releasedBy || payload.ReleasedBy || null

    const salesReturn = salesReturnRepo.getSalesReturnById(salesReturnId)
    if (!salesReturn) {
      throw new Error(`Sales Return with ID ${salesReturnId} not found`)
    }

    const sourceTypeId = getQuarantineSourceIdByCode(QUARANTINE_SOURCE_CODES.CUSTOMER_RETURN)
    if (!sourceTypeId) {
      throw new Error("Quarantine source CUSTOMER_RETURN not initialized")
    }

    const statusHoldId = getQuarantineStatusIdByCode(QUARANTINE_STATUS_CODES.HOLD)
    const statusReleasedId = getQuarantineStatusIdByCode(QUARANTINE_STATUS_CODES.RELEASED_TO_SALEABLE)
    if (!statusReleasedId) {
      throw new Error("Quarantine status RELEASED_TO_SALEABLE not initialized")
    }

    const actionTransferId = getQuarantineMovementActionIdByCode(QUARANTINE_MOVEMENT_ACTION_CODES.TRANSFER_TO_SALEABLE)
    if (!actionTransferId) {
      throw new Error("Quarantine movement action TRANSFER_TO_SALEABLE not initialized")
    }
    const salesReturnStorageSourceId = getStorageSourceId("SALES_RETURN")
    if (!salesReturnStorageSourceId) {
      throw new Error("Storage source SALES_RETURN not initialized")
    }

    const lines = salesReturnLineRepo.getSalesReturnLinesBySalesReturnId(salesReturnId)
    if (!Array.isArray(lines) || lines.length === 0) {
      throw new Error("No sales return lines found")
    }

    const results = []

    for (const line of lines) {
      const dispositionCode = line.DispositionCode
      if (dispositionCode && dispositionCode !== "RESTOCK_SALEABLE") {
        continue
      }
      if (line.Approved !== 1) {
        continue
      }
      if (line.Inspected !== 1) {
        throw new Error(`SalesReturnLineID ${line.SalesReturnLineID} has not been inspected`)
      }

      const quarantine = quarantineRepo.getQuarantineStockBySourceLine(sourceTypeId, salesReturnId, line.SalesReturnLineID)
      if (!quarantine) {
        throw new Error(`Quarantine stock not found for SalesReturnLineID ${line.SalesReturnLineID}`)
      }
      if (quarantine.StatusCode === QUARANTINE_STATUS_CODES.RELEASED_TO_SALEABLE) {
        results.push(quarantine)
        continue
      }

      const soTyre = soTyresRepo.getSoTyreById(line.SoTyreID)
      if (!soTyre) {
        throw new Error(`SoTyre with ID ${line.SoTyreID} not found`)
      }

      const qty = normalizeQty(line.ReturnedQty, "ReturnedQty")
      if (!line.AllocationID) {
        throw new Error(`Original allocation missing for SalesReturnLineID ${line.SalesReturnLineID}`)
      }
      const allocation = soAllocationRepo.getAllocationById(line.AllocationID)
      if (!allocation || Number(allocation.SoTyreID) !== Number(soTyre.ID)) {
        throw new Error(`Original allocation ${line.AllocationID} is invalid for SalesReturnLineID ${line.SalesReturnLineID}`)
      }
      const originalStorageManagerId = line.StorageManagerID ?? allocation.StorageManagerID
      const originalStorageManager = originalStorageManagerId
        ? storageManagerRepo.getStorageManagerById(originalStorageManagerId)
        : null
      if (!originalStorageManager) {
        throw new Error(`Original storage lot not found for SalesReturnLineID ${line.SalesReturnLineID}`)
      }

      const saleableLot = storageManagerService.addInternalStorageLot({
        tyreId: soTyre.TyreID,
        locationId: originalStorageManager.LocationID,
        qty,
        sourceTypeId: salesReturnStorageSourceId,
        sourceId: salesReturnId,
        batch: { DOT: line.DOT ?? null, Qty: qty },
      })

      quarantineRepo.updateQuarantineStockStatus(quarantine.QuarantineID, statusReleasedId, {
        ReleasedBy: releasedBy,
        setReleasedAt: true,
        ReleaseRef: salesReturn.ReturnNo || String(salesReturnId),
      })

      quarantineRepo.createQuarantineMovement({
        QuarantineID: quarantine.QuarantineID,
        FromStatusId: quarantine.StatusId || statusHoldId,
        ToStatusId: statusReleasedId,
        ActionId: actionTransferId,
        Qty: qty,
        MovedBy: releasedBy,
        Remarks: "Transferred to saleable stock",
        TargetStorageManagerID: saleableLot.Id,
        TargetStorageManagerBatchID: saleableLot.StorageManagerBatch?.Id ?? null,
      })
      salesReturnLineRepo.createSalesReturnStockMovement({
        SalesReturnID: salesReturnId,
        SalesReturnLineID: line.SalesReturnLineID,
        TyreID: soTyre.TyreID,
        StorageManagerID: saleableLot.Id,
        StorageManagerBatchID: saleableLot.StorageManagerBatch?.Id ?? null,
        Qty: qty,
        MovementType: "RECEIVE_SALEABLE",
        LocationType: "SALEABLE",
        MovedBy: releasedBy,
        Notes: "Approved customer return released to saleable stock",
      })

      results.push(quarantine)
    }

    const receivedInStockId = getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.RECEIVED_IN_STOCK)
    if (receivedInStockId) {
      salesReturnRepo.updateSalesReturnStatus(salesReturnId, receivedInStockId)
    }

    return results
  })

  return transaction()
}

exports.moveToScrapOrSupplier = (payload = {}, ctx = {}) => {
  const transaction = db.transaction(() => {
    const salesReturnId = normalizeId(payload.salesReturnId || payload.SalesReturnID, "SalesReturnID")
    const movedBy = payload.movedBy || payload.MovedBy || null
    const actionCode = payload.actionCode || QUARANTINE_MOVEMENT_ACTION_CODES.RETURN_TO_SUPPLIER

    const salesReturn = salesReturnRepo.getSalesReturnById(salesReturnId)
    if (!salesReturn) {
      throw new Error(`Sales Return with ID ${salesReturnId} not found`)
    }

    const sourceTypeId = getQuarantineSourceIdByCode(QUARANTINE_SOURCE_CODES.CUSTOMER_RETURN)
    if (!sourceTypeId) {
      throw new Error("Quarantine source CUSTOMER_RETURN not initialized")
    }

    const statusHoldId = getQuarantineStatusIdByCode(QUARANTINE_STATUS_CODES.HOLD)
    const statusReturnedId = getQuarantineStatusIdByCode(QUARANTINE_STATUS_CODES.RETURNED_TO_SUPPLIER)
    const statusScrappedId = getQuarantineStatusIdByCode(QUARANTINE_STATUS_CODES.SCRAPPED)
    const actionId = getQuarantineMovementActionIdByCode(actionCode)
    if (!actionId) {
      throw new Error(`Quarantine movement action ${actionCode} not initialized`)
    }

    const lines = salesReturnLineRepo.getSalesReturnLinesBySalesReturnId(salesReturnId)
    const results = []

    for (const line of lines) {
      const dispositionCode = line.DispositionCode
      if (actionCode === QUARANTINE_MOVEMENT_ACTION_CODES.SCRAP) {
        if (dispositionCode !== "SCRAP") continue
      } else if (actionCode === QUARANTINE_MOVEMENT_ACTION_CODES.RETURN_TO_SUPPLIER) {
        if (dispositionCode !== "RETURN_TO_SUPPLIER") continue
      }
      if (line.Approved !== 1 || line.Inspected !== 1) continue

      const quarantine = quarantineRepo.getQuarantineStockBySourceLine(sourceTypeId, salesReturnId, line.SalesReturnLineID)
      if (!quarantine) continue

      const targetStatusId = actionCode === QUARANTINE_MOVEMENT_ACTION_CODES.SCRAP ? statusScrappedId : statusReturnedId
      if (!targetStatusId) continue
      if (quarantine.StatusCode === QUARANTINE_STATUS_CODES.SCRAPPED || quarantine.StatusCode === QUARANTINE_STATUS_CODES.RETURNED_TO_SUPPLIER) continue

      quarantineRepo.updateQuarantineStockStatus(quarantine.QuarantineID, targetStatusId, {
        ReleasedBy: movedBy,
        setReleasedAt: true,
        ReleaseRef: salesReturn.ReturnNo || String(salesReturnId),
        Notes: payload.notes || null,
      })

      quarantineRepo.createQuarantineMovement({
        QuarantineID: quarantine.QuarantineID,
        FromStatusId: quarantine.StatusId || statusHoldId,
        ToStatusId: targetStatusId,
        ActionId: actionId,
        Qty: line.ReturnedQty,
        MovedBy: movedBy,
        Remarks: payload.remarks || (actionCode === QUARANTINE_MOVEMENT_ACTION_CODES.SCRAP ? "Moved to scrap" : "Returned to supplier"),
      })
      salesReturnLineRepo.createSalesReturnStockMovement({
        SalesReturnID: salesReturnId,
        SalesReturnLineID: line.SalesReturnLineID,
        TyreID: line.TyreID,
        StorageManagerID: line.StorageManagerID,
        StorageManagerBatchID: line.StorageManagerBatchID,
        Qty: line.ReturnedQty,
        MovementType: actionCode === QUARANTINE_MOVEMENT_ACTION_CODES.SCRAP ? "MOVE_TO_SCRAP" : "MOVE_TO_SUPPLIER",
        LocationType: actionCode === QUARANTINE_MOVEMENT_ACTION_CODES.SCRAP ? "SCRAP" : "SUPPLIER_RETURN",
        MovedBy: movedBy,
        Notes: payload.notes || null,
      })

      results.push(quarantine)
    }

    return results
  })

  return transaction()
}
