import type { Dispatch, SetStateAction } from "react"
import type {
  BankTransferPaymentData,
  CashPaymentData,
  ChequePaymentData,
} from "./payment"
import type { PaymentTypeCode } from "../constants/paymentTypeConstants"
import type { PaymentSettlement } from "../hooks/usePaymentSettlement"
import type { StagedReceiptAttachments } from "../hooks/receipts/useStagedReceipts"
import type { CashReceiptInfo } from "./payment"

// Common shape returned by every payment form hook. The payload type T is what
// the owning page submits to its backend (e.g. SalesOrderPaymentPayload or
// DagPaymentPayload), so one generic controller can drive both flows.
export type PaymentFormState<T> = {
  selectedPaymentType: PaymentTypeCode
  setSelectedPaymentType: Dispatch<SetStateAction<PaymentTypeCode>>
  cashPaymentData: CashPaymentData
  setCashPaymentData: Dispatch<SetStateAction<CashPaymentData>>
  chequePaymentData: ChequePaymentData
  setChequePaymentData: Dispatch<SetStateAction<ChequePaymentData>>
  bankTransferPaymentData: BankTransferPaymentData
  setBankTransferPaymentData: Dispatch<SetStateAction<BankTransferPaymentData>>
  resetPaymentForm: () => void
  getPaymentPayload: (attachments: StagedReceiptAttachments) => T
  isValid: boolean
  settlement: PaymentSettlement
  // Staged receipt state for PaymentModalController
  cashReceipt: CashReceiptInfo | null
  bankReceipt: CashReceiptInfo | null
  chequeReceipts: CashReceiptInfo[]
  replaceSingle: (target: "cash" | "bank", next: CashReceiptInfo) => void
  removeSingle: (target: "cash" | "bank") => void
  setChequeReceipts: (next: CashReceiptInfo[]) => void
  removeChequeAt: (index: number) => void
  commit: () => StagedReceiptAttachments
  discard: () => void
  reset: () => void
}