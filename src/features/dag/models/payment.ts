import {
  PAYMENT_TYPE_CODES,
} from "../../../shared/payment/constants/paymentTypeConstants"

export type { CashPaymentData, ChequePaymentData, BankTransferPaymentData } from "../../../shared/payment/models/payment"

// This type represents the payload sent to the backend for DAG creation
export type DagPaymentPayload = {
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