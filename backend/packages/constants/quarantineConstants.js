// Quarantine constants for the application.
// Centralizes quarantine source, status, and movement action codes to avoid
// hardcoding throughout the codebase.

const QUARANTINE_SOURCE = Object.freeze({
  PO_GRN: { code: 'PO_GRN', name: 'PO Goods Received Note' },
  DAG_GRN: { code: 'DAG_GRN', name: 'DAG Goods Received Note' },
  CUSTOMER_RETURN: { code: 'CUSTOMER_RETURN', name: 'Customer Sales Return' },
})

const QUARANTINE_STATUS = Object.freeze({
  HOLD: { code: 'HOLD', name: 'On Hold - Awaiting Inspection' },
  RELEASED_TO_SALEABLE: { code: 'RELEASED_TO_SALEABLE', name: 'Released to Saleable Stock' },
  RETURNED_TO_SUPPLIER: { code: 'RETURNED_TO_SUPPLIER', name: 'Returned to Supplier' },
  SCRAPPED: { code: 'SCRAPPED', name: 'Scrapped' },
  CANCELLED: { code: 'CANCELLED', name: 'Cancelled' },
})

const QUARANTINE_MOVEMENT_ACTION = Object.freeze({
  RECEIVE: { code: 'RECEIVE', name: 'Received into Quarantine' },
  INSPECT: { code: 'INSPECT', name: 'Inspected' },
  APPROVE: { code: 'APPROVE', name: 'Approved' },
  REJECT: { code: 'REJECT', name: 'Rejected' },
  TRANSFER_TO_SALEABLE: { code: 'TRANSFER_TO_SALEABLE', name: 'Transfer to Saleable' },
  RETURN_TO_SUPPLIER: { code: 'RETURN_TO_SUPPLIER', name: 'Return to Supplier' },
  SCRAP: { code: 'SCRAP', name: 'Move to Scrap' },
  ADJUST: { code: 'ADJUST', name: 'Adjustment' },
})

const QUARANTINE_SOURCE_CODES = Object.freeze({
  PO_GRN: QUARANTINE_SOURCE.PO_GRN.code,
  DAG_GRN: QUARANTINE_SOURCE.DAG_GRN.code,
  CUSTOMER_RETURN: QUARANTINE_SOURCE.CUSTOMER_RETURN.code,
})

const QUARANTINE_STATUS_CODES = Object.freeze({
  HOLD: QUARANTINE_STATUS.HOLD.code,
  RELEASED_TO_SALEABLE: QUARANTINE_STATUS.RELEASED_TO_SALEABLE.code,
  RETURNED_TO_SUPPLIER: QUARANTINE_STATUS.RETURNED_TO_SUPPLIER.code,
  SCRAPPED: QUARANTINE_STATUS.SCRAPPED.code,
  CANCELLED: QUARANTINE_STATUS.CANCELLED.code,
})

const QUARANTINE_MOVEMENT_ACTION_CODES = Object.freeze({
  RECEIVE: QUARANTINE_MOVEMENT_ACTION.RECEIVE.code,
  INSPECT: QUARANTINE_MOVEMENT_ACTION.INSPECT.code,
  APPROVE: QUARANTINE_MOVEMENT_ACTION.APPROVE.code,
  REJECT: QUARANTINE_MOVEMENT_ACTION.REJECT.code,
  TRANSFER_TO_SALEABLE: QUARANTINE_MOVEMENT_ACTION.TRANSFER_TO_SALEABLE.code,
  RETURN_TO_SUPPLIER: QUARANTINE_MOVEMENT_ACTION.RETURN_TO_SUPPLIER.code,
  SCRAP: QUARANTINE_MOVEMENT_ACTION.SCRAP.code,
  ADJUST: QUARANTINE_MOVEMENT_ACTION.ADJUST.code,
})

const QUARANTINE_SOURCE_IDS = {
  PO_GRN: null,
  DAG_GRN: null,
  CUSTOMER_RETURN: null,
}

const QUARANTINE_STATUS_IDS = {
  HOLD: null,
  RELEASED_TO_SALEABLE: null,
  RETURNED_TO_SUPPLIER: null,
  SCRAPPED: null,
  CANCELLED: null,
}

const QUARANTINE_MOVEMENT_ACTION_IDS = {
  RECEIVE: null,
  INSPECT: null,
  APPROVE: null,
  REJECT: null,
  TRANSFER_TO_SALEABLE: null,
  RETURN_TO_SUPPLIER: null,
  SCRAP: null,
  ADJUST: null,
}

const QUARANTINE_SOURCE_SEED_DATA = [
  [QUARANTINE_SOURCE_CODES.PO_GRN, QUARANTINE_SOURCE.PO_GRN.name],
  [QUARANTINE_SOURCE_CODES.DAG_GRN, QUARANTINE_SOURCE.DAG_GRN.name],
  [QUARANTINE_SOURCE_CODES.CUSTOMER_RETURN, QUARANTINE_SOURCE.CUSTOMER_RETURN.name],
]

const QUARANTINE_STATUS_SEED_DATA = Object.keys(QUARANTINE_STATUS).map((key) => [
  QUARANTINE_STATUS[key].code,
  QUARANTINE_STATUS[key].name,
])

const QUARANTINE_MOVEMENT_ACTION_SEED_DATA = Object.keys(QUARANTINE_MOVEMENT_ACTION).map((key) => [
  QUARANTINE_MOVEMENT_ACTION[key].code,
  QUARANTINE_MOVEMENT_ACTION[key].name,
])

const getQuarantineSourceCode = (sourceKey) => QUARANTINE_SOURCE_CODES[sourceKey]
const getQuarantineSourceName = (code) => {
  const entry = Object.values(QUARANTINE_SOURCE).find((item) => item.code === code)
  return entry ? entry.name : null
}
const getQuarantineSourceId = (sourceKey) => QUARANTINE_SOURCE_IDS[sourceKey]
const getQuarantineSourceIdByCode = (code) => {
  const key = Object.keys(QUARANTINE_SOURCE_CODES).find((k) => QUARANTINE_SOURCE_CODES[k] === code)
  return key ? QUARANTINE_SOURCE_IDS[key] : null
}

const initializeQuarantineSourceIds = (db) => {
  QUARANTINE_SOURCE_SEED_DATA.forEach(([code]) => {
    const row = db.prepare("SELECT Id FROM QuarantineSourceM WHERE SourceCode = ?").get(code)
    if (row) {
      const key = Object.keys(QUARANTINE_SOURCE_CODES).find((k) => QUARANTINE_SOURCE_CODES[k] === code)
      if (key) QUARANTINE_SOURCE_IDS[key] = row.Id
    }
  })
}

const getQuarantineStatusCode = (statusKey) => QUARANTINE_STATUS_CODES[statusKey]
const getQuarantineStatusName = (code) => {
  const entry = Object.values(QUARANTINE_STATUS).find((item) => item.code === code)
  return entry ? entry.name : null
}
const getQuarantineStatusId = (statusKey) => QUARANTINE_STATUS_IDS[statusKey]
const getQuarantineStatusIdByCode = (code) => {
  const key = Object.keys(QUARANTINE_STATUS_CODES).find((k) => QUARANTINE_STATUS_CODES[k] === code)
  return key ? QUARANTINE_STATUS_IDS[key] : null
}

const initializeQuarantineStatusIds = (db) => {
  QUARANTINE_STATUS_SEED_DATA.forEach(([code]) => {
    const row = db.prepare("SELECT Id FROM QuarantineStatusM WHERE StatusCode = ?").get(code)
    if (row) {
      const key = Object.keys(QUARANTINE_STATUS_CODES).find((k) => QUARANTINE_STATUS_CODES[k] === code)
      if (key) QUARANTINE_STATUS_IDS[key] = row.Id
    }
  })
}

const getQuarantineMovementActionCode = (actionKey) => QUARANTINE_MOVEMENT_ACTION_CODES[actionKey]
const getQuarantineMovementActionName = (code) => {
  const entry = Object.values(QUARANTINE_MOVEMENT_ACTION).find((item) => item.code === code)
  return entry ? entry.name : null
}
const getQuarantineMovementActionId = (actionKey) => QUARANTINE_MOVEMENT_ACTION_IDS[actionKey]
const getQuarantineMovementActionIdByCode = (code) => {
  const key = Object.keys(QUARANTINE_MOVEMENT_ACTION_CODES).find((k) => QUARANTINE_MOVEMENT_ACTION_CODES[k] === code)
  return key ? QUARANTINE_MOVEMENT_ACTION_IDS[key] : null
}

const initializeQuarantineMovementActionIds = (db) => {
  QUARANTINE_MOVEMENT_ACTION_SEED_DATA.forEach(([code]) => {
    const row = db.prepare("SELECT Id FROM QuarantineMovementActionM WHERE ActionCode = ?").get(code)
    if (row) {
      const key = Object.keys(QUARANTINE_MOVEMENT_ACTION_CODES).find((k) => QUARANTINE_MOVEMENT_ACTION_CODES[k] === code)
      if (key) QUARANTINE_MOVEMENT_ACTION_IDS[key] = row.Id
    }
  })
}

module.exports = {
  QUARANTINE_SOURCE,
  QUARANTINE_STATUS,
  QUARANTINE_MOVEMENT_ACTION,
  QUARANTINE_SOURCE_CODES,
  QUARANTINE_STATUS_CODES,
  QUARANTINE_MOVEMENT_ACTION_CODES,
  QUARANTINE_SOURCE_IDS,
  QUARANTINE_STATUS_IDS,
  QUARANTINE_MOVEMENT_ACTION_IDS,
  QUARANTINE_SOURCE_SEED_DATA,
  QUARANTINE_STATUS_SEED_DATA,
  QUARANTINE_MOVEMENT_ACTION_SEED_DATA,
  getQuarantineSourceCode,
  getQuarantineSourceName,
  getQuarantineSourceId,
  getQuarantineSourceIdByCode,
  initializeQuarantineSourceIds,
  getQuarantineStatusCode,
  getQuarantineStatusName,
  getQuarantineStatusId,
  getQuarantineStatusIdByCode,
  initializeQuarantineStatusIds,
  getQuarantineMovementActionCode,
  getQuarantineMovementActionName,
  getQuarantineMovementActionId,
  getQuarantineMovementActionIdByCode,
  initializeQuarantineMovementActionIds,
}
