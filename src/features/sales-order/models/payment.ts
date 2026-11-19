import {
  type PaymentTypeCode,
  PAYMENT_TYPE_CODES,
} from "../../../shared/payment/constants/paymentTypeConstants"

import type { CashPaymentData, ChequePaymentData, BankTransferPaymentData } from "../../../shared/payment/models/payment"
export type { CashPaymentData, ChequePaymentData, BankTransferPaymentData }

// This type represents the full payment state in the UI forms
export type SalesOrderPaymentFormState = {
  PaymentTypeCode: PaymentTypeCode
  CashPayment?: CashPaymentData
  ChequePayment?: ChequePaymentData
  BankTransferPayment?: BankTransferPaymentData
}

// This type represents the payload sent to the backend for sales order creation
export type SalesOrderPaymentPayload = {
  CashPayment: {
    PaymentTypeCode: typeof PAYMENT_TYPE_CODES.CASH
    AmountReceived: number
    BalanceToReturn: number
    ReceiptPath?: string | null
    ReceiptEncIV?: string | null
    ReceiptEncAuthTag?: string | null
    ReceiptEncKey?: string | null
  } | null
  ChequePayment: {
    PaymentTypeCode: typeof PAYMENT_TYPE_CODES.CHEQUE
    ChequeNumber: string
    ChequeDate: string
    BankName: string
    Amount: number
    Receipts?: Array<{
      ReceiptPath: string
      ReceiptEncIV: string
      ReceiptEncAuthTag: string
      ReceiptEncKey: string
      OriginalFileName: string
    }> | null
  } | null
  BankTransferPayment: {
    PaymentTypeCode: typeof PAYMENT_TYPE_CODES.BANK_TRANSFER
    BankDetailsID: number
    Amount: number
    BankName?: string
    AccountNumber?: string
    AccountName?: string
    Branch?: string
    ReceiptPath?: string | null
    ReceiptEncIV?: string | null
    ReceiptEncAuthTag?: string | null
    ReceiptEncKey?: string | null
  } | null
}

export type SalesOrderPaymentResult = {
  success: boolean
  soId: number
  isPaymentCompleted: number
}

export type CompleteChequePaymentResult = {
  success: boolean
  soId: number
  paymentId: number
  isPaymentCompleted: number
  remainingAmount: number
}