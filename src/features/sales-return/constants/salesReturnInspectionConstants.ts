export const SALES_RETURN_CONDITION_CODES = {
  NEW_UNUSED: "NEW_UNUSED",
  USED_FITTED: "USED_FITTED",
  DEFECTIVE: "DEFECTIVE",
  DAMAGED: "DAMAGED",
  OTHER: "OTHER",
} as const

export type SalesReturnConditionCode = typeof SALES_RETURN_CONDITION_CODES[keyof typeof SALES_RETURN_CONDITION_CODES]

export const SALES_RETURN_CONDITION_OPTIONS: ReadonlyArray<{ code: SalesReturnConditionCode; label: string }> = [
  { code: SALES_RETURN_CONDITION_CODES.NEW_UNUSED, label: "New / unused" },
  { code: SALES_RETURN_CONDITION_CODES.USED_FITTED, label: "Used / fitted" },
  { code: SALES_RETURN_CONDITION_CODES.DEFECTIVE, label: "Defective" },
  { code: SALES_RETURN_CONDITION_CODES.DAMAGED, label: "Damaged" },
  { code: SALES_RETURN_CONDITION_CODES.OTHER, label: "Other" },
]

export const SALES_RETURN_DISPOSITION_CODES = {
  RESTOCK_SALEABLE: "RESTOCK_SALEABLE",
  QUARANTINE: "QUARANTINE",
  SCRAP: "SCRAP",
  RETURN_TO_SUPPLIER: "RETURN_TO_SUPPLIER",
} as const

export type SalesReturnDispositionCode = typeof SALES_RETURN_DISPOSITION_CODES[keyof typeof SALES_RETURN_DISPOSITION_CODES]

export const SALES_RETURN_DISPOSITION_OPTIONS: ReadonlyArray<{ code: SalesReturnDispositionCode; label: string }> = [
  { code: SALES_RETURN_DISPOSITION_CODES.RESTOCK_SALEABLE, label: "Release to saleable stock" },
  { code: SALES_RETURN_DISPOSITION_CODES.QUARANTINE, label: "Keep in quarantine" },
  { code: SALES_RETURN_DISPOSITION_CODES.SCRAP, label: "Scrap" },
  { code: SALES_RETURN_DISPOSITION_CODES.RETURN_TO_SUPPLIER, label: "Return to supplier" },
]
