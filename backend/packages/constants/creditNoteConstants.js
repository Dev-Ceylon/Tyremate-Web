/**
 * Credit Note Constants - Lookup Codes, Seed Data, ID Maps & Initializers
 * Follows pattern: quarantineConstants.js, salesReturnConstants.js
 */

// ============================================
// STATUS CODES
// ============================================
export const CREDIT_NOTE_STATUS_CODES = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  REFUNDED: 'REFUNDED',
  CREDITED: 'CREDITED',
  CANCELLED: 'CANCELLED',
}

export const CREDIT_NOTE_STATUS_NAMES = {
  [CREDIT_NOTE_STATUS_CODES.REQUESTED]: 'Requested',
  [CREDIT_NOTE_STATUS_CODES.APPROVED]: 'Approved',
  [CREDIT_NOTE_STATUS_CODES.REFUNDED]: 'Refunded',
  [CREDIT_NOTE_STATUS_CODES.CREDITED]: 'Credited to Account',
  [CREDIT_NOTE_STATUS_CODES.CANCELLED]: 'Cancelled',
}

export const CREDIT_NOTE_STATUS_SEED_DATA = [
  [CREDIT_NOTE_STATUS_CODES.REQUESTED, 'Requested'],
  [CREDIT_NOTE_STATUS_CODES.APPROVED, 'Approved'],
  [CREDIT_NOTE_STATUS_CODES.REFUNDED, 'Refunded'],
  [CREDIT_NOTE_STATUS_CODES.CREDITED, 'Credited to Account'],
  [CREDIT_NOTE_STATUS_CODES.CANCELLED, 'Cancelled'],
]

// ID Map (populated at runtime)
export const CREDIT_NOTE_STATUS_IDS = {}

// Getter
export function getCreditNoteStatusIdByCode(code) {
  return CREDIT_NOTE_STATUS_IDS[code] ?? null
}

// Initializer
export function initializeCreditNoteStatusIds(db) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO CreditNoteStatusM (StatusCode, StatusName, SortOrder, IsActive)
    VALUES (?, ?, ?, 1)
  `)
  CREDIT_NOTE_STATUS_SEED_DATA.forEach(([code, name], index) => {
    stmt.run(code, name, index)
  })
  const rows = db.prepare('SELECT Id, StatusCode FROM CreditNoteStatusM').all()
  rows.forEach(r => { CREDIT_NOTE_STATUS_IDS[r.StatusCode] = r.Id })
}

// ============================================
// REASON CODES
// ============================================
export const CREDIT_NOTE_REASON_CODES = {
  RETURN_UNUSED: 'RETURN_UNUSED',
  DEFECTIVE: 'DEFECTIVE',
  EXCHANGE: 'EXCHANGE',
  PRICING_ERROR: 'PRICING_ERROR',
  DAMAGED_IN_TRANSIT: 'DAMAGED_IN_TRANSIT',
  WRONG_ITEM: 'WRONG_ITEM',
  GOODWILL: 'GOODWILL',
  OTHER: 'OTHER',
}

export const CREDIT_NOTE_REASON_NAMES = {
  [CREDIT_NOTE_REASON_CODES.RETURN_UNUSED]: 'Return - Unused',
  [CREDIT_NOTE_REASON_CODES.DEFECTIVE]: 'Defective / Warranty',
  [CREDIT_NOTE_REASON_CODES.EXCHANGE]: 'Exchange / Replacement',
  [CREDIT_NOTE_REASON_CODES.PRICING_ERROR]: 'Pricing Error',
  [CREDIT_NOTE_REASON_CODES.DAMAGED_IN_TRANSIT]: 'Damaged in Transit',
  [CREDIT_NOTE_REASON_CODES.WRONG_ITEM]: 'Wrong Item Shipped',
  [CREDIT_NOTE_REASON_CODES.GOODWILL]: 'Goodwill / Customer Service',
  [CREDIT_NOTE_REASON_CODES.OTHER]: 'Other',
}

export const CREDIT_NOTE_REASON_SEED_DATA = [
  [CREDIT_NOTE_REASON_CODES.RETURN_UNUSED, 'Return - Unused'],
  [CREDIT_NOTE_REASON_CODES.DEFECTIVE, 'Defective / Warranty'],
  [CREDIT_NOTE_REASON_CODES.EXCHANGE, 'Exchange / Replacement'],
  [CREDIT_NOTE_REASON_CODES.PRICING_ERROR, 'Pricing Error'],
  [CREDIT_NOTE_REASON_CODES.DAMAGED_IN_TRANSIT, 'Damaged in Transit'],
  [CREDIT_NOTE_REASON_CODES.WRONG_ITEM, 'Wrong Item Shipped'],
  [CREDIT_NOTE_REASON_CODES.GOODWILL, 'Goodwill / Customer Service'],
  [CREDIT_NOTE_REASON_CODES.OTHER, 'Other'],
]

export const CREDIT_NOTE_REASON_IDS = {}

export function getCreditNoteReasonIdByCode(code) {
  return CREDIT_NOTE_REASON_IDS[code] ?? null
}

export function initializeCreditNoteReasonIds(db) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO CreditNoteReasonM (ReasonCode, ReasonName, SortOrder, IsActive)
    VALUES (?, ?, ?, 1)
  `)
  CREDIT_NOTE_REASON_SEED_DATA.forEach(([code, name], index) => {
    stmt.run(code, name, index)
  })
  const rows = db.prepare('SELECT Id, ReasonCode FROM CreditNoteReasonM').all()
  rows.forEach(r => { CREDIT_NOTE_REASON_IDS[r.ReasonCode] = r.Id })
}

// ============================================
// SOURCE CODES
// ============================================
export const CREDIT_NOTE_SOURCE_CODES = {
  SALES_RETURN: 'SALES_RETURN',
  PRICE_ADJUSTMENT: 'PRICE_ADJUSTMENT',
  DISPUTE: 'DISPUTE',
  GOODWILL: 'GOODWILL',
  MANUAL: 'MANUAL',
}

export const CREDIT_NOTE_SOURCE_NAMES = {
  [CREDIT_NOTE_SOURCE_CODES.SALES_RETURN]: 'Sales Return',
  [CREDIT_NOTE_SOURCE_CODES.PRICE_ADJUSTMENT]: 'Price Adjustment',
  [CREDIT_NOTE_SOURCE_CODES.DISPUTE]: 'Customer Dispute',
  [CREDIT_NOTE_SOURCE_CODES.GOODWILL]: 'Goodwill',
  [CREDIT_NOTE_SOURCE_CODES.MANUAL]: 'Manual Entry',
}

export const CREDIT_NOTE_SOURCE_SEED_DATA = [
  [CREDIT_NOTE_SOURCE_CODES.SALES_RETURN, 'Sales Return'],
  [CREDIT_NOTE_SOURCE_CODES.PRICE_ADJUSTMENT, 'Price Adjustment'],
  [CREDIT_NOTE_SOURCE_CODES.DISPUTE, 'Customer Dispute'],
  [CREDIT_NOTE_SOURCE_CODES.GOODWILL, 'Goodwill'],
  [CREDIT_NOTE_SOURCE_CODES.MANUAL, 'Manual Entry'],
]

export const CREDIT_NOTE_SOURCE_IDS = {}

export function getCreditNoteSourceIdByCode(code) {
  return CREDIT_NOTE_SOURCE_IDS[code] ?? null
}

export function initializeCreditNoteSourceIds(db) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO CreditNoteSourceM (SourceCode, SourceName, SortOrder, IsActive)
    VALUES (?, ?, ?, 1)
  `)
  CREDIT_NOTE_SOURCE_SEED_DATA.forEach(([code, name], index) => {
    stmt.run(code, name, index)
  })
  const rows = db.prepare('SELECT Id, SourceCode FROM CreditNoteSourceM').all()
  rows.forEach(r => { CREDIT_NOTE_SOURCE_IDS[r.SourceCode] = r.Id })
}

// ============================================
// REFUND METHOD CODES
// ============================================
export const REFUND_METHOD_CODES = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
  STORE_CREDIT: 'STORE_CREDIT',
}

export const REFUND_METHOD_NAMES = {
  [REFUND_METHOD_CODES.CASH]: 'Cash',
  [REFUND_METHOD_CODES.CARD]: 'Card',
  [REFUND_METHOD_CODES.BANK_TRANSFER]: 'Bank Transfer',
  [REFUND_METHOD_CODES.CHEQUE]: 'Cheque',
  [REFUND_METHOD_CODES.STORE_CREDIT]: 'Store Credit',
}

export const REFUND_METHOD_SEED_DATA = [
  [REFUND_METHOD_CODES.CASH, 'Cash'],
  [REFUND_METHOD_CODES.CARD, 'Card'],
  [REFUND_METHOD_CODES.BANK_TRANSFER, 'Bank Transfer'],
  [REFUND_METHOD_CODES.CHEQUE, 'Cheque'],
  [REFUND_METHOD_CODES.STORE_CREDIT, 'Store Credit'],
]

export const REFUND_METHOD_IDS = {}

export function getRefundMethodIdByCode(code) {
  return REFUND_METHOD_IDS[code] ?? null
}

export function initializeRefundMethodIds(db) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO RefundMethodM (MethodCode, MethodName, SortOrder, IsActive)
    VALUES (?, ?, ?, 1)
  `)
  REFUND_METHOD_SEED_DATA.forEach(([code, name], index) => {
    stmt.run(code, name, index)
  })
  const rows = db.prepare('SELECT Id, MethodCode FROM RefundMethodM').all()
  rows.forEach(r => { REFUND_METHOD_IDS[r.MethodCode] = r.Id })
}

// ============================================
// CREDIT TRANSACTION TYPE CODES
// ============================================
export const CREDIT_TRANSACTION_TYPE_CODES = {
  ISSUED: 'ISSUED',
  USED: 'USED',
  REFUNDED: 'REFUNDED',
  EXPIRED: 'EXPIRED',
  ADJUSTED: 'ADJUSTED',
}

export const CREDIT_TRANSACTION_TYPE_NAMES = {
  [CREDIT_TRANSACTION_TYPE_CODES.ISSUED]: 'Credit Issued',
  [CREDIT_TRANSACTION_TYPE_CODES.USED]: 'Credit Used',
  [CREDIT_TRANSACTION_TYPE_CODES.REFUNDED]: 'Refunded',
  [CREDIT_TRANSACTION_TYPE_CODES.EXPIRED]: 'Expired',
  [CREDIT_TRANSACTION_TYPE_CODES.ADJUSTED]: 'Adjusted',
}

export const CREDIT_TRANSACTION_TYPE_SEED_DATA = [
  [CREDIT_TRANSACTION_TYPE_CODES.ISSUED, 'Credit Issued'],
  [CREDIT_TRANSACTION_TYPE_CODES.USED, 'Credit Used'],
  [CREDIT_TRANSACTION_TYPE_CODES.REFUNDED, 'Refunded'],
  [CREDIT_TRANSACTION_TYPE_CODES.EXPIRED, 'Expired'],
  [CREDIT_TRANSACTION_TYPE_CODES.ADJUSTED, 'Adjusted'],
]

export const CREDIT_TRANSACTION_TYPE_IDS = {}

export function getCreditTransactionTypeIdByCode(code) {
  return CREDIT_TRANSACTION_TYPE_IDS[code] ?? null
}

export function initializeCreditTransactionTypeIds(db) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO CreditTransactionTypeM (TypeCode, TypeName, SortOrder, IsActive)
    VALUES (?, ?, ?, 1)
  `)
  CREDIT_TRANSACTION_TYPE_SEED_DATA.forEach(([code, name], index) => {
    stmt.run(code, name, index)
  })
  const rows = db.prepare('SELECT Id, TypeCode FROM CreditTransactionTypeM').all()
  rows.forEach(r => { CREDIT_TRANSACTION_TYPE_IDS[r.TypeCode] = r.Id })
}

// ============================================
// REFUND STATUS CODES
// ============================================
export const REFUND_STATUS_CODES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
}

export const REFUND_STATUS_NAMES = {
  [REFUND_STATUS_CODES.PENDING]: 'Pending',
  [REFUND_STATUS_CODES.PROCESSING]: 'Processing',
  [REFUND_STATUS_CODES.COMPLETED]: 'Completed',
  [REFUND_STATUS_CODES.FAILED]: 'Failed',
  [REFUND_STATUS_CODES.CANCELLED]: 'Cancelled',
}

export const REFUND_STATUS_SEED_DATA = [
  [REFUND_STATUS_CODES.PENDING, 'Pending'],
  [REFUND_STATUS_CODES.PROCESSING, 'Processing'],
  [REFUND_STATUS_CODES.COMPLETED, 'Completed'],
  [REFUND_STATUS_CODES.FAILED, 'Failed'],
  [REFUND_STATUS_CODES.CANCELLED, 'Cancelled'],
]

export const REFUND_STATUS_IDS = {}

export function getRefundStatusIdByCode(code) {
  return REFUND_STATUS_IDS[code] ?? null
}

export function initializeRefundStatusIds(db) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO RefundStatusM (StatusCode, StatusName, SortOrder, IsActive)
    VALUES (?, ?, ?, 1)
  `)
  REFUND_STATUS_SEED_DATA.forEach(([code, name], index) => {
    stmt.run(code, name, index)
  })
  const rows = db.prepare('SELECT Id, StatusCode FROM RefundStatusM').all()
  rows.forEach(r => { REFUND_STATUS_IDS[r.StatusCode] = r.Id })
}

// ============================================
// MASTER INITIALIZER
// ============================================
export function initializeAllCreditNoteLookups(db) {
  initializeCreditNoteStatusIds(db)
  initializeCreditNoteReasonIds(db)
  initializeCreditNoteSourceIds(db)
  initializeRefundMethodIds(db)
  initializeCreditTransactionTypeIds(db)
  initializeRefundStatusIds(db)
}