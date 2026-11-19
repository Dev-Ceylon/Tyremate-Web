export const SALES_RETURN_TYPE_CODES = {
  UNUSED: "UNUSED",
  DEFECTIVE: "DEFECTIVE",
  FITTED: "FITTED",
  EXCHANGE: "EXCHANGE",
} as const

export type SalesReturnTypeCode = typeof SALES_RETURN_TYPE_CODES[keyof typeof SALES_RETURN_TYPE_CODES]

export const SALES_RETURN_TYPE_OPTIONS: ReadonlyArray<{ code: SalesReturnTypeCode; label: string }> = [
  { code: SALES_RETURN_TYPE_CODES.UNUSED, label: "Unused" },
  { code: SALES_RETURN_TYPE_CODES.DEFECTIVE, label: "Defective / warranty" },
  { code: SALES_RETURN_TYPE_CODES.FITTED, label: "Fitted" },
  { code: SALES_RETURN_TYPE_CODES.EXCHANGE, label: "Exchange" },
]
