import { isPdfReceiptMeta } from "../models/payment"
import type { LoadedReceipt } from "../hooks/receipts/useReceiptPreview"

type ReceiptLightboxProps = {
  selected: LoadedReceipt | null
  onClose: () => void
}

export function ReceiptLightbox({ selected, onClose }: ReceiptLightboxProps) {
  if (!selected || selected.failed || !selected.dataUrl || isPdfReceiptMeta(selected.meta)) {
    return null
  }

  return (
    <div className="receipt-lightbox-backdrop" onClick={onClose}>
      <div className="receipt-lightbox" onClick={(event) => event.stopPropagation()}>
        <img className="receipt-lightbox-image" src={selected.dataUrl} alt={selected.fileName} />
        <span className="receipt-lightbox-name">{selected.fileName}</span>
        <button
          type="button"
          className="secondary-action receipt-lightbox-close"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}