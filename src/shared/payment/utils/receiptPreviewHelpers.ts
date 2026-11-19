import type { CashReceiptMetadata } from "../models/payment"

export type ReceiptPreviewItem = CashReceiptMetadata & {
  ID?: number
  SortOrder?: number
  OriginalFileName?: string | null
}

type ReceiptSourceItem = {
  ReceiptPath?: string
  ReceiptEncIV?: string
  ReceiptEncAuthTag?: string
  ReceiptEncKey?: string
  OriginalFileName?: string | null
}

type PaymentReceiptSource = ReceiptSourceItem & {
  Receipts?: ReceiptSourceItem[]
}

function isCompleteReceipt(source: ReceiptSourceItem): source is ReceiptPreviewItem {
  return Boolean(
    source.ReceiptPath &&
      source.ReceiptEncIV &&
      source.ReceiptEncAuthTag &&
      source.ReceiptEncKey
  )
}

// Builds a CashReceiptMetadata from a stored payment item's single-receipt
// columns (cash / bank transfer). Returns null when no usable metadata exists.
export function singleReceiptMetaFromPayment(payment: ReceiptSourceItem): CashReceiptMetadata | null {
  if (!isCompleteReceipt(payment)) return null
  return {
    ReceiptPath: payment.ReceiptPath,
    ReceiptEncIV: payment.ReceiptEncIV,
    ReceiptEncAuthTag: payment.ReceiptEncAuthTag,
    ReceiptEncKey: payment.ReceiptEncKey,
  }
}

// Normalizes any payment item into a flat list of decryptable receipt items.
export function receiptItemsFromPayment(payment: PaymentReceiptSource): ReceiptPreviewItem[] {
  if (Array.isArray(payment.Receipts) && payment.Receipts.length > 0) {
    return payment.Receipts.filter(isCompleteReceipt)
  }
  const single = singleReceiptMetaFromPayment(payment)
  return single ? [single] : []
}