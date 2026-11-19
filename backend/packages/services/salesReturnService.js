const db = require("../database/connection")
const salesReturnRepo = require("../repositories/salesReturnRepository")
const salesReturnLineRepo = require("../repositories/salesReturnLineRepository")
const soRepo = require("../repositories/soRepository")
const soTyresRepo = require("../repositories/soTyresRepository")
const soTyreReturnRepo = require("../repositories/soTyreReturnRepository")
const allocationRepo = require("../repositories/soTyreStorageAllocationRepository")
const quarantineService = require("./quarantineService")
const creditNoteService = require("./creditNoteService")
const {
  SALES_RETURN_TYPE_CODES,
  SALES_RETURN_STATUS_CODES,
  SALES_RETURN_CONDITION_CODES,
  SALES_RETURN_DISPOSITION_CODES,
  SALES_RETURN_WARRANTY_HANDLING_CODES,
  getSalesReturnTypeIdByCode,
  getSalesReturnStatusIdByCode,
  getSalesReturnConditionIdByCode,
  getSalesReturnDispositionIdByCode,
  getSalesReturnWarrantyHandlingIdByCode,
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

const buildReturnNo = (id) => {
  const year = new Date().getFullYear()
  return `SR-${year}-${String(id).padStart(6, "0")}`
}

exports.createRequest = (payload = {}, ctx = {}) => {
  const transaction = db.transaction(() => {
    const soId = normalizeId(payload.soId || payload.SoID, "SoID")
    const invoiceForOrder = salesReturnRepo.getInvoiceForSalesOrder(soId)
    const requestedInvoiceId = payload.invoiceId || payload.InvoiceID ? Number(payload.invoiceId || payload.InvoiceID) : null
    if (requestedInvoiceId && (!invoiceForOrder || invoiceForOrder.InvoiceID !== requestedInvoiceId)) {
      throw new Error("Invoice does not belong to this Sales Order")
    }
    const invoiceId = requestedInvoiceId || invoiceForOrder?.InvoiceID || null
    const customerId = payload.customerId || payload.CustomerID ? Number(payload.customerId || payload.CustomerID) : (invoiceForOrder?.CustomerID ?? null)
    const walkinCustomerId = payload.walkinCustomerId || payload.WalkinCustomerID ? Number(payload.walkinCustomerId || payload.WalkinCustomerID) : (invoiceForOrder?.WalkinCustomerID ?? null)
    const requestedBy = payload.requestedBy || payload.RequestedBy || null
    const returnType = payload.returnType || payload.ReturnType || SALES_RETURN_TYPE_CODES.UNUSED
    const warrantyHandling = payload.warrantyHandling || payload.WarrantyHandling || null

    const so = soRepo.getSOById(soId)
    if (!so) {
      throw new Error(`Sales Order with ID ${soId} not found`)
    }

    const returnTypeId = getSalesReturnTypeIdByCode(returnType)
    if (!returnTypeId) {
      throw new Error(`Sales return type ${returnType} not initialized`)
    }

    const statusRequestedId = getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.REQUESTED)
    if (!statusRequestedId) {
      throw new Error("Sales return status REQUESTED not initialized")
    }

    let warrantyHandlingId = null
    if (warrantyHandling) {
      warrantyHandlingId = getSalesReturnWarrantyHandlingIdByCode(warrantyHandling)
    }

    const temp = salesReturnRepo.createSalesReturn({
      ReturnNo: `SR-TEMP-${Date.now()}`,
      SoID: soId,
      InvoiceID: invoiceId,
      CustomerID: customerId,
      WalkinCustomerID: walkinCustomerId,
      ReturnTypeId: returnTypeId,
      StatusId: statusRequestedId,
      WarrantyHandlingId: warrantyHandlingId,
      RequestedBy: requestedBy,
      Notes: payload.notes || payload.Notes || null,
    })

    const returnNo = buildReturnNo(temp.SalesReturnID)
    db.prepare("UPDATE SalesReturn SET ReturnNo = ? WHERE SalesReturnID = ?").run(returnNo, temp.SalesReturnID)

    const lines = Array.isArray(payload.lines) ? payload.lines : []
    if (lines.length === 0) {
      throw new Error("At least one return line is required")
    }

    const requestedBySoTyre = new Map()
    const requestedByAllocation = new Map()
    for (const line of lines) {
      const soTyreId = normalizeId(line.soTyreId || line.SoTyreID, "SoTyreID")
      const soTyre = soTyresRepo.getSoTyreById(soTyreId)
      if (!soTyre || soTyre.SoID !== soId) {
        throw new Error(`SoTyre with ID ${soTyreId} not found for SO ${soId}`)
      }

      const returnedQty = normalizeQty(line.returnedQty || line.ReturnedQty || line.Qty, "ReturnedQty")
      const allocationId = line.allocationId || line.AllocationID ? normalizeId(line.allocationId || line.AllocationID, "AllocationID") : null
      if (!allocationId) throw new Error("Each return line must identify its original stock allocation")
      const allocation = allocationId ? allocationRepo.getAllocationById(allocationId) : null
      if (allocationId && (!allocation || Number(allocation.SoTyreID) !== soTyreId)) {
        throw new Error(`Allocation ${allocationId} does not belong to SoTyreID ${soTyreId}`)
      }
      if (allocation && (Number(line.storageManagerId ?? line.StorageManagerID ?? allocation.StorageManagerID) !== Number(allocation.StorageManagerID) ||
          Number(line.storageManagerBatchId ?? line.StorageManagerBatchID ?? allocation.StorageManagerBatchID) !== Number(allocation.StorageManagerBatchID))) {
        throw new Error(`Allocation ${allocationId} stock location does not match the source allocation`)
      }
      requestedBySoTyre.set(soTyreId, (requestedBySoTyre.get(soTyreId) || 0) + returnedQty)
      requestedByAllocation.set(allocationId, (requestedByAllocation.get(allocationId) || 0) + returnedQty)

      const unitPrice = Number(line.unitPrice || line.UnitPrice || soTyre.Price || 0)
      const lineAmount = returnedQty * unitPrice

      salesReturnLineRepo.createSalesReturnLine({
        SalesReturnID: temp.SalesReturnID,
        SoTyreID: soTyreId,
        TyreID: soTyre.TyreID,
        SerialNo: line.serialNo || line.SerialNo || null,
        ReturnedQty: returnedQty,
        UnitPrice: unitPrice,
        LineAmount: lineAmount,
        ReturnReason: line.returnReason || line.ReturnReason || null,
        AllocationID: allocationId,
        StorageManagerID: allocation?.StorageManagerID ?? line.storageManagerId ?? line.StorageManagerID ?? null,
        StorageManagerBatchID: allocation?.StorageManagerBatchID ?? line.storageManagerBatchId ?? line.StorageManagerBatchID ?? null,
        ConditionId: null,
        DispositionId: null,
        Inspected: 0,
        Approved: 0,
        InspectionNotes: null,
      })
    }

    for (const [soTyreId, requestedQty] of requestedBySoTyre) {
      const soldLine = soTyresRepo.getSoTyreById(soTyreId)
      const legacyReturned = soTyreReturnRepo.getReturnedQtyBySoTyreId(soTyreId)
      const alreadyReserved = salesReturnRepo.getReservedReturnQtyBySoTyreId(soTyreId, temp.SalesReturnID)
      const remaining = Number(soldLine.Qty) - Number(legacyReturned) - Number(alreadyReserved)
      if (requestedQty > remaining) {
        throw new Error(`Return quantity (${requestedQty}) exceeds remaining returnable quantity (${Math.max(0, remaining)}) for SoTyreID ${soTyreId}`)
      }
    }
    for (const [allocationId, requestedQty] of requestedByAllocation) {
      const allocation = allocationRepo.getAllocationById(allocationId)
      const alreadyReserved = salesReturnRepo.getReservedReturnQtyByAllocationId(allocationId, temp.SalesReturnID)
      const remaining = Number(allocation.Qty) - Number(alreadyReserved)
      if (requestedQty > remaining) {
        throw new Error(`Return quantity (${requestedQty}) exceeds remaining quantity (${Math.max(0, remaining)}) for allocation ${allocationId}`)
      }
    }

    // Returned tyres are always physically received into quarantine before inspection.
    quarantineService.receiveToQuarantine({ salesReturnId: temp.SalesReturnID, receivedBy: requestedBy })

    // Also create legacy SoReturnTyres records linked to this SalesReturn for status tracking in SO Return History
    for (const line of lines) {
      const soTyreId = normalizeId(line.soTyreId || line.SoTyreID, "SoTyreID")
      const soTyre = soTyresRepo.getSoTyreById(soTyreId)
      const returnedQty = normalizeQty(line.returnedQty || line.ReturnedQty || line.Qty, "ReturnedQty")
      const allocationId = line.allocationId || line.AllocationID ? normalizeId(line.allocationId || line.AllocationID, "AllocationID") : null
      const allocation = allocationId ? allocationRepo.getAllocationById(allocationId) : null
      
      soTyreReturnRepo.createSoReturnTyres({
        SoTyreID: soTyreId,
        Qty: returnedQty,
        ReturnDate: temp.RequestedDate || temp.CreatedAt || new Date().toISOString().split('T')[0],
        Reason: line.returnReason || line.ReturnReason || payload.notes || payload.Notes || null,
        AllocationId: allocationId,
        StorageManagerID: allocation?.StorageManagerID ?? line.storageManagerId ?? line.StorageManagerID ?? null,
        StorageManagerBatchID: allocation?.StorageManagerBatchID ?? line.storageManagerBatchId ?? line.StorageManagerBatchID ?? null,
        DOT: allocation?.DOT ?? line.dot ?? null,
        SalesReturnID: temp.SalesReturnID,
        StatusId: statusRequestedId,
      })
    }

    return salesReturnRepo.getSalesReturnById(temp.SalesReturnID)
  })

  return transaction()
}

// Compatibility adapter for older renderer builds. New requests still enter the
// canonical SalesReturn workflow and are received into quarantine.
exports.createLegacyRequest = (soId, payload = {}, ctx = {}) => {
  return exports.createRequest({
    soId,
    returnType: payload.ReturnType || SALES_RETURN_TYPE_CODES.UNUSED,
    notes: payload.Reason || null,
    lines: [{
      soTyreId: payload.SoTyreID,
      returnedQty: payload.Qty,
      unitPrice: payload.Price,
      returnReason: payload.Reason,
      allocationId: payload.AllocationId,
      storageManagerId: payload.StorageManagerID,
      storageManagerBatchId: payload.StorageManagerBatchID,
      serialNo: payload.SerialNo ?? null,
    }],
  }, ctx)
}

exports.inspectAndApprove = async (payload = {}, ctx = {}) => {
  const salesReturnId = normalizeId(payload.salesReturnId || payload.SalesReturnID, "SalesReturnID")
  const inspectedBy = payload.inspectedBy || payload.InspectedBy || null
  const approvedBy = payload.approvedBy || payload.ApprovedBy || inspectedBy
  const salesReturn = salesReturnRepo.getSalesReturnById(salesReturnId)
  if (!salesReturn) {
    throw new Error(`Sales Return with ID ${salesReturnId} not found`)
  }
  if (![SALES_RETURN_STATUS_CODES.RECEIVED_IN_QUARANTINE, SALES_RETURN_STATUS_CODES.REQUESTED, SALES_RETURN_STATUS_CODES.UNDER_INSPECTION].includes(salesReturn.StatusCode)) {
    throw new Error(`Sales Return ${salesReturn.ReturnNo} is not awaiting inspection`)
  }
  const transaction = db.transaction(() => {
    const lines = salesReturnLineRepo.getSalesReturnLinesBySalesReturnId(salesReturnId)
    const updates = Array.isArray(payload.lines) ? payload.lines : []
    if (!lines.length || updates.length !== lines.length) throw new Error("Inspect every return line before completing inspection")
    const updatesById = new Map(updates.map((update) => [Number(update.salesReturnLineId || update.SalesReturnLineID), update]))
    let approvedCount = 0
    for (const line of lines) {
      const update = updatesById.get(Number(line.SalesReturnLineID))
      if (!update) throw new Error(`Missing inspection for SalesReturnLineID ${line.SalesReturnLineID}`)
      const condition = update.condition || update.Condition
      const disposition = update.disposition || update.Disposition
      if (!condition || !disposition || typeof update.approved !== "boolean") throw new Error("Inspection requires a condition, disposition, and explicit approval decision for every line")
      const conditionId = getSalesReturnConditionIdByCode(condition)
      const dispositionId = getSalesReturnDispositionIdByCode(disposition)
      if (!conditionId || !dispositionId) throw new Error(`Invalid inspection condition or disposition for SalesReturnLineID ${line.SalesReturnLineID}`)
      if (disposition === SALES_RETURN_DISPOSITION_CODES.RESTOCK_SALEABLE && condition !== SALES_RETURN_CONDITION_CODES.NEW_UNUSED) {
        throw new Error("Only new, unused tyres can be released to saleable stock")
      }
      const approved = update.approved ? 1 : 0
      approvedCount += approved
      salesReturnLineRepo.updateSalesReturnLineInspection(line.SalesReturnLineID, {
        ConditionId: conditionId,
        DispositionId: dispositionId,
        Inspected: 1,
        Approved: approved,
        InspectionNotes: update.inspectionNotes || update.InspectionNotes || null,
      })
    }
    if (approvedCount) {
      salesReturnRepo.updateSalesReturnStatus(salesReturnId, getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.APPROVED), {
        InspectedBy: inspectedBy, setInspectedDate: true, ApprovedBy: approvedBy, setApprovedDate: true,
      })
      const rejectedLineIds = lines
        .filter((line) => !updatesById.get(Number(line.SalesReturnLineID)).approved)
        .map((line) => line.SalesReturnLineID)
      if (rejectedLineIds.length) {
        quarantineService.returnRejectedToCustomer({ salesReturnId, rejectedBy: approvedBy, salesReturnLineIds: rejectedLineIds })
      }
    } else {
      salesReturnRepo.updateSalesReturnStatus(salesReturnId, getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.REJECTED), {
        InspectedBy: inspectedBy, setInspectedDate: true, ApprovedBy: approvedBy, setApprovedDate: true,
        RejectionReason: payload.rejectionReason || "All return lines were rejected during inspection",
      })
      quarantineService.returnRejectedToCustomer({ salesReturnId, rejectedBy: approvedBy, rejectionReason: payload.rejectionReason })
    }
  })
  transaction()

  const updated = salesReturnRepo.getSalesReturnById(salesReturnId)
  if (updated.StatusCode === SALES_RETURN_STATUS_CODES.APPROVED && updated.InvoiceID) {
    const existingCreditNotes = creditNoteService.getCreditNotesBySalesReturnId(salesReturnId)
    if (!existingCreditNotes.length) await creditNoteService.createCreditNoteFromSalesReturn(salesReturnId, approvedBy)
  }
  return salesReturnRepo.getSalesReturnById(salesReturnId)
}

exports.receiveToQuarantine = (payload = {}, ctx = {}) => {
  return quarantineService.receiveToQuarantine(payload, ctx)
}

exports.transferToSaleable = (payload = {}, ctx = {}) => {
  return quarantineService.transferToSaleable(payload, ctx)
}

exports.moveToScrapOrSupplier = (payload = {}, ctx = {}) => {
  return quarantineService.moveToScrapOrSupplier(payload, ctx)
}

exports.getSalesReturnById = (salesReturnId) => {
  const id = normalizeId(salesReturnId, "SalesReturnID")
  return salesReturnRepo.getSalesReturnById(id)
}

exports.getAllSalesReturns = () => salesReturnRepo.getAllSalesReturns()

exports.linkExchangeSalesOrder = (payload = {}) => {
  const salesReturnId = normalizeId(payload.salesReturnId || payload.SalesReturnID, "SalesReturnID")
  const exchangeSoId = normalizeId(payload.exchangeSoId || payload.ExchangeSoID, "ExchangeSoID")
  const salesReturn = salesReturnRepo.getSalesReturnById(salesReturnId)
  if (!salesReturn) throw new Error(`Sales Return with ID ${salesReturnId} not found`)
  if (salesReturn.ReturnTypeCode !== SALES_RETURN_TYPE_CODES.EXCHANGE) throw new Error("Only exchange returns can be linked to a replacement Sales Order")
  if (![SALES_RETURN_STATUS_CODES.APPROVED, SALES_RETURN_STATUS_CODES.RECEIVED_IN_STOCK, SALES_RETURN_STATUS_CODES.CREDIT_ISSUED].includes(salesReturn.StatusCode)) {
    throw new Error("Approve and inspect the return before linking replacement tyres")
  }
  if (exchangeSoId === Number(salesReturn.SoID)) throw new Error("Replacement Sales Order must be different from the original order")
  if (!soRepo.getSOById(exchangeSoId)) throw new Error(`Replacement Sales Order ${exchangeSoId} not found`)
  salesReturnRepo.updateSalesReturnStatus(salesReturnId, salesReturn.StatusId, { ExchangeSoID: exchangeSoId })
  return salesReturnRepo.getSalesReturnById(salesReturnId)
}

exports.getSalesReturnDetails = (salesReturnId) => {
  const id = normalizeId(salesReturnId, "SalesReturnID")
  const salesReturn = salesReturnRepo.getSalesReturnById(id)
  if (!salesReturn) return null
  const lines = salesReturnLineRepo.getSalesReturnLinesBySalesReturnId(id)
  const legacyRefunds = salesReturnRepo.getSalesReturnRefundsBySalesReturnId(id)
  const refunds = creditNoteService.getRefundsBySalesReturnId(id)
  const warranties = salesReturnRepo.getWarrantyClaimsBySalesReturnId(id)
  const stockMovements = salesReturnLineRepo.getSalesReturnStockMovementsBySalesReturnId(id)
  const creditNotes = creditNoteService.getCreditNotesBySalesReturnId(id)
  return {
    salesReturn,
    lines,
    refunds,
    legacyRefunds,
    warranties,
    stockMovements,
    creditNotes,
  }
}

exports.reject = (payload = {}, ctx = {}) => {
  const transaction = db.transaction(() => {
    const salesReturnId = normalizeId(payload.salesReturnId || payload.SalesReturnID, "SalesReturnID")
    const rejectedBy = payload.rejectedBy || payload.RejectedBy || null
    const statusRejectedId = getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.REJECTED)
    if (!statusRejectedId) {
      throw new Error("Sales return status REJECTED not initialized")
    }
    salesReturnRepo.updateSalesReturnStatus(salesReturnId, statusRejectedId, {
      ApprovedBy: rejectedBy,
      setApprovedDate: true,
      RejectionReason: payload.rejectionReason || payload.RejectionReason || null,
    })
    quarantineService.returnRejectedToCustomer({
      salesReturnId,
      rejectedBy,
      rejectionReason: payload.rejectionReason || payload.RejectionReason || null,
    })
    return salesReturnRepo.getSalesReturnById(salesReturnId)
  })
  return transaction()
}
