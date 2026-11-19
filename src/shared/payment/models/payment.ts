export interface CashPaymentData {
  amountReceived: number
}

// Metadata persisted on a CashPayments row for an encrypted receipt image.
// The image file itself is encrypted with AES-256-GCM and stored under the app
// receipts directory; these fields are the per-file IV/auth tag and the
// master-wrapped data key.
export type CashReceiptMetadata = {
  ReceiptPath: string
  ReceiptEncIV: string
  ReceiptEncAuthTag: string
  ReceiptEncKey: string
}

// Runtime receipt attachment used by the receipt upload flow.
export type CashReceiptInfo = {
  meta: CashReceiptMetadata
  previewDataUrl: string
  fileName: string
}

// True when a receipt attachment is a PDF document (stored as "<name>.pdf.enc").
export function isPdfReceipt(receipt?: CashReceiptInfo | null): boolean {
  return isPdfReceiptMeta(receipt?.meta ?? null)
}

// True when receipt metadata points to a PDF document.
export function isPdfReceiptMeta(meta?: { ReceiptPath?: string } | null): boolean {
  const receiptPath = meta?.ReceiptPath
  return typeof receiptPath === "string" && /\.pdf(\.enc)?$/i.test(receiptPath)
}

export interface ChequePaymentData {
  chequeNumber: string
  chequeDate: string
  bankName: string
  amount: number
  /** Staged encrypted receipt attachments for a multi-file cheque payment. */
  receipts?: CashReceiptInfo[]
}

export interface BankTransferPaymentData {
  bankDetailsId?: number
  bankName: string
  accountNumber: string
  accountName: string
  branch: string
  amount: number
}
