// Invoice status and source lookup constants.
// Mirrors the StatusM / StorageSourceM pattern: the codes below are the single
// source of truth, are seeded into InvoiceStatusM / InvoiceSourceM, and the
// Invoice row stores the resolved lookup Id (StatusId / SourceTypeId).

const INVOICE_STATUS_CODES = {
  DRAFT: 'dft',
  ISSUED: 'iss',
  PARTIALLY_PAID: 'par',
  PAID: 'paid',
  OVERDUE: 'ovd',
  CANCELLED: 'can',
}

const INVOICE_STATUS_NAMES = {
  [INVOICE_STATUS_CODES.DRAFT]: 'Draft',
  [INVOICE_STATUS_CODES.ISSUED]: 'Issued',
  [INVOICE_STATUS_CODES.PARTIALLY_PAID]: 'Partially Paid',
  [INVOICE_STATUS_CODES.PAID]: 'Paid',
  [INVOICE_STATUS_CODES.OVERDUE]: 'Overdue',
  [INVOICE_STATUS_CODES.CANCELLED]: 'Cancelled',
}

const INVOICE_STATUS_IDS = {
  // These will be populated at runtime from database
  DRAFT: null,
  ISSUED: null,
  PARTIALLY_PAID: null,
  PAID: null,
  OVERDUE: null,
  CANCELLED: null,
}

// Invoice status seed data - single source of truth for seeding.
const INVOICE_STATUS_SEED_DATA = Object.keys(INVOICE_STATUS_CODES).map((key) => [
  INVOICE_STATUS_CODES[key],
  INVOICE_STATUS_NAMES[INVOICE_STATUS_CODES[key]],
])

const INVOICE_SOURCE_CODES = {
  SO: 'so',
  OTHER_SERVICE: 'other_service',
  DIRECT: 'direct',
  DELIVERY: 'delivery',
  DAG: 'dag',
}

const INVOICE_SOURCE_NAMES = {
  [INVOICE_SOURCE_CODES.SO]: 'Sales Order',
  [INVOICE_SOURCE_CODES.OTHER_SERVICE]: 'Other Service',
  [INVOICE_SOURCE_CODES.DIRECT]: 'Direct',
  [INVOICE_SOURCE_CODES.DELIVERY]: 'Delivery',
  [INVOICE_SOURCE_CODES.DAG]: 'DAG Retreading',
}

const INVOICE_SOURCE_IDS = {
  // These will be populated at runtime from database
  SO: null,
  OTHER_SERVICE: null,
  DIRECT: null,
  DELIVERY: null,
  DAG: null,
}

// Invoice source seed data - single source of truth for seeding.
const INVOICE_SOURCE_SEED_DATA = Object.keys(INVOICE_SOURCE_CODES).map((key) => [
  INVOICE_SOURCE_CODES[key],
  INVOICE_SOURCE_NAMES[INVOICE_SOURCE_CODES[key]],
])

const getInvoiceStatusCode = (statusKey) => INVOICE_STATUS_CODES[statusKey]

const getInvoiceStatusName = (code) => INVOICE_STATUS_NAMES[code]

const getInvoiceStatusId = (statusKey) => INVOICE_STATUS_IDS[statusKey]

const getInvoiceStatusIdByCode = (code) => {
  const key = Object.keys(INVOICE_STATUS_CODES).find((k) => INVOICE_STATUS_CODES[k] === code)
  return key ? INVOICE_STATUS_IDS[key] : null
}

const initializeInvoiceStatusIds = (db) => {
  Object.keys(INVOICE_STATUS_CODES).forEach((key) => {
    const status = db
      .prepare("SELECT Id FROM InvoiceStatusM WHERE StatusCode = ?")
      .get(INVOICE_STATUS_CODES[key])

    if (status) {
      INVOICE_STATUS_IDS[key] = status.Id
    }
  })
}

const getInvoiceSourceCode = (sourceKey) => INVOICE_SOURCE_CODES[sourceKey]

const getInvoiceSourceName = (code) => INVOICE_SOURCE_NAMES[code]

const getInvoiceSourceId = (sourceKey) => INVOICE_SOURCE_IDS[sourceKey]

const getInvoiceSourceIdByCode = (code) => {
  const key = Object.keys(INVOICE_SOURCE_CODES).find((k) => INVOICE_SOURCE_CODES[k] === code)
  return key ? INVOICE_SOURCE_IDS[key] : null
}

const initializeInvoiceSourceIds = (db) => {
  Object.keys(INVOICE_SOURCE_CODES).forEach((key) => {
    const source = db
      .prepare("SELECT Id FROM InvoiceSourceM WHERE SourceCode = ?")
      .get(INVOICE_SOURCE_CODES[key])

    if (source) {
      INVOICE_SOURCE_IDS[key] = source.Id
    }
  })
}

module.exports = {
  INVOICE_STATUS_CODES,
  INVOICE_STATUS_NAMES,
  INVOICE_STATUS_IDS,
  INVOICE_STATUS_SEED_DATA,
  INVOICE_SOURCE_CODES,
  INVOICE_SOURCE_NAMES,
  INVOICE_SOURCE_IDS,
  INVOICE_SOURCE_SEED_DATA,
  getInvoiceStatusCode,
  getInvoiceStatusName,
  getInvoiceStatusId,
  getInvoiceStatusIdByCode,
  initializeInvoiceStatusIds,
  getInvoiceSourceCode,
  getInvoiceSourceName,
  getInvoiceSourceId,
  getInvoiceSourceIdByCode,
  initializeInvoiceSourceIds,
}
