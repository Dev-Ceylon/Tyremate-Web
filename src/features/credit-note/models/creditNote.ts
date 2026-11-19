export interface CreditNoteLine {
  CreditNoteLineID?: number
  CreditNoteID: number
  TyreID?: number
  Description: string
  Qty: number
  UnitPrice: number
  Discount: number
  TaxRate: number
  TaxAmount: number
  LineAmount: number
  TyreSerialNo?: string
  AllocationId?: number
}

export interface CreditNote {
  CreditNoteID: number
  CreditNoteNo: string
  InvoiceID: number
  SalesReturnID?: number
  CustomerID: number
  SourceTypeId: number
  ReasonId: number
  StatusId: number
  SubTotal: number
  TaxAmount: number
  TotalAmount: number
  CurrencyCode: string
  ExchangeRate: number
  Notes?: string
  StatusCode?: string
  StatusName?: string
  ReasonCode?: string
  ReasonName?: string
  SourceCode?: string
  SourceName?: string
  InvoiceNumber?: string
  CustomerName?: string
  Lines?: CreditNoteLine[]
  CreatedAt: string
  ApprovedDate?: string
}

export interface CreditNotePayload {
  InvoiceID: number
  SalesReturnID?: number
  CustomerID: number
  SourceType: string
  Reason: string
  Lines: Omit<CreditNoteLine, 'CreditNoteLineID' | 'CreditNoteID'>[]
  Notes?: string
}

export interface Refund {
  RefundID: number
  RefundNo: string
  CreditNoteID: number
  SalesReturnID?: number
  CustomerID: number
  Amount: number
  MethodId: number
  ReferenceNo?: string
  StatusId: number
  MethodCode?: string
  MethodName?: string
  StatusCode?: string
}

export interface RefundPayload {
  CreditNoteID: number
  Amount: number
  Method: string
  ReferenceNo?: string
  BankAccountId?: number
  ChequeNo?: string
  ChequeDate?: string
  Notes?: string
}

export interface CustomerCredit {
  CustomerID: number
  AvailableAmount: number
  TotalIssued: number
  TotalUsed: number
}

export interface CreditTransaction {
  TransactionID: number
  CustomerID: number
  CreditNoteID?: number
  RefundID?: number
  TypeId: number
  Amount: number
  BalanceAfter: number
  Reference?: string
  TypeCode?: string
  TypeName?: string
  CreditNoteNo?: string
  RefundNo?: string
  CreatedByName?: string
  CreatedAt: string
}