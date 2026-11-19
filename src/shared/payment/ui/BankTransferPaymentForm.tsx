import type { ChangeEvent } from "react"
import type { BankTransferPaymentData, CashReceiptInfo } from "../models/payment"
import { isPdfReceipt } from "../models/payment"
import { useBankDetailsLookup } from "../hooks/useBankDetailsLookup"

interface BankTransferPaymentFormProps {
  data: BankTransferPaymentData
  onChange: (data: Partial<BankTransferPaymentData>) => void
  maxAmount: number
  receipt?: CashReceiptInfo | null
  onUploadReceipt?: () => void
  onRemoveReceipt?: () => void
}

export function BankTransferPaymentForm({
  data,
  onChange,
  maxAmount,
  receipt,
  onUploadReceipt,
  onRemoveReceipt,
}: BankTransferPaymentFormProps) {
  const { bankDetails, loading, error } = useBankDetailsLookup()

  const getPlaceholderText = () => {
    if (loading) return "Loading accounts..."
    if (error) return "Error loading accounts"
    if (bankDetails.length === 0) return "No saved accounts found"
    return "Choose a saved account..."
  }

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value === "" ? 0 : Number(e.target.value)
    const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(raw, maxAmount)) : 0
    onChange({ amount: clamped })
  }

  const handleSelectBank = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value === "" ? undefined : Number(e.target.value)

    if (id !== undefined) {
      const bank = bankDetails.find((b) => b.id === id)
      if (bank) {
        onChange({
          bankDetailsId: bank.id,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          accountName: bank.accountName,
          branch: bank.branch,
        })
        return
      }
    }
    onChange({ bankDetailsId: undefined, bankName: "", accountNumber: "", accountName: "", branch: "" })
  }

  return (
    <div className="bank-payment-form">
      <div className="bank-payment-form-header">
        <p className="section-label">Bank Transfer Details</p>
      </div>

      <div className="login-form">
        <label className="field-label">
          Select Saved Account (Optional)
          <select
            className="text-input"
            value={data.bankDetailsId || ""}
            onChange={handleSelectBank}
            disabled={loading || bankDetails.length === 0}
            autoFocus
          >
            <option value="" disabled>
              {getPlaceholderText()}
            </option>
            {bankDetails.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.bankName} - {bank.accountNumber} ({bank.accountName})
              </option>
            ))}
          </select>
        </label>

        {data.bankDetailsId !== undefined && (
          <div className="bank-details-info">
            <div className="hero-text bank-details-row">
              <span className="bank-details-row-label">Bank Name:</span>
              {data.bankName}
            </div>
            <div className="hero-text bank-details-row">
              <span className="bank-details-row-label">Account Number:</span>
              {data.accountNumber}
            </div>
            <div className="hero-text bank-details-row">
              <span className="bank-details-row-label">Account Name:</span>
              {data.accountName}
            </div>
            <div className="hero-text bank-details-row">
              <span className="bank-details-row-label">Branch:</span>
              {data.branch}
            </div>
          </div>
        )}

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
