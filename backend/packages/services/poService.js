const db = require("../database/connection")
const poRepo = require("../repositories/poRepository")
const poTyresRepo = require("../repositories/poTyresRepository")
const soTyresRepo = require("../repositories/soTyresRepository")
const storageManagerRepo = require("../repositories/storageManagerRepository")
const storageManagerBatchRepo = require("../repositories/storageManagerBatchRepository")
const soAllocationRepo = require("../repositories/soTyreStorageAllocationRepository")
const poTyresSuppliersRepo = require("../repositories/poTyresSuppliersRepository")
const poTyreBatchesRepo = require("../repositories/poTyreBatchesRepository")
const poTyreAllocationsRepo = require("../repositories/poTyreAllocationsRepository")
const poTyreAllocationsService = require("./poTyreAllocationsService")
const storageManagerService = require("./storageManagerService")
const soReminderService = require("./soReminderService")
const reminderService = require("./reminderService")
const poAuditLogService = require("./poAuditLogService")
const inquiryPoService = require("./inquiryPoService")
const { STATUS_CODES, getStatusId, getStatusIdByCode } = require("../constants/statusConstants")
const { getPoNextStatus, isPoStatusTransitionAllowed, isPoStatusDeletable } = require("../constants/poStatusConstants")
const { getReminderTypeId } = require("../constants/reminderTypeConstants")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")

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

  if (!Number.isInteger(parsed) || (parsed !== 0 && parsed !== 1)) {
    throw new Error(`${fieldName} must be 0 or 1`)
  }

  return parsed
}

const normalizeDate = (value) => {
  if (value === undefined || value === null || value === "") {
    return new Date().toISOString().slice(0, 10)
  }

  const normalized = String(value).trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("Date must be in YYYY-MM-DD format")
  }

  return normalized
}

const toPOPayload = (payload = {}) => {
  return {
    SoID: normalizeId(payload.SoID, "SoID"),
    IsAdminApproved: normalizeBooleanFlag(payload.IsAdminApproved, "IsAdminApproved"),
    IsSupplierApproved: normalizeBooleanFlag(payload.IsSupplierApproved, "IsSupplierApproved"),
    Date: normalizeDate(payload.Date),
  }
}

const toStandalonePOPayload = (payload = {}) => {
  return {
    IsAdminApproved: normalizeBooleanFlag(payload.IsAdminApproved, "IsAdminApproved"),
    IsSupplierApproved: normalizeBooleanFlag(payload.IsSupplierApproved, "IsSupplierApproved"),
    Date: normalizeDate(payload.Date),
  }
}

const resolveLineStatusId = (line, fallbackStatusId = null) => {
  if (line.StatusID !== undefined && line.StatusID !== null && line.StatusID !== "") {
    return Number(line.StatusID)
  }

  if (line.StatusCode) {
    const statusId = getStatusIdByCode(String(line.StatusCode).trim())
    if (statusId) {
      return statusId
    }
  }

  return fallbackStatusId
}

const syncPoTyreStatusesWithParentStatus = (poId, statusCode) => {
  const statusId = getStatusIdByCode(statusCode)
  if (!statusId) {
    return
  }

  const tyres = poTyresRepo.getPoTyresByPoId(poId)
  tyres.forEach((tyre) => {
    const tyreId = tyre.ID || tyre.Id
    if (!tyreId) {
      return
    }

    poTyresRepo.updateStatus(tyreId, statusId)
  })
}

exports.getPOs = () => {
  return poRepo.getAllPOs()
}

exports.getPendingPOCount = () => {
  return poRepo.getPendingPOCount()
}

exports.getPOById = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const po = poRepo.getPOById(normalizedId)

  if (!po) {
    throw new Error("PO not found")
  }

  // Aggregate lines with tyre details
  const tyres = poTyresRepo.getPoTyresByPoId(normalizedId)

  // Aggregate allocations to check storage status
  const allocations = poTyreAllocationsRepo.getAllocationsByPoId(normalizedId)

  // Aggregate supplier allocations for each line
  const tyresWithSuppliers = tyres.map(tyre => {
    const tyreId = tyre.ID || tyre.Id
    const suppliers = poTyresSuppliersRepo.getPoTyresSuppliersByPoTyresId(tyreId)
    const batches = poTyreBatchesRepo.getBatchesByPoTyresId(tyreId)

    return {
      ...tyre,
      Suppliers: suppliers,
      Batches: batches,
      IsBatchManaged: batches.length > 0
    }
  })

  // Determine SupplierFeedback status
  let allSuppliersHaveFeedback = true;
  for (const tyre of tyresWithSuppliers) {
    for (const supplier of tyre.Suppliers) {
      if (supplier.IsApproved === null) {
        allSuppliersHaveFeedback = false;
        break;
      }
    }
  }

  // Determine isStoragesAllocated status
  const isStoragesAllocated = tyres.length > 0 && tyres.every(tyre => {
    const tyreLineId = tyre.ID || tyre.Id
    return allocations.some(a => a.PoTyresID === tyreLineId)
  })

  const linkedInquiries = inquiryPoService.getLinkedInquiriesByPoId(normalizedId)

  return { ...po, Tyres: tyresWithSuppliers, SupplierFeedback: allSuppliersHaveFeedback, isStoragesAllocated, LinkedInquiries: linkedInquiries };
}

// A PO may reference one inquiry (InquiryID) or several (InquiryIDs).
const collectInquiryIds = (payload = {}) => {
  const raw = []

  if (Array.isArray(payload.InquiryIDs)) {
    raw.push(...payload.InquiryIDs)
  } else if (payload.InquiryIDs !== undefined && payload.InquiryIDs !== null) {
    raw.push(payload.InquiryIDs)
  }

  if (payload.InquiryID !== undefined && payload.InquiryID !== null && payload.InquiryID !== "") {
    raw.push(payload.InquiryID)
  }

  return raw.filter((value) => value !== null && value !== undefined && value !== "")
}

exports.createPO = (payload, ctx) => {
  const po = toPOPayload(payload)
  const existing = poRepo.getPOBySoId(po.SoID)

  if (existing) {
    throw new Error("PO already exists for this SO")
  }

  const linesInput = Array.isArray(payload.Lines) ? payload.Lines : []
  const hasSuppliers = linesInput.some(line => {
    const supplierInput = line.Suppliers || line.Supplliers || []
    return Array.isArray(supplierInput) && supplierInput.length > 0
  })

  const statusId = hasSuppliers ? getStatusId('PENDING') : getStatusId('DRAFT')

  const created = poRepo.createPO({ ...po, StatusID: statusId })

  // A PO raised from an inquiry keeps a link so the inquiry can show it.
  const inquiryIds = collectInquiryIds(payload)
  if (inquiryIds.length > 0) {
    inquiryPoService.linkPoToInquiries(created.ID, inquiryIds, ctx)
  }

  poAuditLogService.recordPOAction({
    action: AUDIT_ACTIONS.CREATE,
    poId: created.ID,
    before: null,
    after: exports.getPOById(created.ID),
    ctx,
  })

  return created
}

const validateAndProcessPoLines = (poId, linesInput, defaultStatusId = null) => {
  const lines = Array.isArray(linesInput) ? linesInput : []

  return lines.map((line, index) => {
    const row = index + 1

    const tyre = {
      POID: poId,
      TyreID: normalizeId(line.TyreID, `TyreID on line ${row}`),
      Price: normalizeNumber(line.Price, `Price on line ${row}`),
      Discount: normalizeNumber(line.Discount, `Discount on line ${row}`),
      Qty: normalizeInteger(line.Qty, `Qty on line ${row}`),
      IsAdminApproved: normalizeBooleanFlag(line.IsAdminApproved, `IsAdminApproved on line ${row}`),
      StatusID: resolveLineStatusId(line, defaultStatusId),
    }

    // Support both spellings for backward compatibility during transition
    const supplierInput = line.Suppliers || line.Supplliers || []
    const suppliers = (Array.isArray(supplierInput) ? supplierInput : []).map((s, sIdx) => {
      const sRow = `Supplier ${sIdx + 1} on line ${row}`
      return {
        SupplierID: normalizeId(s.SupplierID, `SupplierID for ${sRow}`),
        Qty: normalizeInteger(s.Qty, `Qty for ${sRow}`),
        IsApproved: normalizeBooleanFlag(s.IsApproved, `IsApproved for ${sRow}`, null),
      }
    })

    return { tyre, suppliers }
  })
}

const persistPoLinesWithSuppliers = (processedLines) => {
  processedLines.forEach((item) => {
    const createdPoTyre = poTyresRepo.createPoTyre(item.tyre)
    const poTyreId = createdPoTyre.ID || createdPoTyre.Id

    if (item.suppliers && item.suppliers.length > 0) {
      item.suppliers.forEach((s) => {
        poTyresSuppliersRepo.createPoTyresSupplier({
          PoTyresID: poTyreId,
          SupplierID: s.SupplierID,
          Qty: s.Qty,
          IsApproved: s.IsApproved,
        })
      })
    }
  })
}

exports.createStandalonePO = (payload, ctx) => {
  const createTransaction = db.transaction(() => {
    const linesInput = Array.isArray(payload.Lines) ? payload.Lines : []
    const hasSuppliers = linesInput.some(line => {
      const supplierInput = line.Suppliers || line.Supplliers || []
      return Array.isArray(supplierInput) && supplierInput.length > 0
    })

    const statusId = hasSuppliers ? getStatusId('PENDING') : getStatusId('DRAFT')

    const po = {
      ...toStandalonePOPayload(payload),
      StatusID: statusId
    }
    const created = poRepo.createStandalonePO(po)
    const processedLines = validateAndProcessPoLines(created.ID, linesInput, statusId)
    persistPoLinesWithSuppliers(processedLines)

    // A PO raised from an inquiry keeps a link so the inquiry can show it.
    const inquiryIds = collectInquiryIds(payload)
    if (inquiryIds.length > 0) {
      inquiryPoService.linkPoToInquiries(created.ID, inquiryIds, ctx)
    }

    poAuditLogService.recordPOAction({
      action: AUDIT_ACTIONS.CREATE,
      poId: created.ID,
      before: null,
      after: exports.getPOById(created.ID),
      ctx,
    })

    return created
  })

  return createTransaction()
}

exports.updatePO = (id, payload, ctx) => {
  const normalizedId = normalizeId(id, "ID")

  const updateTransaction = db.transaction(() => {
    const current = poRepo.getPOById(normalizedId)
    if (!current) {
      throw new Error("PO not found")
    }

    const before = exports.getPOById(normalizedId)

    // Merge existing SoID if not in payload to satisfy toPOPayload validation
    const po = toPOPayload({
      ...payload,
      SoID: payload.SoID !== undefined ? payload.SoID : current.SoID
    })

    if (po.SoID !== current.SoID) {
      const existingTarget = poRepo.getPOBySoId(po.SoID)
      if (existingTarget && existingTarget.ID !== normalizedId) {
        throw new Error("PO already exists for this SO")
      }
    }

    const linesInput = Array.isArray(payload.Lines) ? payload.Lines : []
    const hasSuppliers = linesInput.some(line => {
      const supplierInput = line.Suppliers || line.Supplliers || []
      return Array.isArray(supplierInput) && supplierInput.length > 0
    })
    const statusId = hasSuppliers ? getStatusId('PENDING') : getStatusId('DRAFT')

    const updated = poRepo.updatePO(normalizedId, { ...po, StatusID: statusId })

    // Replace lines and suppliers to match UI state
    const existingTyres = poTyresRepo.getPoTyresByPoId(normalizedId)
    existingTyres.forEach(t => poTyresSuppliersRepo.deletePoTyresSuppliersByPoTyresId(t.ID || t.Id))
    poTyresRepo.deletePoTyresByPoId(normalizedId)
    poTyreAllocationsRepo.deleteAllocationsByPoId(normalizedId)

    // Lines inherit the parent status when the client omits one, so editing a
    // PO never silently resets its tyre lines (e.g. back to a NULL status).
    const processedLines = validateAndProcessPoLines(normalizedId, linesInput, statusId)
    persistPoLinesWithSuppliers(processedLines)

    const after = exports.getPOById(normalizedId)

    poAuditLogService.recordPOAction({
      action: AUDIT_ACTIONS.UPDATE,
      poId: normalizedId,
      before,
      after,
      ctx,
    })

    return updated
  })

  return updateTransaction()
}

exports.updateStandalonePO = (id, payload, ctx) => {
  const normalizedId = normalizeId(id, "ID")

  const updateTransaction = db.transaction(() => {
    const po = toStandalonePOPayload(payload)
    const current = poRepo.getPOById(normalizedId)

    if (!current) {
      throw new Error("PO not found")
    }

    const before = exports.getPOById(normalizedId)

    const linesInput = Array.isArray(payload.Lines) ? payload.Lines : []
    const hasSuppliers = linesInput.some(line => {
      const supplierInput = line.Suppliers || line.Supplliers || []
      return Array.isArray(supplierInput) && supplierInput.length > 0
    })
    const statusId = hasSuppliers ? getStatusId('PENDING') : getStatusId('DRAFT')

    const updated = poRepo.updateStandalonePO(normalizedId, { ...po, StatusID: statusId })

    // Replace existing lines
    const existingTyres = poTyresRepo.getPoTyresByPoId(normalizedId)
    existingTyres.forEach(t => poTyresSuppliersRepo.deletePoTyresSuppliersByPoTyresId(t.ID || t.Id))
    poTyreAllocationsRepo.deleteAllocationsByPoId(normalizedId)
    poTyresRepo.deletePoTyresByPoId(normalizedId)

    // Lines inherit the parent status when the client omits one (see updatePO).
    const processedLines = validateAndProcessPoLines(normalizedId, linesInput, statusId)
    persistPoLinesWithSuppliers(processedLines)

    const after = exports.getPOById(normalizedId)

    poAuditLogService.recordPOAction({
      action: AUDIT_ACTIONS.UPDATE,
      poId: normalizedId,
      before,
      after,
      ctx,
    })

    return updated
  })

  return updateTransaction()
}

exports.deletePO = (id, ctx) => {
  const normalizedId = normalizeId(id, "ID")

  const deleteTransaction = db.transaction(() => {
    const before = exports.getPOById(normalizedId)

    if (!isPoStatusDeletable(before.StatusCode)) {
      throw new Error(
        `PO #${normalizedId} is in status "${before.StatusCode}" and can no longer be deleted. Only draft or pending purchase orders can be removed.`
      )
    }

    // 1. Fetch child lines to clean up supplier allocations first
    const tyres = poTyresRepo.getPoTyresByPoId(normalizedId)
    tyres.forEach((t) => {
      poTyresSuppliersRepo.deletePoTyresSuppliersByPoTyresId(t.ID || t.Id)
    })

    // 2. Delete associated tyre allocations (must come before POTyres due to FK)
    poTyreAllocationsRepo.deleteAllocationsByPoId(normalizedId)

    // 3. Delete the PO tyre lines
    poTyresRepo.deletePoTyresByPoId(normalizedId)

    // 3. Delete the parent PO record
    const result = poRepo.deletePO(normalizedId)

    if (result.changes === 0) {
      throw new Error("PO not found")
    }

    poAuditLogService.recordPOAction({
      action: AUDIT_ACTIONS.DELETE,
      poId: normalizedId,
      before,
      after: null,
      ctx,
    })

    return { success: true }
  })

  return deleteTransaction()
}

exports.updatePOStatus = (id, statusCode, ctx) => {
  const normalizedId = normalizeId(id, "ID")

  if ([STATUS_CODES.ARRIVING, STATUS_CODES.ARRIVED, STATUS_CODES.COMPLETED].includes(statusCode)) {
    throw new Error("PO receipt status is updated automatically after all tyre lines are received through GRNs")
  }

  const statusId = getStatusIdByCode(statusCode)
  if (!statusId) {
    throw new Error(`Invalid status code: ${statusCode}`)
  }

  const updateTransaction = db.transaction(() => {
    const current = poRepo.getPOById(normalizedId)
    if (!current) {
      throw new Error("PO not found")
    }

    const before = exports.getPOById(normalizedId)

    // Idempotency: re-setting the current status is a no-op.
    if (current.StatusCode === statusCode) {
      return current
    }

    // Enforce a strictly sequential lifecycle (defined in statusConstants).
    if (!isPoStatusTransitionAllowed(current.StatusCode, statusCode)) {
      throw new Error(
        `Cannot move PO from "${current.StatusCode}" to "${statusCode}". Expected next status: "${getPoNextStatus(current.StatusCode)}".`
      )
    }

    if (statusCode === STATUS_CODES.ARRIVED) {
      const tyres = poTyresRepo.getPoTyresByPoId(normalizedId)
      const unbatchedLines = tyres.filter(
        (tyre) => poTyreBatchesRepo.getBatchesByPoTyresId(tyre.ID || tyre.Id).length === 0
      )

      if (unbatchedLines.length > 0) {
        throw new Error(
          `${unbatchedLines.length} tyre line item${unbatchedLines.length > 1 ? "s have" : " has"} no batch managed. Manage batches before marking the PO as arrived.`
        )
      }
    }

    const updated = poRepo.updateStatus(normalizedId, statusId)
    if (!updated) {
      throw new Error("Failed to update PO status")
    }

    if (statusCode === STATUS_CODES.PENDING || statusCode === STATUS_CODES.ARRIVING || statusCode === STATUS_CODES.ARRIVED || statusCode === STATUS_CODES.COMPLETED || statusCode === STATUS_CODES.DRAFT) {
      syncPoTyreStatusesWithParentStatus(normalizedId, statusCode)
    }

    if (statusCode === STATUS_CODES.ARRIVED) {
      const tyres = poTyresRepo.getPoTyresByPoId(normalizedId)
      for (const tyre of tyres) {
        if (tyre.LocationId) {
          storageManagerService.addArrivedPOToStorage(tyre.TyreID, tyre.LocationId, tyre.Qty, {
            orderId: normalizedId,
            batches: poTyreBatchesRepo.getBatchesByPoTyresId(tyre.ID || tyre.Id),
            ctx,
          })
        }
      }

      if (current.SoID) {
        createSoFollowUpReminder(current.SoID, normalizedId)
      }
    }

    const after = exports.getPOById(normalizedId)

    poAuditLogService.recordPOAction({
      action: AUDIT_ACTIONS.STATUS,
      poId: normalizedId,
      eventData: { statusCode },
      before,
      after,
      ctx,
    })

    return updated
  })

  return updateTransaction()
}

// Links stock physically received against a purchase order back to the sales
// order line it was ordered for, so the order's warehouse issue note can pick
// it. Mirrors the SO-from-stock drain: the received lot and its batches are
// reduced while SoTyreStorageAllocation rows record what leaves each location.
exports.allocateArrivedStockToSo = (soId, poId, targetTyreId = null) => {
  const poLines = poTyresRepo.getPoTyresByPoId(poId)
  const orderedTyreIds = targetTyreId
    ? [targetTyreId]
    : [...new Set(poLines.map((line) => line.TyreID))]

  orderedTyreIds.forEach((tyreId) => {
    const soTyre = soTyresRepo.getSoTyre(soId, tyreId)
    if (!soTyre) return

    // Calculate how many more tyres this SO line still needs
    const existingAllocations = soAllocationRepo.getAllocationsBySoTyreId(soTyre.ID) || []
    const totalAllocated = existingAllocations.reduce((sum, a) => sum + Number(a.Qty || 0), 0)
    let neededToAllocate = Math.max(0, Number(soTyre.Qty || 0) - totalAllocated)
    let allocatedForLine = 0

    if (neededToAllocate > 0) {
      const lots = storageManagerRepo.getStorageManagersByOrderIdAndTyreId(poId, tyreId)

      for (const lot of lots) {
        if (neededToAllocate <= 0) break
        let lotQty = Number(lot.Qty || 0)
        if (lotQty <= 0) continue

        const batches = storageManagerBatchRepo.getBatchesByStorageManagerIdOrderedByDOT(lot.Id)

        for (const batch of batches) {
          if (neededToAllocate <= 0) break
          const batchQty = Number(batch.Qty || 0)
          if (batchQty <= 0) continue

          const allocQty = Math.min(batchQty, neededToAllocate)

          soAllocationRepo.createAllocation({
            SoTyreID: soTyre.ID,
            StorageManagerID: lot.Id,
            StorageManagerBatchID: batch.Id,
            Qty: allocQty,
          })

          const remainingBatchQty = batchQty - allocQty
          storageManagerBatchRepo.updateStorageManagerBatch(batch.Id, {
            DOT: batch.DOT,
            Qty: remainingBatchQty,
          })

          lotQty -= allocQty
          neededToAllocate -= allocQty
          allocatedForLine += allocQty
        }

        // Legacy lots that never got batch rows still need to be allocated whole.
        if (batches.length === 0 && lotQty > 0 && neededToAllocate > 0) {
          const allocQty = Math.min(lotQty, neededToAllocate)
          soAllocationRepo.createAllocation({
            SoTyreID: soTyre.ID,
            StorageManagerID: lot.Id,
            StorageManagerBatchID: null,
            Qty: allocQty,
          })
          lotQty -= allocQty
          neededToAllocate -= allocQty
          allocatedForLine += allocQty
        }

        storageManagerRepo.updateStorageManager(lot.Id, {
          ...lot,
          Qty: Math.max(0, lotQty),
        })
      }
    }

    // Keep NeedToOrderQty in sync with total allocated stock
    const totalAllocatedAfter = totalAllocated + allocatedForLine
    const correctNeedToOrder = Math.max(0, Number(soTyre.Qty || 0) - totalAllocatedAfter)
    if (Number(soTyre.NeedToOrderQty) !== correctNeedToOrder) {
      soTyresRepo.setNeedToOrderQtyForSoTyre(soId, tyreId, correctNeedToOrder)
    }
  })
}

exports.completePOWhenAllTyreLinesArrived = (id, ctx) => {
  const normalizedId = normalizeId(id, "ID")
  const current = poRepo.getPOById(normalizedId)

  if (!current) throw new Error("PO not found")
  if (current.StatusCode === STATUS_CODES.COMPLETED) return current

  const tyres = poTyresRepo.getPoTyresByPoId(normalizedId)
  const uniqueTyres = [...new Map(tyres.map((tyre) => [tyre.ID || tyre.Id, tyre])).values()]
  if (uniqueTyres.length === 0 || uniqueTyres.some((tyre) => tyre.StatusCode !== STATUS_CODES.ARRIVED)) {
    return current
  }

  const completedStatusId = getStatusIdByCode(STATUS_CODES.COMPLETED)
  if (!completedStatusId) throw new Error("Completed status is not initialized")

  const before = exports.getPOById(normalizedId)
  const updated = poRepo.updateStatus(normalizedId, completedStatusId)
  if (!updated) throw new Error("Failed to complete PO after all tyre lines arrived")

  // The ordered tyres have physically arrived. Ensure all received stock
  // is tied to the order so it can be issued from the warehouse.
  if (current.SoID) {
    exports.allocateArrivedStockToSo(current.SoID, normalizedId)
  }

  if (current.SoID && current.StatusCode !== STATUS_CODES.ARRIVED) {
    createSoFollowUpReminder(current.SoID, normalizedId)
  }

  const after = exports.getPOById(normalizedId)
  poAuditLogService.recordPOAction({
    action: AUDIT_ACTIONS.STATUS,
    poId: normalizedId,
    eventData: { statusCode: STATUS_CODES.COMPLETED, reason: "all_tyres_arrived" },
    before,
    after,
    ctx,
  })

  return updated
}

const createSoFollowUpReminder = (soId, poId) => {
  const soFollowUpTypeId = getReminderTypeId('SO_FOLLOW_UP')
  const today = new Date().toISOString().slice(0, 10)

  const reminder = reminderService.createReminder({
    ReminderTypeID: soFollowUpTypeId,
    Date: today,
    IsCompleted: false
  })

  return soReminderService.createSOReminder({
    SoID: soId,
    ReminderID: reminder.ID,
    ReminderDate: today,
    ReminderNote: `SO follow-up: PO #${poId} has arrived`,
    IsDone: 0
  })
}

exports.AllocatePoTyreLocation = (payloads, ctx) => {
  if (!Array.isArray(payloads)) {
    throw new Error("AllocatePoTyreLocation expects an array of payloads.")
  }

  const createdAllocations = []

  const allocateTransaction = db.transaction(() => {
    for (const payload of payloads) {
      const newAllocation = poTyreAllocationsService.createPoTyreAllocation(payload)
      createdAllocations.push(newAllocation)
    }

    payloads.forEach((payload) => {
      const poId = normalizeId(payload.POID, "POID")

      poAuditLogService.recordPOAction({
        action: AUDIT_ACTIONS.ALLOCATE,
        poId,
        eventData: payload,
        before: null,
        after: exports.getPOById(poId),
        ctx,
      })
    })
  })

  allocateTransaction()

  return createdAllocations
}
