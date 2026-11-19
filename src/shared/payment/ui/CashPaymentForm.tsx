import type { CashReceiptInfo } from "../models/payment"
import { isPdfReceipt } from "../models/payment"

interface CashPaymentFormProps {
  remainingToPay: number
  cashReceived: number
  onCashReceivedChange: (amount: number) => void
  receipt?: CashReceiptInfo | null
  onUploadReceipt?: () => void
  onRemoveReceipt?: () => void
}

export function CashPaymentForm({
  remainingToPay,
  cashReceived,
  onCashReceivedChange,
  receipt,
  onUploadReceipt,
  onRemoveReceipt,
}: CashPaymentFormProps) {
  const balance = Math.max(0, cashReceived - remainingToPay)

  return (
    <div className="cash-payment-form">
      <div className="cash-payment-form-header">
        <p className="section-label">Cash Payment Details</p>
      </div>

      <div className="login-form">
        <label className="field-label">
          Amount Received
          <input
            type="number"
            className="text-input"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={Number.isFinite(cashReceived) ? cashReceived : ""}
            onChange={(e) =>
              onCashReceivedChange(e.target.value === "" ? 0 : Number(e.target.value))
            }
            autoFocus
          />
        </label>

        <label className="field-label">
          Balance to Return
          <div
            className={`text-input cash-payment-balance-display ${
              balance > 0 ? "cash-payment-balance-positive" : ""
            }`}
          >
            ${balance.toFixed(2)}
          </div>
        </label>
      </div>

      {onUploadReceipt && (
        <div className="cash-receipt-attach">
          {receipt ? (
            <div className="cash-receipt-chip">
              {isPdfReceipt(receipt) ? (
                <span className="cash-receipt-pdf-badge">PDF</span>
              ) : (
                <img
                  src={receipt.previewDataUrl}
                  alt="Payment receipt preview"
                  className="cash-receipt-thumb"
                />
              )}
              <span className="cash-receipt-filename">{receipt.fileName}</span>
              <button
                type="button"
                className="secondary-action"
                onClick={onUploadReceipt}
              >
                Change
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={onRemoveReceipt}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="secondary-action cash-receipt-upload-button"
              onClick={onUploadReceipt}
            >
              Upload Payment Receipt
            </button>
          )}
        </div>
      )}
    </div>
  )
}