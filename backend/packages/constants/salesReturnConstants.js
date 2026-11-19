// Sales Return constants for the application.
// Centralizes return type, condition, disposition, status and warranty handling
// codes to avoid hardcoding throughout the codebase.

const SALES_RETURN_TYPE = Object.freeze({
  UNUSED: { code: 'UNUSED', name: 'Unused' },
  DEFECTIVE: { code: 'DEFECTIVE', name: 'Defective' },
  FITTED: { code: 'FITTED', name: 'Fitted' },
  EXCHANGE: { code: 'EXCHANGE', name: 'Exchange' },
})

const SALES_RETURN_CONDITION = Object.freeze({
  NEW_UNUSED: { code: 'NEW_UNUSED', name: 'New/Unused' },
  USED_FITTED: { code: 'USED_FITTED', name: 'Used/Fitted' },
  DEFECTIVE: { code: 'DEFECTIVE', name: 'Defective' },
  DAMAGED: { code: 'DAMAGED', name: 'Damaged' },
  OTHER: { code: 'OTHER', name: 'Other' },
})

const SALES_RETURN_DISPOSITION = Object.freeze({
  RESTOCK_SALEABLE: { code: 'RESTOCK_SALEABLE', name: 'Restock to Saleable' },
  QUARANTINE: { code: 'QUARANTINE', name: 'Keep in Quarantine' },
  SCRAP: { code: 'SCRAP', name: 'Scrap' },
  RETURN_TO_SUPPLIER: { code: 'RETURN_TO_SUPPLIER', name: 'Return to Supplier' },
})

const SALES_RETURN_STATUS = Object.freeze({
  REQUESTED: { code: 'REQUESTED', name: 'Requested' },
  UNDER_INSPECTION: { code: 'UNDER_INSPECTION', name: 'Under Inspection' },
  APPROVED: { code: 'APPROVED', name: 'Approved' },
  REJECTED: { code: 'REJECTED', name: 'Rejected' },
  RECEIVED_IN_QUARANTINE: { code: 'RECEIVED_IN_QUARANTINE', name: 'Received in Quarantine' },
  RECEIVED_IN_STOCK: { code: 'RECEIVED_IN_STOCK', name: 'Received in Stock' },
  CREDIT_ISSUED: { code: 'CREDIT_ISSUED', name: 'Credit Note Issued' },
  REFUNDED: { code: 'REFUNDED', name: 'Refunded/Store Credit Issued' },
  REPLACEMENT_COMPLETED: { code: 'REPLACEMENT_COMPLETED', name: 'Replacement Completed' },
  CLOSED: { code: 'CLOSED', name: 'Closed' },
  CANCELLED: { code: 'CANCELLED', name: 'Cancelled' },
})

const SALES_RETURN_WARRANTY_HANDLING = Object.freeze({
  SHOP_HANDLES_IMMEDIATELY: { code: 'SHOP_HANDLES_IMMEDIATELY', name: 'Shop Handles Immediately' },
  SUPPLIER_INSPECTION_FIRST: { code: 'SUPPLIER_INSPECTION_FIRST', name: 'Supplier Inspection First' },
})

const SALES_RETURN_TYPE_CODES = Object.freeze({
  UNUSED: SALES_RETURN_TYPE.UNUSED.code,
  DEFECTIVE: SALES_RETURN_TYPE.DEFECTIVE.code,
  FITTED: SALES_RETURN_TYPE.FITTED.code,
  EXCHANGE: SALES_RETURN_TYPE.EXCHANGE.code,
})

const SALES_RETURN_CONDITION_CODES = Object.freeze({
  NEW_UNUSED: SALES_RETURN_CONDITION.NEW_UNUSED.code,
  USED_FITTED: SALES_RETURN_CONDITION.USED_FITTED.code,
  DEFECTIVE: SALES_RETURN_CONDITION.DEFECTIVE.code,
  DAMAGED: SALES_RETURN_CONDITION.DAMAGED.code,
  OTHER: SALES_RETURN_CONDITION.OTHER.code,
})

const SALES_RETURN_DISPOSITION_CODES = Object.freeze({
  RESTOCK_SALEABLE: SALES_RETURN_DISPOSITION.RESTOCK_SALEABLE.code,
  QUARANTINE: SALES_RETURN_DISPOSITION.QUARANTINE.code,
  SCRAP: SALES_RETURN_DISPOSITION.SCRAP.code,
  RETURN_TO_SUPPLIER: SALES_RETURN_DISPOSITION.RETURN_TO_SUPPLIER.code,
})

const SALES_RETURN_STATUS_CODES = Object.freeze({
  REQUESTED: SALES_RETURN_STATUS.REQUESTED.code,
  UNDER_INSPECTION: SALES_RETURN_STATUS.UNDER_INSPECTION.code,
  APPROVED: SALES_RETURN_STATUS.APPROVED.code,
  REJECTED: SALES_RETURN_STATUS.REJECTED.code,
  RECEIVED_IN_QUARANTINE: SALES_RETURN_STATUS.RECEIVED_IN_QUARANTINE.code,
  RECEIVED_IN_STOCK: SALES_RETURN_STATUS.RECEIVED_IN_STOCK.code,
  CREDIT_ISSUED: SALES_RETURN_STATUS.CREDIT_ISSUED.code,
  REFUNDED: SALES_RETURN_STATUS.REFUNDED.code,
  REPLACEMENT_COMPLETED: SALES_RETURN_STATUS.REPLACEMENT_COMPLETED.code,
  CLOSED: SALES_RETURN_STATUS.CLOSED.code,
  CANCELLED: SALES_RETURN_STATUS.CANCELLED.code,
})

const SALES_RETURN_WARRANTY_HANDLING_CODES = Object.freeze({
  SHOP_HANDLES_IMMEDIATELY: SALES_RETURN_WARRANTY_HANDLING.SHOP_HANDLES_IMMEDIATELY.code,
  SUPPLIER_INSPECTION_FIRST: SALES_RETURN_WARRANTY_HANDLING.SUPPLIER_INSPECTION_FIRST.code,
})

const SALES_RETURN_TYPE_SEED_DATA = Object.keys(SALES_RETURN_TYPE).map((key) => [
  SALES_RETURN_TYPE[key].code,
  SALES_RETURN_TYPE[key].name,
])

const SALES_RETURN_CONDITION_SEED_DATA = Object.keys(SALES_RETURN_CONDITION).map((key) => [
  SALES_RETURN_CONDITION[key].code,
  SALES_RETURN_CONDITION[key].name,
])

const SALES_RETURN_DISPOSITION_SEED_DATA = Object.keys(SALES_RETURN_DISPOSITION).map((key) => [
  SALES_RETURN_DISPOSITION[key].code,
  SALES_RETURN_DISPOSITION[key].name,
])

const SALES_RETURN_STATUS_SEED_DATA = Object.keys(SALES_RETURN_STATUS).map((key) => [
  SALES_RETURN_STATUS[key].code,
  SALES_RETURN_STATUS[key].name,
])

const SALES_RETURN_WARRANTY_HANDLING_SEED_DATA = Object.keys(SALES_RETURN_WARRANTY_HANDLING).map((key) => [
  SALES_RETURN_WARRANTY_HANDLING[key].code,
  SALES_RETURN_WARRANTY_HANDLING[key].name,
])

const SALES_RETURN_TYPE_IDS = { UNUSED: null, DEFECTIVE: null, FITTED: null, EXCHANGE: null }
const SALES_RETURN_CONDITION_IDS = { NEW_UNUSED: null, USED_FITTED: null, DEFECTIVE: null, DAMAGED: null, OTHER: null }
const SALES_RETURN_DISPOSITION_IDS = { RESTOCK_SALEABLE: null, QUARANTINE: null, SCRAP: null, RETURN_TO_SUPPLIER: null }
const SALES_RETURN_STATUS_IDS = { REQUESTED: null, UNDER_INSPECTION: null, APPROVED: null, REJECTED: null, RECEIVED_IN_QUARANTINE: null, RECEIVED_IN_STOCK: null, CREDIT_ISSUED: null, REFUNDED: null, REPLACEMENT_COMPLETED: null, CLOSED: null, CANCELLED: null }
const SALES_RETURN_WARRANTY_HANDLING_IDS = { SHOP_HANDLES_IMMEDIATELY: null, SUPPLIER_INSPECTION_FIRST: null }

const getSalesReturnTypeCode = (key) => SALES_RETURN_TYPE_CODES[key]
const getSalesReturnTypeName = (code) => {
  const entry = Object.values(SALES_RETURN_TYPE).find((item) => item.code === code)
  return entry ? entry.name : null
}
const getSalesReturnTypeId = (key) => SALES_RETURN_TYPE_IDS[key]
const getSalesReturnTypeIdByCode = (code) => {
  const key = Object.keys(SALES_RETURN_TYPE_CODES).find((k) => SALES_RETURN_TYPE_CODES[k] === code)
  return key ? SALES_RETURN_TYPE_IDS[key] : null
}
const initializeSalesReturnTypeIds = (db) => {
  SALES_RETURN_TYPE_SEED_DATA.forEach(([code]) => {
    const row = db.prepare("SELECT Id FROM SalesReturnTypeM WHERE TypeCode = ?").get(code)
    if (row) {
      const key = Object.keys(SALES_RETURN_TYPE_CODES).find((k) => SALES_RETURN_TYPE_CODES[k] === code)
      if (key) SALES_RETURN_TYPE_IDS[key] = row.Id
    }
  })
}

const getSalesReturnConditionCode = (key) => SALES_RETURN_CONDITION_CODES[key]
const getSalesReturnConditionName = (code) => {
  const entry = Object.values(SALES_RETURN_CONDITION).find((item) => item.code === code)
  return entry ? entry.name : null
}
const getSalesReturnConditionId = (key) => SALES_RETURN_CONDITION_IDS[key]
const getSalesReturnConditionIdByCode = (code) => {
  const key = Object.keys(SALES_RETURN_CONDITION_CODES).find((k) => SALES_RETURN_CONDITION_CODES[k] === code)
  return key ? SALES_RETURN_CONDITION_IDS[key] : null
}
const initializeSalesReturnConditionIds = (db) => {
  SALES_RETURN_CONDITION_SEED_DATA.forEach(([code]) => {
    const row = db.prepare("SELECT Id FROM SalesReturnConditionM WHERE ConditionCode = ?").get(code)
    if (row) {
      const key = Object.keys(SALES_RETURN_CONDITION_CODES).find((k) => SALES_RETURN_CONDITION_CODES[k] === code)
      if (key) SALES_RETURN_CONDITION_IDS[key] = row.Id
    }
  })
}

const getSalesReturnDispositionCode = (key) => SALES_RETURN_DISPOSITION_CODES[key]
const getSalesReturnDispositionName = (code) => {
  const entry = Object.values(SALES_RETURN_DISPOSITION).find((item) => item.code === code)
  return entry ? entry.name : null
}
const getSalesReturnDispositionId = (key) => SALES_RETURN_DISPOSITION_IDS[key]
const getSalesReturnDispositionIdByCode = (code) => {
  const key = Object.keys(SALES_RETURN_DISPOSITION_CODES).find((k) => SALES_RETURN_DISPOSITION_CODES[k] === code)
  return key ? SALES_RETURN_DISPOSITION_IDS[key] : null
}
const initializeSalesReturnDispositionIds = (db) => {
  SALES_RETURN_DISPOSITION_SEED_DATA.forEach(([code]) => {
    const row = db.prepare("SELECT Id FROM SalesReturnDispositionM WHERE DispositionCode = ?").get(code)
    if (row) {
      const key = Object.keys(SALES_RETURN_DISPOSITION_CODES).find((k) => SALES_RETURN_DISPOSITION_CODES[k] === code)
      if (key) SALES_RETURN_DISPOSITION_IDS[key] = row.Id
    }
  })
}

const getSalesReturnStatusCode = (key) => SALES_RETURN_STATUS_CODES[key]
const getSalesReturnStatusName = (code) => {
  const entry = Object.values(SALES_RETURN_STATUS).find((item) => item.code === code)
  return entry ? entry.name : null
}
const getSalesReturnStatusId = (key) => SALES_RETURN_STATUS_IDS[key]
const getSalesReturnStatusIdByCode = (code) => {
  const key = Object.keys(SALES_RETURN_STATUS_CODES).find((k) => SALES_RETURN_STATUS_CODES[k] === code)
  return key ? SALES_RETURN_STATUS_IDS[key] : null
}
const initializeSalesReturnStatusIds = (db) => {
  SALES_RETURN_STATUS_SEED_DATA.forEach(([code]) => {
    const row = db.prepare("SELECT Id FROM SalesReturnStatusM WHERE StatusCode = ?").get(code)
    if (row) {
      const key = Object.keys(SALES_RETURN_STATUS_CODES).find((k) => SALES_RETURN_STATUS_CODES[k] === code)
      if (key) SALES_RETURN_STATUS_IDS[key] = row.Id
    }
  })
}

const getSalesReturnWarrantyHandlingCode = (key) => SALES_RETURN_WARRANTY_HANDLING_CODES[key]
const getSalesReturnWarrantyHandlingName = (code) => {
  const entry = Object.values(SALES_RETURN_WARRANTY_HANDLING).find((item) => item.code === code)
  return entry ? entry.name : null
}
const getSalesReturnWarrantyHandlingId = (key) => SALES_RETURN_WARRANTY_HANDLING_IDS[key]
const getSalesReturnWarrantyHandlingIdByCode = (code) => {
  const key = Object.keys(SALES_RETURN_WARRANTY_HANDLING_CODES).find((k) => SALES_RETURN_WARRANTY_HANDLING_CODES[k] === code)
  return key ? SALES_RETURN_WARRANTY_HANDLING_IDS[key] : null
}
const initializeSalesReturnWarrantyHandlingIds = (db) => {
  SALES_RETURN_WARRANTY_HANDLING_SEED_DATA.forEach(([code]) => {
    const row = db.prepare("SELECT Id FROM SalesReturnWarrantyHandlingM WHERE HandlingCode = ?").get(code)
    if (row) {
      const key = Object.keys(SALES_RETURN_WARRANTY_HANDLING_CODES).find((k) => SALES_RETURN_WARRANTY_HANDLING_CODES[k] === code)
      if (key) SALES_RETURN_WARRANTY_HANDLING_IDS[key] = row.Id
    }
  })
}

module.exports = {
  SALES_RETURN_TYPE,
  SALES_RETURN_CONDITION,
  SALES_RETURN_DISPOSITION,
  SALES_RETURN_STATUS,
  SALES_RETURN_WARRANTY_HANDLING,
  SALES_RETURN_TYPE_CODES,
  SALES_RETURN_CONDITION_CODES,
  SALES_RETURN_DISPOSITION_CODES,
  SALES_RETURN_STATUS_CODES,
  SALES_RETURN_WARRANTY_HANDLING_CODES,
  SALES_RETURN_TYPE_IDS,
  SALES_RETURN_CONDITION_IDS,
  SALES_RETURN_DISPOSITION_IDS,
  SALES_RETURN_STATUS_IDS,
  SALES_RETURN_WARRANTY_HANDLING_IDS,
  SALES_RETURN_TYPE_SEED_DATA,
  SALES_RETURN_CONDITION_SEED_DATA,
  SALES_RETURN_DISPOSITION_SEED_DATA,
  SALES_RETURN_STATUS_SEED_DATA,
  SALES_RETURN_WARRANTY_HANDLING_SEED_DATA,
  getSalesReturnTypeCode,
  getSalesReturnTypeName,
  getSalesReturnTypeId,
  getSalesReturnTypeIdByCode,
  initializeSalesReturnTypeIds,
  getSalesReturnConditionCode,
  getSalesReturnConditionName,
  getSalesReturnConditionId,
  getSalesReturnConditionIdByCode,
  initializeSalesReturnConditionIds,
  getSalesReturnDispositionCode,
  getSalesReturnDispositionName,
  getSalesReturnDispositionId,
  getSalesReturnDispositionIdByCode,
  initializeSalesReturnDispositionIds,
  getSalesReturnStatusCode,
  getSalesReturnStatusName,
  getSalesReturnStatusId,
  getSalesReturnStatusIdByCode,
  initializeSalesReturnStatusIds,
  getSalesReturnWarrantyHandlingCode,
  getSalesReturnWarrantyHandlingName,
  getSalesReturnWarrantyHandlingId,
  getSalesReturnWarrantyHandlingIdByCode,
  initializeSalesReturnWarrantyHandlingIds,
}
