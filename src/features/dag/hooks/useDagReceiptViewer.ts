import { useState } from "react"
import { receiptItemsFromPayment } from "../../../shared/payment/utils/receiptPreviewHelpers"
import type { ReceiptManageConfig } from "../../../shared/payment/hooks/receipts/useReceiptManage"
import type { DagPaymentDetail } from "../models/dag"

type UseDagReceiptViewerOptions = {
  payments: DagPaymentDetail[]
  onReceiptsChanged?: () => void | Promise<void>
}

/**
 * Owns which payment's receipts are open in the preview modal and derives the
 * modal props (receipts, title, optional manage config) from the live DAG,
 * so uploading/replacing/removing a receipt re-renders without unmounting.
 */
export function useDagReceiptViewer({ payments, onReceiptsChanged }: UseDagReceiptViewerOptions) {
  const [openReceiptPaymentId, setOpenReceiptPaymentId] = useState<number | null>(null)

  const openPayment =
    payments.find((payment) => payment.PaymentID === openReceiptPaymentId) ?? null
  const previewReceipts = openPayment ? receiptItemsFromPayment(openPayment as ReceiptSource) : []
  const previewTitle = openPayment
    ? `${openPayment.PaymentTypeName} Receipt${previewReceipts.length > 1 ? "s" : ""}`
    : "Payment Receipts"

  const manage: ReceiptManageConfig | undefined =
    openPayment && openPayment.PaymentID != null && onReceiptsChanged
      ? {
          PaymentID: openPayment.PaymentID,
          PaymentTypeCode: openPayment.PaymentTypeCode,
          onAttached: onReceiptsChanged,
        }
      : undefined

  const openReceipt = (paymentId: number) => {
    setOpenReceiptPaymentId(paymentId)
  }

  const closeReceipt = () => {
    setOpenReceiptPaymentId(null)
  }

  return {
    isOpen: openReceiptPaymentId !== null,
    openReceipt,
    closeReceipt,
    previewReceipts,
    previewTitle,
    manage,
  }
}

// Internal type matching what receiptItemsFromPayment expects
type ReceiptSourceItem = {
  ReceiptPath?: string
  ReceiptEncIV?: string
  ReceiptEncAuthTag?: string
  ReceiptEncKey?: string
  OriginalFileName?: string | null
}

type ReceiptSource = ReceiptSourceItem & {
  Receipts?: ReceiptSourceItem[]
}