import type { CashReceiptInfo, ChequePaymentData } from "../models/payment"
import { isPdfReceipt } from "../models/payment"

interface ChequePaymentFormProps {
  data: ChequePaymentData
  onChange: (data: Partial<ChequePaymentData>) => void
  maxAmount: number
  receipts?: CashReceiptInfo[]
  onUploadReceipts?: () => void
  onRemoveReceipt?: (index: number) => void
}

export function ChequePaymentForm({
  data,
  onChange,
  maxAmount,
  receipts = [],
  onUploadReceipts,
  onRemoveReceipt,
}: ChequePaymentFormProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value === "" ? 0 : Number(e.target.value)
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(raw, maxAmount)) : 0
    onChange({ amount: clamped })
  }

  return (
    <div className="cheque-payment-form">
      <div className="cheque-payment-form-header">
        <p className="section-label">Cheque Payment Details</p>
      </div>

      <div className="login-form">
        <label className="field-label">
          Cheque Number
          <input
            type="text"
            className="text-input"
            placeholder="Enter cheque number"
            value={data.chequeNumber}
            onChange={(e) => onChange({ chequeNumber: e.target.value })}
            autoFocus
          />
        </label>

        <label className="field-label">
          Cheque Date
          <input
            type="date"
            className="text-input"
            value={data.chequeDate}
            onChange={(e) => onChange({ chequeDate: e.target.value })}
          />
        </label>

        <label className="field-label">
          Bank Name
          <input
            type="text"
            className="text-input"
            placeholder="Enter bank name"
            value={data.bankName}
            onChange={(e) => onChange({ bankName: e.target.value })}
          />
        </label>

        <label className="field-label">
          Amount
          <input
            type="text"
            className="text-input"
            placeholder="0.00"
            inputMode="decimal"
            value={data.amount === 0 ? "" : data.amount}
            onChange={handleAmountChange}
          />
        </label>

        <div className="cash-receipt-attach">
          {receipts.length > 0 ? (
            <div className="cheque-receipt-list">
              {receipts.map((receipt, index) => (
                <div key={receipt.meta.ReceiptPath} className="cash-receipt-chip">
                  {isPdfReceipt(receipt) ? (
                    <span className="cash-receipt-pdf-badge" aria-hidden="true">
                      PDF
                    </span>
                  ) : (
                    <img
                      className="cash-receipt-thumb"
                      src={receipt.previewDataUrl}
                      alt="Payment receipt preview"
                    />
                  )}
                  <span className="cash-receipt-filename">{receipt.fileName}</span>
                  {onRemoveReceipt && (
                    <button
                      type="button"
                      className="receipt-remove-button"
                      aria-label={`Remove ${receipt.fileName}`}
                      onClick={() => onRemoveReceipt(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          {onUploadReceipts && (
            <button
              type="button"
              className="secondary-action cash-receipt-upload-button"
              onClick={onUploadReceipts}
            >
              {receipts.length > 0 ? "Add More Receipts" : "Add Receipt"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
