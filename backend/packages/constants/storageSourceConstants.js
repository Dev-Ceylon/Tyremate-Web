// Storage source constants for the application.
// Centralizes stock-source codes and names to avoid hardcoding throughout the
// codebase. Mirrors the StatusM pattern: the source is a lookup row and
// StorageManager stores its Id in SourceTypeId.

const STORAGE_SOURCE_CODES = {
  DAG: 'dag',
  PO: 'po',
  SALES_RETURN: 'sales_return',
  DEV_SEED: 'dev_seed',
  MANUAL: 'manual',
  SCRAP: 'SCRAP'
}

const STORAGE_SOURCE_NAMES = {
  [STORAGE_SOURCE_CODES.DAG]: 'DAG',
  [STORAGE_SOURCE_CODES.PO]: 'PO',
  [STORAGE_SOURCE_CODES.SALES_RETURN]: 'Customer Return',
  [STORAGE_SOURCE_CODES.DEV_SEED]: 'Development Seed',
  [STORAGE_SOURCE_CODES.MANUAL]: 'Manual',
  [STORAGE_SOURCE_CODES.SCRAP]: 'Scrap'
}

const STORAGE_SOURCE_IDS = {
  // These will be populated at runtime from database
  DAG: null,
  PO: null,
  SALES_RETURN: null,
  DEV_SEED: null,
  MANUAL: null,
  SCRAP: null
}

// Storage source seed data - single source of truth for seeding
const STORAGE_SOURCE_SEED_DATA = [
  [STORAGE_SOURCE_CODES.DAG, STORAGE_SOURCE_NAMES[STORAGE_SOURCE_CODES.DAG]],
  [STORAGE_SOURCE_CODES.PO, STORAGE_SOURCE_NAMES[STORAGE_SOURCE_CODES.PO]],
  [STORAGE_SOURCE_CODES.SALES_RETURN, STORAGE_SOURCE_NAMES[STORAGE_SOURCE_CODES.SALES_RETURN]],
  [STORAGE_SOURCE_CODES.DEV_SEED, STORAGE_SOURCE_NAMES[STORAGE_SOURCE_CODES.DEV_SEED]],
  [STORAGE_SOURCE_CODES.MANUAL, STORAGE_SOURCE_NAMES[STORAGE_SOURCE_CODES.MANUAL]],
  [STORAGE_SOURCE_CODES.SCRAP, STORAGE_SOURCE_NAMES[STORAGE_SOURCE_CODES.SCRAP]]
]

const getStorageSourceCode = (source) => STORAGE_SOURCE_CODES[source]

const getStorageSourceName = (code) => STORAGE_SOURCE_NAMES[code]

const getStorageSourceId = (sourceKey) => STORAGE_SOURCE_IDS[sourceKey]

const getStorageSourceIdByCode = (code) => {
  const key = Object.keys(STORAGE_SOURCE_CODES).find(k => STORAGE_SOURCE_CODES[k] === code)
  return key ? STORAGE_SOURCE_IDS[key] : null
}

const initializeStorageSourceIds = (db) => {
  Object.keys(STORAGE_SOURCE_CODES).forEach(key => {
    const source = db
      .prepare("SELECT Id FROM StorageSourceM WHERE SourceCode = ?")
      .get(STORAGE_SOURCE_CODES[key])

    if (source) {
      STORAGE_SOURCE_IDS[key] = source.Id
    }
  })
}

module.exports = {
  STORAGE_SOURCE_CODES,
  STORAGE_SOURCE_NAMES,
  STORAGE_SOURCE_IDS,
  STORAGE_SOURCE_SEED_DATA,
  getStorageSourceCode,
  getStorageSourceName,
  getStorageSourceId,
  getStorageSourceIdByCode,
  initializeStorageSourceIds,
}
