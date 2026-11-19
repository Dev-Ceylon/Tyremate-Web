const db = require("../database/connection")
const goodsReceiptRepo = require("../repositories/goodsReceiptRepository")
const pendingGoodsReceiptRepo = require("../repositories/pendingGoodsReceiptRepository")
const poRepo = require("../repositories/poRepository")
const poTyresRepo = require("../repositories/poTyresRepository")
const soTyresRepo = require("../repositories/soTyresRepository")
const poTyresSuppliersRepo = require("../repositories/poTyresSuppliersRepository")
const poTyreAllocationsRepo = require("../repositories/poTyreAllocationsRepository")
const storageManagerService = require("./storageManagerService")
const poTyresService = require("./poTyresService")
const poService = require("./poService")
const poAuditLogService = require("./poAuditLogService")
const { STATUS_CODES } = require("../constants/statusConstants")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")

const normalizeId = (value, name) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a valid positive integer`)
  return parsed
}

const normalizeQty = (value, name, allowZero = true) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < (allowZero ? 0 : 1)) {
    throw new Error(`${name} must be a valid ${allowZero ? "non-negative" : "positive"} integer`)
  }
  return parsed
}

const localToday = () => {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
}

const normalizeReceiptDate = (value) => {
  const date = String(value ?? "").trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Receipt date must be in YYYY-MM-DD format")
  }

  const [year, month, day] = date.split("-").map(Number)
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
    throw new Error("Receipt date must be a valid calendar date")
  }

  return date
}

const normalizeBatches = (batches) => {
  if (!Array.isArray(batches) || batches.length === 0) {
    throw new Error("Enter at least one DOT batch for this receipt")
  }

  return batches.map((batch, index) => {
    const receivedQty = normalizeQty(batch.ReceivedQty, `Batches[${index}].ReceivedQty`, false)
    const acceptedQty = normalizeQty(batch.AcceptedQty, `Batches[${index}].AcceptedQty`)
    const dot = batch.DOT === undefined || batch.DOT === null ? null : String(batch.DOT).trim() || null
    if (acceptedQty > receivedQty) {
      throw new Error(`Batches[${index}].AcceptedQty cannot exceed its received quantity`)
    }
    if (dot && (!/^\d{4}$/.test(dot) || Number(dot.slice(0, 2)) < 1 || Number(dot.slice(0, 2)) > 53)) {
      throw new Error(`Batches[${index}].DOT must be a valid WWYY code`)
    }
    return {
      DOT: dot,
      ReceivedQty: receivedQty,
      AcceptedQty: acceptedQty,
    }
  })
}

const resolveCreatedBy = (ctx) => {
  const { user, changedBy } = ctx ?? {}
  return user?.displayName || user?.username || changedBy || null
}

exports.getGoodsReceiptsByPoId = (poId) => {
  const normalizedPoId = normalizeId(poId, "POID")
  if (!poRepo.getPOById(normalizedPoId)) throw new Error("PO not found")

  return goodsReceiptRepo.getGoodsReceiptsByPoId(normalizedPoId).map((line) => ({
    ...line,
    Batches: goodsReceiptRepo.getGoodsReceiptBatchesByLineId(line.GoodsReceiptLineID),
  }))
}

exports.getPendingGoodsReceipts = (filters = {}) => {
  const normalized = {}

  if (filters.POID != null) normalized.POID = normalizeId(filters.POID, "POID")
  if (filters.SupplierID != null) normalized.SupplierID = normalizeId(filters.SupplierID, "SupplierID")
  if (filters.PoTyresID != null) normalized.PoTyresID = normalizeId(filters.PoTyresID, "PoTyresID")

  if (filters.ExpectedFrom != null) normalized.ExpectedFrom = normalizeReceiptDate(filters.ExpectedFrom)
  if (filters.ExpectedTo != null) normalized.ExpectedTo = normalizeReceiptDate(filters.ExpectedTo)

  if (
    normalized.ExpectedFrom &&
    normalized.ExpectedTo &&
    normalized.ExpectedFrom > normalized.ExpectedTo
  ) {
    throw new Error("ExpectedFrom cannot be after ExpectedTo")
  }

  normalized.OverdueOnly = Boolean(filters.OverdueOnly)
  if (normalized.OverdueOnly) normalized.TodayDate = localToday()

  return pendingGoodsReceiptRepo.getPendingGoodsReceipts(normalized)
}

exports.countPendingGoodsReceipts = (filters = {}) => {
  return exports.getPendingGoodsReceipts(filters).length
}

exports.postGoodsReceipt = (payload = {}, ctx) => {
  const poId = normalizeId(payload.POID, "POID")
  const allocationId = normalizeId(payload.PoTyresSupplierID, "PoTyresSupplierID")
  const receiptDate = normalizeReceiptDate(payload.ReceiptDate)
  const dispatchedQty = normalizeQty(payload.DispatchedQty ?? 0, "DispatchedQty")
  const damagedQty = normalizeQty(payload.DamagedQty ?? 0, "DamagedQty")
  const batches = normalizeBatches(payload.Batches)
  const receivedQty = batches.reduce((sum, batch) => sum + batch.ReceivedQty, 0)
  const acceptedQty = batches.reduce((sum, batch) => sum + batch.AcceptedQty, 0)
  const rejectedQty = receivedQty - acceptedQty

  if (receivedQty <= 0) throw new Error("Received quantity must be greater than zero")
  if (damagedQty > rejectedQty) throw new Error("Damaged quantity cannot exceed the rejected quantity")

  const allocation = poTyresSuppliersRepo.getPoTyresSupplierById(allocationId)
  if (!allocation) throw new Error("PO supplier allocation not found")
  if (Number(allocation.IsApproved) !== 1) throw new Error("Only approved supplier allocations can receive goods")

  const poTyre = poTyresRepo.getPoTyreById(allocation.PoTyresID)
  if (!poTyre || Number(poTyre.POID) !== poId) throw new Error("Supplier allocation does not belong to this PO")
  if (poTyre.StatusCode !== STATUS_CODES.ARRIVING) throw new Error("The PO tyre line must be Arriving before goods can be received")

  const po = poRepo.getPOById(poId)
  if (!po || po.StatusCode !== STATUS_CODES.PENDING) {
    throw new Error("Goods can only be received while the PO is Pending; completion is automatic after all tyre lines arrive")
  }

  const location = poTyreAllocationsRepo.getAllocationForPOAndTyreID(poId, poTyre.ID)
  if (!location) throw new Error("Allocate a storage location to this tyre line before posting its GRN")

  const allocationReceivedToDate = goodsReceiptRepo.getGoodsReceiptsByPoId(poId)
    .filter((receiptLine) => Number(receiptLine.PoTyresSupplierID) === allocationId)
    .reduce((total, receiptLine) => total + Number(receiptLine.ReceivedQty), 0)
  const acceptedForLineBeforeReceipt = goodsReceiptRepo.getPostedAcceptedQtyByPoTyresId(poTyre.ID)
  const shortageQty = Math.max(dispatchedQty - receivedQty, 0)
  const overReceiptQty = Math.max(receivedQty - dispatchedQty, 0)
  const discrepancyReason = String(payload.DiscrepancyReason ?? "").trim() || null

  if ((shortageQty > 0 || overReceiptQty > 0 || damagedQty > 0) && !discrepancyReason) {
    throw new Error("Add a discrepancy reason for shortages, over-receipts, or damaged tyres")
  }

  return db.transaction(() => {
    const receipt = goodsReceiptRepo.createGoodsReceipt({
      POID: poId,
      SupplierID: allocation.SupplierID,
      ReceiptDate: receiptDate,
      DeliveryNoteNumber: String(payload.DeliveryNoteNumber ?? "").trim() || null,
      CreatedBy: resolveCreatedBy(ctx),
    })
    const lineId = goodsReceiptRepo.createGoodsReceiptLine({
      GoodsReceiptID: receipt.ID,
      PoTyresID: poTyre.ID,
      PoTyresSupplierID: allocationId,
      LocationID: location.LocationId,
      DispatchedQty: dispatchedQty,
      ReceivedQty: receivedQty,
      AcceptedQty: acceptedQty,
      DamagedQty: damagedQty,
      ShortageQty: shortageQty,
      OverReceiptQty: overReceiptQty,
      DiscrepancyReason: discrepancyReason,
    })

    for (const batch of batches) {
      goodsReceiptRepo.createGoodsReceiptBatch({ GoodsReceiptLineID: lineId, ...batch })
    }

    const acceptedBatches = batches
      .filter((batch) => batch.AcceptedQty > 0)
      .map((batch) => ({ DOT: batch.DOT, Qty: batch.AcceptedQty }))

    if (acceptedQty > 0) {
      storageManagerService.addArrivedPOToStorage(poTyre.TyreID, location.LocationId, acceptedQty, {
        orderId: poId,
        batches: acceptedBatches,
        ctx,
      })

      // If this PO was created for a Sales Order, immediately reserve the arrived stock
      // for the order so it is ready for customer collection, and reduce the remaining "to order" need.
      if (po.SoID) {
        poService.allocateArrivedStockToSo(po.SoID, poId, poTyre.TyreID)
      }
    }

    const receivedForAllocation = allocationReceivedToDate + receivedQty
    if (receivedForAllocation >= Number(allocation.Qty) && !allocation.ActualDeliveryDate) {
      const localNow = new Date()
      const actualDate = [localNow.getFullYear(), String(localNow.getMonth() + 1).padStart(2, "0"), String(localNow.getDate()).padStart(2, "0")].join("-")
      poTyresSuppliersRepo.setActualDeliveryDateById(allocationId, actualDate)
    }

    const acceptedForLine = acceptedForLineBeforeReceipt + acceptedQty
    const currentPoTyre = poTyresRepo.getPoTyreById(poTyre.ID)
    if (acceptedForLine >= Number(poTyre.Qty) && currentPoTyre?.StatusCode === STATUS_CODES.ARRIVING) {
      poTyresService.updatePoTyreStatus(poTyre.ID, STATUS_CODES.ARRIVED)
    }

    poService.completePOWhenAllTyreLinesArrived(poId, ctx)
    poAuditLogService.recordPOAction({
      action: AUDIT_ACTIONS.CREATE,
      poId,
      eventData: {
        goodsReceiptId: receipt.ID,
        grnNumber: receipt.GRNNumber,
        poTyresId: poTyre.ID,
        supplierAllocationId: allocationId,
        receivedQty,
        acceptedQty,
        damagedQty,
        shortageQty,
        overReceiptQty,
      },
      before: null,
      after: { ...receipt, GoodsReceiptLineID: lineId },
      ctx,
    })

    return { ...receipt, GoodsReceiptLineID: lineId, ReceivedQty: receivedQty, AcceptedQty: acceptedQty }
  })()
}