import { useEffect, useState } from "react"
import { AppModal } from "../../ui/modal/AppModal"
import { useReceiptPreview } from "../hooks/receipts/useReceiptPreview"
import { useReceiptManage, type ReceiptManageConfig } from "../hooks/receipts/useReceiptManage"
import type { ReceiptPreviewItem } from "../utils/receiptPreviewHelpers"
import { ReceiptDropzone } from "./ReceiptDropzone"
import { ReceiptPreviewCard } from "./ReceiptPreviewCard"
import { ReceiptLightbox } from "./ReceiptLightbox"

type ReceiptPreviewModalProps = {
  isOpen: boolean
  onClose: () => void
  /** Existing receipt metadata to decrypt and display. */
  receipts: ReceiptPreviewItem[]
  title?: string
  /** When provided, the modal becomes a manage view: upload/replace/remove receipts. */
  manage?: ReceiptManageConfig
}

export function ReceiptPreviewModal({
  isOpen,
  onClose,
  receipts,
  title = "Payment Receipts",
  manage,
}: ReceiptPreviewModalProps) {
  const { loaded, isLoading, loadError, selected, loadReceipts, openAt, closeSelection } =
    useReceiptPreview(receipts)

  const { isUploading, actionError, isCheque, handleUpload, handleDropFiles, handleRemove } =
    useReceiptManage({
      manage,
      loaded,
    })

  const [pdfError, setPdfError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      void loadReceipts()
    }
  }, [isOpen, loadReceipts])

  const handleClose = () => {
    setPdfError(null)
    onClose()
  }

  const hasError = loadError ?? actionError ?? pdfError

  return (
    <>
      <AppModal isOpen={isOpen} title={title} onClose={handleClose}>
        <div className="receipt-upload-body">
          {manage && (
            <ReceiptDropzone
              isUploading={isUploading}
              onUpload={() => void handleUpload()}
              onDropFiles={(files) => void handleDropFiles(files)}
            />
          )}

          {!isUploading && isLoading && (
            <p className="receipt-dropzone-status">Loading receipts...</p>
          )}

          {!isLoading && hasError && <p className="receipt-error">{hasError}</p>}

          {!isUploading && !isLoading && !hasError && loaded.length === 0 && (
            <p className="receipt-dropzone-status">No receipts attached.</p>
          )}

          {!isLoading && loaded.length > 0 && (
            <div className="receipt-preview-gallery">
              {loaded.map((receipt, index) => (
                <ReceiptPreviewCard
                  key={receipt.meta.ReceiptPath}
                  receipt={receipt}
                  canRemove={Boolean(manage && isCheque && receipt.meta.ID)}
                  disabled={isUploading}
                  onRemove={() => void handleRemove(receipt)}
                  onOpenImage={() => openAt(index)}
                  onPdfError={setPdfError}
                />
              ))}
            </div>
          )}
        </div>
      </AppModal>

      <ReceiptLightbox selected={selected} onClose={closeSelection} />
    </>
  )
}