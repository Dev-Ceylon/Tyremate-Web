// Status constants for the application
// Centralizes status codes and names to avoid hardcoding throughout the codebase

const STATUS_CODES = {
  PENDING: 'pdn',
  SENT: 'snt',
  COMPLETED: 'cmp',
  GP_ISSUED: 'gpi',
  SENT_OUT: 'sno',
  ARRIVED: 'arv',
  ARRIVING: 'arr',
  DRAFT: 'dft'
}

const STATUS_NAMES = {
  [STATUS_CODES.PENDING]: 'Pending',
  [STATUS_CODES.SENT]: 'Sent',
  [STATUS_CODES.COMPLETED]: 'Completed',
  [STATUS_CODES.GP_ISSUED]: 'Gate Pass Issued',
  [STATUS_CODES.SENT_OUT]: 'Sent Out',
  [STATUS_CODES.ARRIVED]: 'Arrived',
  [STATUS_CODES.ARRIVING]: 'Arriving',
  [STATUS_CODES.DRAFT]: 'Draft'
}

const STATUS_IDS = {
  // These will be populated at runtime from database
  PENDING: null,
  SENT: null,
  COMPLETED: null,
  GP_ISSUED: null,
  SENT_OUT: null,
  ARRIVED: null,
  ARRIVING: null,
  DRAFT: null
}

// Status seed data - single source of truth for seeding
const STATUS_SEED_DATA = [
  [STATUS_CODES.PENDING, STATUS_NAMES[STATUS_CODES.PENDING]],
  [STATUS_CODES.SENT, STATUS_NAMES[STATUS_CODES.SENT]],
  [STATUS_CODES.COMPLETED, STATUS_NAMES[STATUS_CODES.COMPLETED]],
  [STATUS_CODES.GP_ISSUED, STATUS_NAMES[STATUS_CODES.GP_ISSUED]],
  [STATUS_CODES.SENT_OUT, STATUS_NAMES[STATUS_CODES.SENT_OUT]],
  [STATUS_CODES.ARRIVED, STATUS_NAMES[STATUS_CODES.ARRIVED]],
  [STATUS_CODES.ARRIVING, STATUS_NAMES[STATUS_CODES.ARRIVING]],
  [STATUS_CODES.DRAFT, STATUS_NAMES[STATUS_CODES.DRAFT]]
]

const getStatusCode = (status) => STATUS_CODES[status]

const getStatusName = (code) => STATUS_NAMES[code]

const getStatusId = (statusKey) => STATUS_IDS[statusKey]

const getStatusIdByCode = (code) => {
  const key = Object.keys(STATUS_CODES).find(k => STATUS_CODES[k] === code)
  return key ? STATUS_IDS[key] : null
}

const initializeStatusIds = (db) => {
  Object.keys(STATUS_CODES).forEach(key => {
    const status = db
      .prepare("SELECT Id FROM StatusM WHERE StatusCode = ?")
      .get(STATUS_CODES[key])
    
    if (status) {
      STATUS_IDS[key] = status.Id
    }
  })
}

module.exports = {
  STATUS_CODES,
  STATUS_NAMES,
  STATUS_IDS,
  STATUS_SEED_DATA,
  getStatusCode,
  getStatusName,
  getStatusId,
  getStatusIdByCode,
  initializeStatusIds,
}