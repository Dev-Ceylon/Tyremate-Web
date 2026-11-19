// Payment type constants for the application
// Centralizes payment codes and names to avoid hardcoding throughout the codebase

const PAYMENT_TYPE_CODES = {
  CASH: 'csh',
  CREDIT: 'crd',
  CHEQUE: 'chq',
  BANK_TRANSFER: 'btr'
}

const PAYMENT_TYPE_NAMES = {
  [PAYMENT_TYPE_CODES.CASH]: 'Cash',
  [PAYMENT_TYPE_CODES.CREDIT]: 'Credit',
  [PAYMENT_TYPE_CODES.CHEQUE]: 'Cheque',
  [PAYMENT_TYPE_CODES.BANK_TRANSFER]: 'Bank Transfer'
}

// Actual liquid payment instruments available for payment settlement
// (excludes credit which is an accounts receivable term)
const PAYMENT_INSTRUMENT_CODES = {
  CASH: PAYMENT_TYPE_CODES.CASH,
  CHEQUE: PAYMENT_TYPE_CODES.CHEQUE,
  BANK_TRANSFER: PAYMENT_TYPE_CODES.BANK_TRANSFER,
}

// Payment method filter codes for reports, ledgers, and audit queries
const PAYMENT_METHOD_FILTERS = {
  ALL: 'ALL',
  CASH: PAYMENT_TYPE_CODES.CASH,
  BANK_TRANSFER: PAYMENT_TYPE_CODES.BANK_TRANSFER,
  CHEQUE: PAYMENT_TYPE_CODES.CHEQUE,
}

const PAYMENT_METHOD_FILTER_LABELS = {
  [PAYMENT_METHOD_FILTERS.ALL]: 'All Instruments',
  [PAYMENT_METHOD_FILTERS.CASH]: 'Cash',
  [PAYMENT_METHOD_FILTERS.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_METHOD_FILTERS.CHEQUE]: 'Cheque',
}

const PAYMENT_TYPE_IDS = {
  // These will be populated at runtime from database
  CASH: null,
  CREDIT: null,
  CHEQUE: null,
  BANK_TRANSFER: null
}

// Payment type seed data - single source of truth for seeding
const PAYMENT_TYPE_SEED_DATA = [
  [PAYMENT_TYPE_CODES.CASH, PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CASH]],
  [PAYMENT_TYPE_CODES.CREDIT, PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CREDIT]],
  [PAYMENT_TYPE_CODES.CHEQUE, PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CHEQUE]],
  [PAYMENT_TYPE_CODES.BANK_TRANSFER, PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.BANK_TRANSFER]]
]

const getPaymentTypeCode = (type) => PAYMENT_TYPE_CODES[type]

const getPaymentTypeName = (code) => PAYMENT_TYPE_NAMES[code]

const getPaymentTypeId = (typeKey) => PAYMENT_TYPE_IDS[typeKey]

const getPaymentTypeIdByCode = (code) => {
  const key = Object.keys(PAYMENT_TYPE_CODES).find(k => PAYMENT_TYPE_CODES[k] === code)
  return key ? PAYMENT_TYPE_IDS[key] : null
}

const initializePaymentTypeIds = (db) => {
  Object.keys(PAYMENT_TYPE_CODES).forEach(key => {
    const type = db
      .prepare("SELECT ID FROM PaymentTypeM WHERE PaymentTypeCode = ?")
      .get(PAYMENT_TYPE_CODES[key])
    
    if (type) {
      PAYMENT_TYPE_IDS[key] = type.ID
    }
  })
}

module.exports = {
  PAYMENT_TYPE_CODES,
  PAYMENT_TYPE_NAMES,
  PAYMENT_INSTRUMENT_CODES,
  PAYMENT_METHOD_FILTERS,
  PAYMENT_METHOD_FILTER_LABELS,
  PAYMENT_TYPE_IDS,
  PAYMENT_TYPE_SEED_DATA,
  getPaymentTypeCode,
  getPaymentTypeName,
  getPaymentTypeId,
  getPaymentTypeIdByCode,
  initializePaymentTypeIds,
}