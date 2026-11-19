// Audit action constants for the application
// Centralizes audit action codes and labels to avoid hardcoding throughout the codebase.
// Actions are grouped by domain: GENERAL (shared), SO (sales order), PO (purchase order).
// String values are stable identifiers persisted in the audit log tables, so they must not change.

const GENERAL_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
}

const SO_ACTIONS = {
  COMPLETE: "COMPLETE",
  PAYMENT: "PAYMENT",
  CHEQUE_COLLECTED: "CHEQUE_COLLECTED",
  RETURN: "RETURN",
  DELIVER: "DELIVER",
}

const PO_ACTIONS = {
  STATUS: "STATUS",
  ALLOCATE: "ALLOCATE",
  SUPPLIER_APPROVAL: "SUPPLIER_APPROVAL",
}

const AUDIT_ACTIONS = {
  ...GENERAL_ACTIONS,
  ...SO_ACTIONS,
  ...PO_ACTIONS,
}

const AUDIT_ACTION_LABELS = {
  [AUDIT_ACTIONS.CREATE]: "Created",
  [AUDIT_ACTIONS.UPDATE]: "Updated",
  [AUDIT_ACTIONS.DELETE]: "Deleted",
  [AUDIT_ACTIONS.COMPLETE]: "Completed",
  [AUDIT_ACTIONS.PAYMENT]: "Payment",
  [AUDIT_ACTIONS.CHEQUE_COLLECTED]: "Cheque Collected",
  [AUDIT_ACTIONS.RETURN]: "Return",
  [AUDIT_ACTIONS.DELIVER]: "Delivered",
  [AUDIT_ACTIONS.STATUS]: "Status Changed",
  [AUDIT_ACTIONS.ALLOCATE]: "Location Allocated",
  [AUDIT_ACTIONS.SUPPLIER_APPROVAL]: "Supplier Approval",
}

const getAuditActionLabel = (action) => AUDIT_ACTION_LABELS[action] || action

module.exports = {
  GENERAL_ACTIONS,
  SO_ACTIONS,
  PO_ACTIONS,
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  getAuditActionLabel,
}
