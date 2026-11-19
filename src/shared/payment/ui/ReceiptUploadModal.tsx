import { useEffect, useState } from "react"
import { AppModal } from "../../ui/modal/AppModal"
import { useCashReceipt } from "../hooks/receipts/useCashReceipt"
import type { CashReceiptInfo } from "../models/payment"
import { isPdfReceipt } from "../models/payment"

type ReceiptUploadModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirmed: (receipt: CashReceiptInfo | null) => void
  /** A receipt already attached by the caller (e.g. to replace when re-opening). */
  initialReceipt?: CashReceiptInfo | null
  title?: string
}

export function ReceiptUploadModal({
  isOpen,
  onClose,
  onConfirmed,
  initialReceipt = null,
  title = "Upload Payment Receipt",
}: ReceiptUploadModalProps) {
  const {
    value,
    isUploading,
    error,
    upload,
    dropFile,
    clearSelected,
    confirmStaged,
    reset,
    abandon,
  } = useCashReceipt()

  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (isOpen) {
      void reset(initialReceipt)
    }
  }, [isOpen, initialReceipt, reset])

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
    const file = event.dataTransfer.files?.[0]
    if (file) {
      void dropFile(file)
    }
  }

  return (
    <AppModal isOpen={isOpen} title={title} onClose={handleClose}>
      <div className="receipt-upload-body">
        {value ? (
          <div className="receipt-preview">
            {isPdfReceipt(value) ? (
              <span className="receipt-pdf-icon" aria-hidden="true">
                PDF
              </span>
            ) : (
              <img src={value.previewDataUrl} alt="Payment receipt preview" />
            )}
            <div className="receipt-preview-info">
              <span className="receipt-filename">{value.fileName}</span>
              <div className="receipt-preview-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => void upload()}
                  disabled={isUploading}
                >
                  Change
                </button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => void clearSelected()}
                  disabled={isUploading}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
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
                  Drag & drop a receipt image or PDF here
                </span>
                <span className="receipt-browse-label">Browse Files</span>
              </>
            )}
          </div>
        )}

        {error && <p className="receipt-error">{error}</p>}

        {!isUploading && (
          <div className="modal-actions">
            <button
              type="button"
              className="primary-action"
              onClick={handleConfirm}
              disabled={!value}
            >
              Use This Receipt
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </AppModal>
  )
}