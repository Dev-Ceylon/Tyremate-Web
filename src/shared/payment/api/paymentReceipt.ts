import type { CashReceiptInfo, CashReceiptMetadata } from "../models/payment"

export type PickReceiptResult = CashReceiptMetadata & { previewDataUrl: string; OriginalFileName?: string }

// Identifies a persisted payment a receipt should be attached to.
export type ReceiptAttachTarget = {
  PaymentID: number
  PaymentTypeCode: string
}

export function fileNameFromPath(filePath: string): string {
  const parts = filePath.split(/[\\/]/)
  return parts[parts.length - 1] || filePath
}

function toCashReceiptInfo(result: PickReceiptResult): CashReceiptInfo {
  const { previewDataUrl, OriginalFileName, ...meta } = result
  return { meta, previewDataUrl, fileName: OriginalFileName ?? fileNameFromPath(meta.ReceiptPath) }
}

// Opens the native file picker, encrypts & stores the chosen image, and returns
// the receipt attachment ready for display. Returns null if the user cancelled.
export async function pickReceipt(): Promise<CashReceiptInfo | null> {
  const result = await window.api.paymentReceipt.choose()
  return result ? toCashReceiptInfo(result) : null
}

// Opens the native multi-file picker, encrypts & stores the chosen images/PDFs,
// and returns the receipts ready for display. Returns [] if the user cancelled.
export async function pickMultipleReceipts(): Promise<CashReceiptInfo[]> {
  const results = await window.api.paymentReceipt.chooseMultiple()
  return results.map(toCashReceiptInfo)
}

// Encrypts & stores an image given its filesystem path (drag-and-drop flow).
export async function saveReceiptFromPath(sourcePath: string): Promise<CashReceiptInfo> {
  const result = await window.api.paymentReceipt.saveFromPath(sourcePath)
  return toCashReceiptInfo(result)
}

// Resolves a dropped File path and saves it as an encrypted receipt
// (drag-and-drop flow). Throws when the file cannot be resolved.
export async function saveDroppedReceipt(file: File): Promise<CashReceiptInfo> {
  const sourcePath = getPathForDroppedFile(file)
  if (!sourcePath) {
    throw new Error("Could not resolve the dropped file")
  }
  return saveReceiptFromPath(sourcePath)
}

// Resolves the filesystem path of a dropped File (Electron webUtils).
export function getPathForDroppedFile(file: File): string {
  return window.api.getPathForFile(file)
}

// Removes an encrypted receipt file from disk.
export async function deleteReceipt(meta: CashReceiptMetadata): Promise<void> {
  await window.api.paymentReceipt.delete(meta)
}

// Decrypts a stored receipt from disk and returns it ready for display.
// Used to render receipts already attached to persisted payments.
export async function readStoredReceipt(
  meta: CashReceiptMetadata,
  originalFileName?: string | null
): Promise<CashReceiptInfo> {
  const { dataUrl } = await window.api.paymentReceipt.read(meta)
  return {
    meta,
    previewDataUrl: dataUrl,
    fileName: originalFileName ?? fileNameFromPath(meta.ReceiptPath),
  }
}

// Decrypts a stored receipt to a temp file and opens it in the default app
// (PDFs open in the default browser/pdf viewer). Returns the temp file path.
export async function openStoredReceipt(meta: CashReceiptMetadata): Promise<string> {
  const { filePath } = await window.api.paymentReceipt.open(meta)
  return filePath
}

// Persists already-encrypted receipt metadata onto a payment.
// Cash/Bank Transfer replaces the stored single receipt; Cheque appends.
export async function attachPaymentReceipts(
  target: ReceiptAttachTarget,
  receipts: CashReceiptMetadata[]
): Promise<void> {
  await window.api.paymentReceipt.attach({
    PaymentID: target.PaymentID,
    PaymentTypeCode: target.PaymentTypeCode,
    receipts,
  })
}

// Removes a single stored receipt from a cheque payment (row + encrypted file).
export async function removePaymentReceipt(
  target: ReceiptAttachTarget,
  receiptId: number
): Promise<void> {
  await window.api.paymentReceipt.remove({
    PaymentID: target.PaymentID,
    PaymentTypeCode: target.PaymentTypeCode,
    receiptId,
  })
}