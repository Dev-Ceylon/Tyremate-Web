export const SALES_RETURN_STATUS = {
  REQUESTED: { code: "REQUESTED", name: "Requested" },
  UNDER_INSPECTION: { code: "UNDER_INSPECTION", name: "Under Inspection" },
  APPROVED: { code: "APPROVED", name: "Approved" },
  REJECTED: { code: "REJECTED", name: "Rejected" },
  RECEIVED_IN_QUARANTINE: { code: "RECEIVED_IN_QUARANTINE", name: "Received in Quarantine" },
  RECEIVED_IN_STOCK: { code: "RECEIVED_IN_STOCK", name: "Received in Stock" },
  CREDIT_ISSUED: { code: "CREDIT_ISSUED", name: "Credit Note Issued" },
  REFUNDED: { code: "REFUNDED", name: "Refunded/Store Credit Issued" },
  REPLACEMENT_COMPLETED: { code: "REPLACEMENT_COMPLETED", name: "Replacement Completed" },
  CLOSED: { code: "CLOSED", name: "Closed" },
  CANCELLED: { code: "CANCELLED", name: "Cancelled" },
} as const

export const SALES_RETURN_STATUS_CODES = Object.fromEntries(
  Object.entries(SALES_RETURN_STATUS).map(([key, status]) => [key, status.code]),
) as { [Key in keyof typeof SALES_RETURN_STATUS]: (typeof SALES_RETURN_STATUS)[Key]["code"] }

export type SalesReturnStatusCode = (typeof SALES_RETURN_STATUS_CODES)[keyof typeof SALES_RETURN_STATUS_CODES]

export const SALES_RETURN_STATUS_OPTIONS = Object.values(SALES_RETURN_STATUS).map(({ code, name }) => ({
  code,
  label: name,
}))
