import { useEffect, useState } from "react"
import { AppModal } from "../../ui/modal/AppModal"
import { useChequeReceipts } from "../hooks/receipts/useChequeReceipts"
import type { CashReceiptInfo } from "../models/payment"
import { isPdfReceipt } from "../models/payment"

type ReceiptListUploadModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirmed: (receipts: CashReceiptInfo[]) => void
  /** Receipts already attached by the caller (shown when re-opening). */
  initialReceipts?: CashReceiptInfo[]
  title?: string
}

export function ReceiptListUploadModal({
  isOpen,
  onClose,
  onConfirmed,
  initialReceipts = [],
  title = "Upload Cheque Receipts",
}: ReceiptListUploadModalProps) {
  const {
    value,
    isUploading,
    error,
    upload,
    dropFiles,
    removeAt,
    confirmStaged,
    reset,
    abandon,
  } = useChequeReceipts()

  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (isOpen) {
      void reset(initialReceipts)
    }
  }, [isOpen, initialReceipts, reset])

  const handleClose = () => {
    void abandon()
    onClose()
  }

  const handleConfirm = () => {
    onConfirmed(confirmStaged())
    onClose()
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      void dropFiles(files)
    }
  }

  return (
    <AppModal isOpen={isOpen} title={title} onClose={handleClose}>
      <div className="receipt-upload-body">
        <div
          className={`receipt-dropzone ${isDragging ? "active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => void upload()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              void upload()
            }
          }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <span className="receipt-dropzone-status">Uploading...</span>
          ) : (
            <>
              <span className="receipt-dropzone-hint">
                Drag & drop receipt images or PDFs here
              </span>
              <span className="receipt-browse-label">Browse Files</span>
            </>
          )}
        </div>

        {value.length > 0 && (
          <div className="receipt-gallery">
            {value.map((receipt, index) => (
              <div key={receipt.meta.ReceiptPath} className="receipt-gallery-item">
                {isPdfReceipt(receipt) ? (
                  <div className="receipt-gallery-pdf" aria-hidden="true">
                    PDF
                  </div>
                ) : (
                  <img
                    className="receipt-gallery-thumb"
                    src={receipt.previewDataUrl}
                    alt={`Receipt preview ${index + 1}`}
                  />
                )}
                <span className="receipt-gallery-name">{receipt.fileName}</span>
                <button
                  type="button"
                  className="receipt-gallery-remove"
                  aria-label={`Remove ${receipt.fileName}`}
                  onClick={() => void removeAt(index)}
                  disabled={isUploading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="receipt-error">{error}</p>}

        {!isUploading && (
          <div className="modal-actions">
            <button
              type="button"
              className="primary-action"
              onClick={handleConfirm}
              disabled={value.length === 0}
            >
              Use These Receipts ({value.length})
            </button>
            <button type="button" className="secondary-action" onClick={handleClose}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </AppModal>
  )
}
