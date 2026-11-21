// Supplier type constants for the application
// Centralizes supplier type codes and names to avoid hardcoding throughout the codebase
// Mirrors the StatusM / PaymentTypeM pattern

const SUPPLIER_TYPE_CODES = {
  TYRES: 'tyr',
  BATTERIES: 'bat',
  CONSUMABLES: 'cns',
  GENERAL: 'gen',
}

const SUPPLIER_TYPE_NAMES = {
  [SUPPLIER_TYPE_CODES.TYRES]: 'Tyres',
  [SUPPLIER_TYPE_CODES.BATTERIES]: 'Batteries',
  [SUPPLIER_TYPE_CODES.CONSUMABLES]: 'Consumables',
  [SUPPLIER_TYPE_CODES.GENERAL]: 'General',
}

const SUPPLIER_TYPE_DESCRIPTIONS = {
  [SUPPLIER_TYPE_CODES.TYRES]: 'Suppliers providing tyres, tubes, and related wheel products',
  [SUPPLIER_TYPE_CODES.BATTERIES]: 'Suppliers providing automotive, motorcycle, and industrial batteries',
  [SUPPLIER_TYPE_CODES.CONSUMABLES]: 'Suppliers providing workshop materials, repair consumables, and parts',
  [SUPPLIER_TYPE_CODES.GENERAL]: 'General goods, service vendors, and multi-category suppliers',
}

const SUPPLIER_TYPE_IDS = {
  // These will be populated at runtime from database
  TYRES: null,
  BATTERIES: null,
  CONSUMABLES: null,
  GENERAL: null,
}

// Supplier type seed data - single source of truth for seeding
const SUPPLIER_TYPE_SEED_DATA = [
  [SUPPLIER_TYPE_CODES.TYRES, SUPPLIER_TYPE_NAMES[SUPPLIER_TYPE_CODES.TYRES], SUPPLIER_TYPE_DESCRIPTIONS[SUPPLIER_TYPE_CODES.TYRES]],
  [SUPPLIER_TYPE_CODES.BATTERIES, SUPPLIER_TYPE_NAMES[SUPPLIER_TYPE_CODES.BATTERIES], SUPPLIER_TYPE_DESCRIPTIONS[SUPPLIER_TYPE_CODES.BATTERIES]],
  [SUPPLIER_TYPE_CODES.CONSUMABLES, SUPPLIER_TYPE_NAMES[SUPPLIER_TYPE_CODES.CONSUMABLES], SUPPLIER_TYPE_DESCRIPTIONS[SUPPLIER_TYPE_CODES.CONSUMABLES]],
  [SUPPLIER_TYPE_CODES.GENERAL, SUPPLIER_TYPE_NAMES[SUPPLIER_TYPE_CODES.GENERAL], SUPPLIER_TYPE_DESCRIPTIONS[SUPPLIER_TYPE_CODES.GENERAL]],
]

const getSupplierTypeCode = (type) => SUPPLIER_TYPE_CODES[type]

const getSupplierTypeName = (code) => SUPPLIER_TYPE_NAMES[code]

const getSupplierTypeId = (typeKey) => SUPPLIER_TYPE_IDS[typeKey]

const getSupplierTypeIdByCode = (code) => {
  if (!code) return null
  const normalized = String(code).trim().toLowerCase()
  const key = Object.keys(SUPPLIER_TYPE_CODES).find(
    (k) => SUPPLIER_TYPE_CODES[k].toLowerCase() === normalized
  )
  return key ? SUPPLIER_TYPE_IDS[key] : null
}

const initializeSupplierTypeIds = (db) => {
  Object.keys(SUPPLIER_TYPE_CODES).forEach((key) => {
    const type = db
      .prepare("SELECT Id FROM SupplierTypeM WHERE TypeCode = ?")
      .get(SUPPLIER_TYPE_CODES[key])

    if (type) {
      SUPPLIER_TYPE_IDS[key] = type.Id
    }
  })
}

module.exports = {
  SUPPLIER_TYPE_CODES,
  SUPPLIER_TYPE_NAMES,
  SUPPLIER_TYPE_DESCRIPTIONS,
  SUPPLIER_TYPE_IDS,
  SUPPLIER_TYPE_SEED_DATA,
  getSupplierTypeCode,
  getSupplierTypeName,
  getSupplierTypeId,
  getSupplierTypeIdByCode,
  initializeSupplierTypeIds,
}
