import { AppModal } from "../../ui/modal/AppModal"
import { PaymentSettlementSummary } from "./PaymentSettlementSummary"
import { CashPaymentForm } from "./CashPaymentForm"
import { ChequePaymentForm } from "./ChequePaymentForm"
import { BankTransferPaymentForm } from "./BankTransferPaymentForm"
import type {
  CashPaymentData,
  ChequePaymentData,
  BankTransferPaymentData,
  CashReceiptInfo,
} from "../models/payment"
import {
  PAYMENT_TYPE_CODES,
  PAYMENT_TYPE_LIST,
  PAYMENT_TYPE_METADATA,
  type PaymentTypeCode,
} from "../constants/paymentTypeConstants"

type PaymentTypeModalProps = {
  isOpen: boolean
  onClose: () => void
  confirmLabel: string
  cancelLabel?: string
  onSkip?: () => void | Promise<void>
  skipLabel?: string
  selectedPaymentType: PaymentTypeCode
  onPaymentTypeChange: (type: PaymentTypeCode) => void
  needToPay: number
  enteredTotal: number
  remainingDue: number
  overPaid: number
  remainingForCash: number
  cashPaymentData: CashPaymentData
  onCashPaymentChange: (data: CashPaymentData) => void
  cashReceipt?: CashReceiptInfo | null
  onCashReceiptUpload?: () => void
  onCashReceiptRemove?: () => void
  chequePaymentData: ChequePaymentData
  onChequePaymentChange: (data: Partial<ChequePaymentData>) => void
  chequeReceipts?: CashReceiptInfo[]
  onChequeReceiptsUpload?: () => void
  onChequeReceiptRemove?: (index: number) => void
  bankTransferPaymentData: BankTransferPaymentData
  onBankTransferPaymentChange: (data: Partial<BankTransferPaymentData>) => void
  bankReceipt?: CashReceiptInfo | null
  onBankReceiptUpload?: () => void
  onBankReceiptRemove?: () => void
  onConfirm: () => void | Promise<void>
  submitting?: boolean
}

export function PaymentTypeModal({
  isOpen,
  onClose,
  confirmLabel,
  cancelLabel = "Cancel",
  onSkip,
  skipLabel,
  selectedPaymentType,
  onPaymentTypeChange,
  needToPay,
  enteredTotal,
  remainingDue,
  overPaid,
  remainingForCash,
  cashPaymentData,
  onCashPaymentChange,
  cashReceipt,
  onCashReceiptUpload,
  onCashReceiptRemove,
  chequePaymentData,
  onChequePaymentChange,
  chequeReceipts,
  onChequeReceiptsUpload,
  onChequeReceiptRemove,
  bankTransferPaymentData,
  onBankTransferPaymentChange,
  bankReceipt,
  onBankReceiptUpload,
  onBankReceiptRemove,
  onConfirm,
  submitting = false,
}: PaymentTypeModalProps) {
  const cashAmt = cashPaymentData.amountReceived || 0
  const chequeAmt = chequePaymentData.amount || 0
  const bankAmt = bankTransferPaymentData.amount || 0

  const remainingForCheque = Math.max(0, needToPay - cashAmt - bankAmt)
  const remainingForBank = Math.max(0, needToPay - cashAmt - chequeAmt)

  const isPaymentTypeConfigured = (type: PaymentTypeCode) =>
    (type === PAYMENT_TYPE_CODES.CASH && cashPaymentData.amountReceived > 0) ||
    (type === PAYMENT_TYPE_CODES.CHEQUE &&
      chequePaymentData.amount > 0 &&
      chequePaymentData.chequeNumber) ||
    (type === PAYMENT_TYPE_CODES.BANK_TRANSFER &&
      bankTransferPaymentData.amount > 0 &&
      bankTransferPaymentData.bankDetailsId)

  return (
    <AppModal isOpen={isOpen} title="Payment Type" onClose={onClose}>
      <div className="quick-order-modal-content">
        <PaymentSettlementSummary
          needToPay={needToPay}
          enteredTotal={enteredTotal}
          remainingDue={remainingDue}
          overPaid={overPaid}
        />

        <div className="selection-list">
          {PAYMENT_TYPE_LIST.filter((type) => type !== PAYMENT_TYPE_CODES.CREDIT).map((type) => {
            const isSelected = selectedPaymentType === type
            const metadata = PAYMENT_TYPE_METADATA[type]

            return (
              <button
                key={type}
                type="button"
                className={`payment-type-option ${isSelected ? "active" : ""}`}
                onClick={() => onPaymentTypeChange(type)}
                disabled={overPaid > 0 && !isSelected}
              >
                <span>
                  {metadata.name} {isPaymentTypeConfigured(type) && !isSelected && " ✓"}
                </span>
                {isSelected && <span className="active-indicator"></span>}
              </button>
            )
          })}
        </div>

        {selectedPaymentType === PAYMENT_TYPE_CODES.CASH && (
          <CashPaymentForm
            remainingToPay={remainingForCash}
            cashReceived={cashPaymentData.amountReceived}
            onCashReceivedChange={(amount) => onCashPaymentChange({ amountReceived: amount })}
            receipt={cashReceipt}
            onUploadReceipt={onCashReceiptUpload}
            onRemoveReceipt={onCashReceiptRemove}
          />
        )}

        {selectedPaymentType === PAYMENT_TYPE_CODES.CHEQUE && (
          <ChequePaymentForm
            data={chequePaymentData}
            onChange={onChequePaymentChange}
            maxAmount={remainingForCheque}
            receipts={chequeReceipts}
            onUploadReceipts={onChequeReceiptsUpload}
            onRemoveReceipt={onChequeReceiptRemove}
          />
        )}

        {selectedPaymentType === PAYMENT_TYPE_CODES.BANK_TRANSFER && (
          <BankTransferPaymentForm
            data={bankTransferPaymentData}
            onChange={onBankTransferPaymentChange}
            maxAmount={remainingForBank}
            receipt={bankReceipt}
            onUploadReceipt={onBankReceiptUpload}
            onRemoveReceipt={onBankReceiptRemove}
          />
        )}

        <div className="modal-actions modal-actions-top-margin">
          <button
            type="button"
            className="primary-action"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Confirming..." : confirmLabel}
          </button>
          <button type="button" className="secondary-action" onClick={onClose} disabled={submitting}>
            {cancelLabel}
          </button>
          {onSkip && skipLabel && (
            <button type="button" className="secondary-action" onClick={() => void onSkip()} disabled={submitting}>
              {skipLabel}
            </button>
          )}
        </div>
      </div>
    </AppModal>
  )
}
