// Purchase order specific status constants.
// Depends on the shared STATUS_CODES from statusConstants.js - codes are never
// duplicated here; the PO lifecycle is defined as an ordered flow of those codes.

const { STATUS_CODES } = require("./statusConstants")

// Purchase order specific lifecycle - strictly ordered status flow.
// Transitions must advance exactly one step at a time.
const PO_STATUS_FLOW = [
  STATUS_CODES.DRAFT,
  STATUS_CODES.PENDING,
  STATUS_CODES.ARRIVING,
  STATUS_CODES.ARRIVED,
  STATUS_CODES.COMPLETED,
]

const PO_TYRE_STATUS_FLOW = [...PO_STATUS_FLOW]

const getPoNextStatus = (current) => {
  const index = PO_STATUS_FLOW.indexOf(current)
  return index !== -1 && index < PO_STATUS_FLOW.length - 1 ? PO_STATUS_FLOW[index + 1] : null
}

const getPoTyreNextStatus = (current) => {
  const index = PO_TYRE_STATUS_FLOW.indexOf(current)
  return index !== -1 && index < PO_TYRE_STATUS_FLOW.length - 1 ? PO_TYRE_STATUS_FLOW[index + 1] : null
}

// PO statuses that may be deleted. Once sent to a supplier, records are locked.
const PO_DELETABLE_STATUSES = [
  STATUS_CODES.DRAFT,
  STATUS_CODES.PENDING,
]

const isPoStatusDeletable = (status) => PO_DELETABLE_STATUSES.includes(status)

const isPoStatusTransitionAllowed = (current, next) => {
  const currentIndex = PO_STATUS_FLOW.indexOf(current)
  const nextIndex = PO_STATUS_FLOW.indexOf(next)
  return currentIndex !== -1 && nextIndex === currentIndex + 1
}

const isPoTyreStatusTransitionAllowed = (current, next) => {
  const currentIndex = PO_TYRE_STATUS_FLOW.indexOf(current)
  const nextIndex = PO_TYRE_STATUS_FLOW.indexOf(next)
  return currentIndex !== -1 && nextIndex === currentIndex + 1
}

module.exports = {
  PO_STATUS_FLOW,
  PO_TYRE_STATUS_FLOW,
  PO_DELETABLE_STATUSES,
  getPoNextStatus,
  getPoTyreNextStatus,
  isPoStatusTransitionAllowed,
  isPoTyreStatusTransitionAllowed,
  isPoStatusDeletable,
}