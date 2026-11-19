const db = require("../database/connection")
const dagGoodsReceiptRepo = require("../repositories/dagGoodsReceiptRepository")
const pendingDagGoodsReceiptRepo = require("../repositories/pendingDagGoodsReceiptRepository")
const storageManagerRepo = require("../repositories/storageManagerRepository")
const storageManagerService = require("./storageManagerService")
const storageLocationRepo = require("../repositories/storageLocationRepository")
const dagTyreStorageRepo = require("../repositories/dagTyreStorageRepository")
const dagTyresRepo = require("../repositories/dagTyresRepository")
const { getStorageSourceId } = require("../constants/storageSourceConstants")

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

const resolveCreatedBy = (ctx) => {
  const { user, changedBy } = ctx ?? {}
  return user?.displayName || user?.username || changedBy || null
}

/**
 * DAG stock that has reached the Arrived state sits in the branch's quarantine
 * location until it is formally received. Listing is a straight read; the
 * destination location shown is only a preview of where posting will place it.
 */
exports.getPendingDagGoodsReceipts = () => {
  return pendingDagGoodsReceiptRepo.getPendingDagGoodsReceipts()
}

/**
 * Posts a DAG goods receipt: records the GRN and releases the accepted quantity
 * from the quarantine lot back into the DAG tyre line's own storage location so
 * it becomes sellable stock. Rejected/undelivered units stay in quarantine so
 * they can be handled separately. Everything runs in one transaction.
 */
exports.postDagGoodsReceipt = (payload = {}, ctx) => {
  const sourceLotId = normalizeId(payload.SourceStorageManagerID, "SourceStorageManagerID")
  const receiptDate = normalizeReceiptDate(payload.ReceiptDate)
  const dispatchedQty = normalizeQty(payload.DispatchedQty ?? 0, "DispatchedQty")
  const receivedQty = normalizeQty(payload.ReceivedQty, "ReceivedQty", false)
  const acceptedQty = normalizeQty(payload.AcceptedQty ?? 0, "AcceptedQty")
  const damagedQty = normalizeQty(payload.DamagedQty ?? 0, "DamagedQty")
  const discrepancyReason = String(payload.DiscrepancyReason ?? "").trim() || null

  const sourceLot = storageManagerRepo.getStorageManagerById(sourceLotId)
  if (!sourceLot) {
    throw new Error("Storage lot not found")
  }

  if (receivedQty > Number(sourceLot.Qty)) {
    throw new Error("Received quantity cannot exceed the quantity in quarantine")
  }
  if (acceptedQty > receivedQty) {
    throw new Error("Accepted quantity cannot exceed the received quantity")
  }
  if (damagedQty > receivedQty - acceptedQty) {
    throw new Error("Damaged quantity must be no greater than the rejected quantity")
  }

  const shortage = Math.max(dispatchedQty - receivedQty, 0)
  const overReceipt = Math.max(receivedQty - dispatchedQty, 0)

  if ((shortage > 0 || overReceipt > 0 || damagedQty > 0) && !discrepancyReason) {
    throw new Error("Add a discrepancy reason for shortages, over-receipts, or damaged tyres")
  }

  const sourceLocation = storageLocationRepo.getStorageLocationById(sourceLot.LocationID)
  if (!sourceLocation || String(sourceLocation.LocationTypeCode).toLowerCase() !== "q-tine") {
    throw new Error("The source lot is not in a quarantine location")
  }

  const sourceTypeId = getStorageSourceId("DAG")
  if (sourceLot.SourceTypeId !== sourceTypeId) {
    throw new Error("The source lot was not received from a DAG")
  }

  // Released stock must return to the location assigned to its DAG tyre line,
  // not an arbitrary branch location. The quarantine lot is linked to that line
  // through DagTyreStorage, so the link is the source of truth for the target.
  const link = dagTyreStorageRepo.getDagTyreStoragesByStorageManagerId(sourceLotId)[0] || null
  if (!link) {
    throw new Error("This stock is not linked to a DAG tyre line, so its receiving location cannot be determined")
  }

  const dagTyre = dagTyresRepo.getDAGTyreById(link.DAGTyresID)
  if (!dagTyre || !dagTyre.StorageLocationID) {
    throw new Error("The DAG tyre line has no receiving location assigned")
  }

  const destination = storageLocationRepo.getStorageLocationById(dagTyre.StorageLocationID)
  if (!destination) {
    throw new Error("The DAG tyre receiving location no longer exists")
  }

  const dagId = normalizeId(sourceLot.SourceId, "DAGID")

  return db.transaction(() => {
    const receipt = dagGoodsReceiptRepo.createDagGoodsReceipt({
      DAGID: dagId,
      ReceiptDate: receiptDate,
      DeliveryNoteNumber: String(payload.DeliveryNoteNumber ?? "").trim() || null,
      CreatedBy: resolveCreatedBy(ctx),
    })

    const lineId = dagGoodsReceiptRepo.createDagGoodsReceiptLine({
      GoodsReceiptID: receipt.ID,
      DAGID: dagId,
      DAGTyresID: link.DAGTyresID,
      SourceStorageManagerID: sourceLotId,
      DestinationLocationID: destination.Id,
      DispatchedQty: dispatchedQty,
      ReceivedQty: receivedQty,
      AcceptedQty: acceptedQty,
      DamagedQty: damagedQty,
      ShortageQty: shortage,
      OverReceiptQty: overReceipt,
      DiscrepancyReason: discrepancyReason,
    })

    if (acceptedQty > 0) {
      if (acceptedQty === Number(sourceLot.Qty)) {
        storageManagerService.updateStorageManager(sourceLotId, {
          TyreId: sourceLot.TyreId,
          LocationID: destination.Id,
          Qty: acceptedQty,
        })
      } else {
        storageManagerService.updateStorageManager(sourceLotId, {
          TyreId: sourceLot.TyreId,
          LocationID: sourceLot.LocationID,
          Qty: Number(sourceLot.Qty) - acceptedQty,
        })
        storageManagerService.createStorageManager({
          TyreId: sourceLot.TyreId,
          LocationID: destination.Id,
          Qty: acceptedQty,
          SourceTypeId: sourceTypeId,
          SourceId: dagId,
          CreatedBy: resolveCreatedBy(ctx),
        })
      }
    }

    return { ...receipt, GoodsReceiptLineID: lineId, ReceivedQty: receivedQty, AcceptedQty: acceptedQty }
  })()
}
