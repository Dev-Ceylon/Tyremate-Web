import { useState } from "react"
import { receiptItemsFromPayment } from "../../../shared/payment/utils/receiptPreviewHelpers"
import type { ReceiptManageConfig } from "../../../shared/payment/hooks/receipts/useReceiptManage"
import type { SoPaymentRecord } from "../models/salesOrder"

type UseReceiptViewerOptions = {
  payments: SoPaymentRecord[] | Record<string, unknown>[]
  onReceiptsChanged?: () => void | Promise<void>
}

/**
 * Owns which payment's receipts are open in the preview modal and derives the
 * modal props (receipts, title, optional manage config) from the live order,
 * so uploading/replacing/removing a receipt re-renders without unmounting.
 */
export function useReceiptViewer({ payments, onReceiptsChanged }: UseReceiptViewerOptions) {
  const [openReceiptPaymentId, setOpenReceiptPaymentId] = useState<number | null>(null)

  const openPayment =
    payments.find((payment) => {
      const pid = (payment as Record<string, any>).PaymentID
      return pid === openReceiptPaymentId
    }) ?? null
  const previewReceipts = openPayment ? receiptItemsFromPayment(openPayment) : []
  const previewTitle = openPayment
    ? `${(openPayment as Record<string, any>).PaymentTypeName} Receipt${previewReceipts.length > 1 ? "s" : ""}`
    : "Payment Receipts"

  const manage: ReceiptManageConfig | undefined =
    openPayment && (openPayment as Record<string, any>).PaymentID != null && onReceiptsChanged
      ? {
          PaymentID: (openPayment as Record<string, any>).PaymentID,
          PaymentTypeCode: (openPayment as Record<string, any>).PaymentTypeCode,
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