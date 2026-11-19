import { useState } from "react"
import { isPdfReceiptMeta } from "../models/payment"
import { openStoredReceipt } from "../api/paymentReceipt"
import type { LoadedReceipt } from "../hooks/receipts/useReceiptPreview"

type ReceiptPreviewCardProps = {
  receipt: LoadedReceipt
  /** Whether the manage-mode remove button should be shown for this receipt. */
  canRemove: boolean
  /** Disables actions while an upload is in progress. */
  disabled?: boolean
  onRemove: () => void
  onOpenImage: () => void
  onPdfError: (message: string | null) => void
}

export function ReceiptPreviewCard({
  receipt,
  canRemove,
  disabled = false,
  onRemove,
  onOpenImage,
  onPdfError,
}: ReceiptPreviewCardProps) {
  const [isOpeningPdf, setIsOpeningPdf] = useState(false)

  const handleOpenPdf = async () => {
    onPdfError(null)
    setIsOpeningPdf(true)
    try {
      await openStoredReceipt(receipt.meta)
    } catch (error) {
      onPdfError(error instanceof Error ? error.message : "Failed to open the PDF")
    } finally {
      setIsOpeningPdf(false)
    }
  }

  return (
    <div className="receipt-preview-card">
      {canRemove && (
        <button
          type="button"
          className="receipt-gallery-remove"
          aria-label={`Remove ${receipt.fileName}`}
          onClick={onRemove}
          disabled={disabled}
        >
          ×
        </button>
      )}
      {receipt.failed ? (
        <div className="receipt-preview-failed">
          <span className="receipt-preview-failed-label">Unavailable</span>
        </div>
      ) : isPdfReceiptMeta(receipt.meta) ? (
        <button
          type="button"
          className="receipt-gallery-pdf"
          onClick={() => void handleOpenPdf()}
          disabled={isOpeningPdf}
          aria-label={`Open ${receipt.fileName} in browser`}
        >
          {isOpeningPdf ? "Opening..." : "PDF"}
        </button>
      ) : (
        <button
          type="button"
          className="receipt-preview-thumb-btn"
          onClick={onOpenImage}
          aria-label={`Open ${receipt.fileName}`}
        >
          <img
            className="receipt-preview-thumb"
            src={receipt.dataUrl}
            alt={receipt.fileName}
          />
        </button>
      )}
      <span className="receipt-preview-name" title={receipt.fileName}>
        {receipt.fileName}
      </span>
    </div>
  )
}