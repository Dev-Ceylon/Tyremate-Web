export interface OtherServiceFormData {
  Date: string
  CustomerName: string
  CustomerPhone: string
  CustomerEmail: string
}

export interface OtherServiceConsumablePayload {
  ConsumableID: number
  Price: number
  Qty: number
}

export interface OtherServiceConsumableRecord extends OtherServiceConsumablePayload {
  ID: number
  OSID: number
  ConsumableName?: string
  ConsumableCategory?: string
  ConsumableUnit?: string
}

export interface OtherServicePaymentPayload {
  CashPayment?: {
    PaymentTypeCode: string
    AmountReceived: number
    BalanceToReturn: number
  } | null
  ChequePayment?: {
    PaymentTypeCode: string
    ChequeNumber: string
    ChequeDate: string
    BankName: string
    Amount: number
    Collected: number
  } | null
  BankTransferPayment?: {
    PaymentTypeCode: string
    BankDetailsID: number
    Amount: number
  } | null
}

export interface OtherServicePaymentDetail {
  PaymentID: number
  PaymentTypeCode: string
  PaymentTypeName: string
  Amount: number
  PaidAmount?: number
  BalanceAmount?: number
  ReferenceNumber?: string
  PaymentDate?: string
  BankName?: string
  Collected?: number
}

export interface OtherServicePayload {
  Date: string
  IsCompleted?: number
  IsPaymentCompleted?: number
  CustomerID?: number
  CustomerName?: string
  CustomerPhone?: string
  CustomerEmail?: string
  Consumables?: OtherServiceConsumablePayload[]
  Payment?: OtherServicePaymentPayload | null
}

export interface OtherServiceRecord {
  OSID: number
  Date: string
  IsCompleted: number
  IsPaymentCompleted: number
  CustomerID?: number | null
  CustomerName?: string | null
  CustomerCode?: string | null
  AdHocCustomerName?: string | null
  AdHocCustomerPhone?: string | null
  AdHocCustomerEmail?: string | null
  TotalAmount?: number
}

export interface OtherServiceDetailedRecord extends OtherServiceRecord {
  Consumables?: OtherServiceConsumableRecord[]
  Payments?: OtherServicePaymentDetail[]
  RemainingAmount?: number
}

export interface CompleteChequePaymentResult {
  success: boolean
  osId: number
  paymentId: number
  isPaymentCompleted: 0 | 1
  remainingAmount: number
}

export interface CompleteOtherServiceResult {
  success: boolean
  osId: number
  isCompleted: 1
}

export interface MakeOSPaymentResult {
  success: boolean
  osId: number
  isPaymentCompleted: 0 | 1
}
