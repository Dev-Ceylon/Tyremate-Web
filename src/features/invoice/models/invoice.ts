export type InvoiceSourceType = "so" | "delivery" | "other_service" | "direct"

export const INVOICE_STATUS_CODES = {
  DRAFT: "dft",
  ISSUED: "iss",
  PARTIALLY_PAID: "par",
  PAID: "paid",
  OVERDUE: "ovd",
  CANCELLED: "can",
} as const

export type InvoiceStatus = typeof INVOICE_STATUS_CODES[keyof typeof INVOICE_STATUS_CODES]

export type InvoiceLineType = "tyre" | "battery" | "service" | "consumable" | "other"

export type InvoiceRecord = {
  InvoiceID: number
  InvoiceNumber: string
  InvoiceDate: string
  DueDate: string | null
  CreatedDateTime: string
  SourceType: InvoiceSourceType
  SourceID: number | null
  CustomerID: number | null
  WalkinCustomerID: number | null
  CustomerName: string | null
  CustomerAddress: string | null
  CustomerPhone: string | null
  CustomerVatNo: string | null
  Subtotal: number
  DiscountTotal: number
  TaxLabel: string | null
  TaxAmount: number
  Total: number
  AmountPaid: number
  BalanceDue: number
  Status: InvoiceStatus
  IsCreditNote: number
  CreditNoteOf: number | null
  Notes: string | null
  VoidReason: string | null
  CreatedBy: number | null
  IsOverdue: number
}

export type InvoiceLineRecord = {
  InvoiceLineID: number
  InvoiceID: number
  LineType: InvoiceLineType
  TyreID: number | null
  BatteryID?: number | null
  SerialNo: string | null
  Description: string | null
  Size: string | null
  Pattern: string | null
  Brand: string | null
  Model?: string | null
  Capacity?: string | null
  Voltage?: string | null
  Qty: number
  UnitPrice: number
  Discount: number
  LineTotal: number
}

export type InvoicePaymentLinkRecord = {
  ID: number
  InvoiceID: number
  PaymentID: number
  AmountApplied: number
  CreatedDateTime: string
}

export type InvoicePaymentRecord = {
  PaymentID: number
  PaymentTypeCode: string
  PaymentTypeName: string
  Amount: number
  ReferenceNumber?: string
  PaymentDate?: string
  BankName?: string
  PaidAmount?: number
  BalanceAmount?: number
  Collected?: number | boolean
  ReceiptPath?: string
  ReceiptEncIV?: string
  ReceiptEncAuthTag?: string
  ReceiptEncKey?: string
  Receipts?: Array<{
    ReceiptPath: string
    ReceiptEncIV?: string
    ReceiptEncAuthTag?: string
    ReceiptEncKey?: string
    OriginalFileName?: string | null
  }>
  AmountApplied?: number
}

export type InvoiceDetailedRecord = InvoiceRecord & {
  Lines: InvoiceLineRecord[]
  PaymentLinks: InvoicePaymentLinkRecord[]
  Payments?: InvoicePaymentRecord[]
  CreditNotes: InvoiceRecord[]
}

export type InvoiceLinePayload = {
  TyreID?: number | null
  SerialNo?: string | null
  Description?: string | null
  Size?: string | null
  Pattern?: string | null
  Brand?: string | null
  Qty: number
  UnitPrice: number
  Discount?: number
}

export type DirectInvoicePayload = {
  CustomerID?: number
  CustomerName?: string | null
  CustomerAddress?: string | null
  CustomerPhone?: string | null
  CustomerVatNo?: string | null
  InvoiceDate?: string | null
  DueDate?: string | null
  Notes?: string | null
  TaxLabel?: string | null
  TaxAmount?: number
  AmountPaid?: number
  Lines: InvoiceLinePayload[]
}

export type UpdateInvoicePayload = {
  DueDate?: string | null
  Notes?: string | null
  TaxLabel?: string | null
  TaxAmount?: number
}

export type CancelInvoicePayload = {
  Reason?: string | null
}

export type CreditNotePayload = {
  InvoiceDate?: string | null
  Notes?: string | null
}
