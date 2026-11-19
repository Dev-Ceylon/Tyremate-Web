/**
 * Payment type codes used throughout the application.
 * These match the PaymentTypeCode column in the PaymentTypeM table.
 */
export const PAYMENT_TYPE_CODES = {
  CASH: "csh",
  CREDIT: "crd",
  CHEQUE: "chq",
  BANK_TRANSFER: "btr",
} as const

// Union type of all possible database payment type codes ('csh' | 'crd' | 'chq' | 'btr')
export type PaymentTypeCode = (typeof PAYMENT_TYPE_CODES)[keyof typeof PAYMENT_TYPE_CODES]

// Human-readable names mapped by code
export const PAYMENT_TYPE_NAMES: Record<PaymentTypeCode, string> = {
  [PAYMENT_TYPE_CODES.CASH]: "Cash",
  [PAYMENT_TYPE_CODES.CREDIT]: "Credit",
  [PAYMENT_TYPE_CODES.CHEQUE]: "Cheque",
  [PAYMENT_TYPE_CODES.BANK_TRANSFER]: "Bank Transfer",
}

/**
 * List of all available payment type codes for iteration.
 */
export const PAYMENT_TYPE_LIST = Object.values(PAYMENT_TYPE_CODES) as PaymentTypeCode[]

/**
 * Liquid payment instruments available for immediate settlement in payment modals
 * (excludes CREDIT, which is an accounts receivable term).
 */
export const PAYMENT_INSTRUMENT_CODES = {
  CASH: PAYMENT_TYPE_CODES.CASH,
  CHEQUE: PAYMENT_TYPE_CODES.CHEQUE,
  BANK_TRANSFER: PAYMENT_TYPE_CODES.BANK_TRANSFER,
} as const

export type PaymentInstrumentCode = (typeof PAYMENT_INSTRUMENT_CODES)[keyof typeof PAYMENT_INSTRUMENT_CODES]

export const PAYMENT_INSTRUMENT_LIST: PaymentInstrumentCode[] = [
  PAYMENT_INSTRUMENT_CODES.CASH,
  PAYMENT_INSTRUMENT_CODES.CHEQUE,
  PAYMENT_INSTRUMENT_CODES.BANK_TRANSFER,
]

/**
 * Filter options for reports, ledgers, and audit queries.
 * Combines 'ALL' with real payment instrument codes.
 */
export const PAYMENT_METHOD_FILTERS = {
  ALL: "ALL",
  CASH: PAYMENT_TYPE_CODES.CASH,
  BANK_TRANSFER: PAYMENT_TYPE_CODES.BANK_TRANSFER,
  CHEQUE: PAYMENT_TYPE_CODES.CHEQUE,
} as const

export type PaymentMethodFilter = (typeof PAYMENT_METHOD_FILTERS)[keyof typeof PAYMENT_METHOD_FILTERS]

export const PAYMENT_METHOD_FILTER_OPTIONS: { value: PaymentMethodFilter; label: string }[] = [
  { value: PAYMENT_METHOD_FILTERS.ALL, label: "All Instruments" },
  { value: PAYMENT_METHOD_FILTERS.CASH, label: "Cash" },
  { value: PAYMENT_METHOD_FILTERS.BANK_TRANSFER, label: "Bank Transfer" },
  { value: PAYMENT_METHOD_FILTERS.CHEQUE, label: "Cheque" },
]

/**
 * Uppercase keys alias for reporting consistency
 */
export const PAYMENT_METHOD_KEYS = {
  ALL: "ALL",
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  CHEQUE: "CHEQUE",
} as const

/**
 * Interface for payment type metadata.
 */
export interface PaymentTypeMetadata {
  name: string
}

/**
 * Metadata for each payment type code, including human-readable display names.
 */
export const PAYMENT_TYPE_METADATA: Record<PaymentTypeCode, PaymentTypeMetadata> = {
  [PAYMENT_TYPE_CODES.CASH]: { name: "Cash" },
  [PAYMENT_TYPE_CODES.CREDIT]: { name: "Credit" },
  [PAYMENT_TYPE_CODES.CHEQUE]: { name: "Cheque" },
  [PAYMENT_TYPE_CODES.BANK_TRANSFER]: { name: "Bank Transfer" },
}

export const getPaymentTypeCode = (key: keyof typeof PAYMENT_TYPE_CODES): PaymentTypeCode => {
  return PAYMENT_TYPE_CODES[key]
}

export const getPaymentTypeName = (code: PaymentTypeCode | string | undefined): string => {
  if (!code) return "Unknown"
  return PAYMENT_TYPE_METADATA[code as PaymentTypeCode]?.name || "Unknown"
}
