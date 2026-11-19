import { useEffect, useRef, useState } from "react"
import { useStagedReceipts } from "../hooks/receipts/useStagedReceipts"
import { PaymentTypeModal } from "./PaymentTypeModal"
import { ReceiptUploadModal } from "./ReceiptUploadModal"
import { ReceiptListUploadModal } from "./ReceiptListUploadModal"
import type { PaymentFormState } from "../models/paymentForm"
import type { BankTransferPaymentData, ChequePaymentData, CashReceiptInfo } from "../models/payment"

type PaymentModalControllerProps<T> = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (payload: T) => void | Promise<void>
  confirmLabel: string
  cancelLabel?: string
  onSkip?: () => void | Promise<void>
  skipLabel?: string
  submitting?: boolean
  form: PaymentFormState<T>
}

// Which receipt sub-modal is currently visible. Discriminated union keeps the
// single-receipt target and the cheque multi-receipt flow mutually exclusive.
type ReceiptModalRoute =
  | { kind: "single"; target: "cash" | "bank" }
  | { kind: "cheque" }
  | null

export function PaymentModalController<T>({
  isOpen,
  onClose,
  onConfirm,
  confirmLabel,
  cancelLabel,
  onSkip,
  skipLabel,
  submitting = false,
  form,
}: PaymentModalControllerProps<T>) {
  const {
    selectedPaymentType,
    setSelectedPaymentType,
    cashPaymentData,
    setCashPaymentData,
    chequePaymentData,
    setChequePaymentData,
    bankTransferPaymentData,
    setBankTransferPaymentData,
    resetPaymentForm,
    getPaymentPayload,
    isValid,
    settlement,
  } = form

  const {
    cashReceipt,
    bankReceipt,
    chequeReceipts,
    replaceSingle,
    removeSingle,
    setChequeReceipts,
    removeChequeAt,
    commit,
    discard,
    reset,
  } = useStagedReceipts()

  const [receiptModal, setReceiptModal] = useState<ReceiptModalRoute>(null)

  // The staged-receipt and payment-form hooks return fresh function identities
  // on every render. Calling them directly from effects whose dependency array
  // included them caused the effect to re-run on every render (setState in the
  // effect -> re-render -> new identity -> effect fires again -> infinite loop).
  // Holding the latest callbacks in refs keeps the isOpen-triggered effects tied
  // only to the prop that actually matters.
  const resetPaymentFormRef = useRef(resetPaymentForm)
  const resetRef = useRef(reset)
  const discardRef = useRef(discard)

  useEffect(() => {
    resetPaymentFormRef.current = resetPaymentForm
    resetRef.current = reset
    discardRef.current = discard
  }, [resetPaymentForm, reset, discard])

  useEffect(() => {
    if (isOpen) {
      resetPaymentFormRef.current()
      resetRef.current()
    }
  }, [isOpen])

  // When the payment modal closes without a submitted payment, remove any
  // pending receipt temp files so they are not orphaned on disk.
  useEffect(() => {
    if (!isOpen) {
      discardRef.current()
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (!isValid) return
    const staged = commit()
    void onConfirm(getPaymentPayload(staged))
  }

  const handleSkip = () => {
    discardRef.current()
    void onSkip?.()
  }

  const handleSingleReceiptConfirmed = (receipt: CashReceiptInfo | null) => {
    if (receiptModal?.kind === "single") {
      if (receipt) {
        replaceSingle(receiptModal.target, receipt)
      } else {
        removeSingle(receiptModal.target)
      }
    }
    setReceiptModal(null)
  }

  const handleChequeReceiptsConfirmed = (receipts: CashReceiptInfo[]) => {
    setChequeReceipts(receipts)
    setReceiptModal(null)
  }

  const openCashReceiptUpload = () => {
    setReceiptModal({ kind: "single", target: "cash" })
  }

  const openBankReceiptUpload = () => {
    setReceiptModal({ kind: "single", target: "bank" })
  }

  const openChequeReceiptsUpload = () => {
    setReceiptModal({ kind: "cheque" })
  }

  const closeReceiptModal = () => {
    setReceiptModal(null)
  }

  const handleCashReceiptRemove = () => {
    removeSingle("cash")
  }

  const handleBankReceiptRemove = () => {
    removeSingle("bank")
  }

  const handleChequePaymentChange = (data: Partial<ChequePaymentData>) => {
    setChequePaymentData((prev: ChequePaymentData) => ({ ...prev, ...data }))
  }

  const handleBankTransferPaymentChange = (data: Partial<BankTransferPaymentData>) => {
    setBankTransferPaymentData((prev: BankTransferPaymentData) => ({ ...prev, ...data }))
  }

  const singleReceiptTarget = receiptModal?.kind === "single" ? receiptModal.target : null

  return (
    <>
      <PaymentTypeModal
        isOpen={isOpen}
        onClose={onClose}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onSkip={onSkip ? handleSkip : undefined}
        skipLabel={skipLabel}
        selectedPaymentType={selectedPaymentType}
        onPaymentTypeChange={setSelectedPaymentType}
        needToPay={settlement.needToPay}
        enteredTotal={settlement.enteredTotal}
        remainingDue={settlement.remainingDue}
        overPaid={settlement.overPaid}
        remainingForCash={settlement.remainingForCash}
        cashPaymentData={cashPaymentData}
        onCashPaymentChange={setCashPaymentData}
        cashReceipt={cashReceipt}
        onCashReceiptUpload={openCashReceiptUpload}
        onCashReceiptRemove={handleCashReceiptRemove}
        chequePaymentData={chequePaymentData}
        onChequePaymentChange={handleChequePaymentChange}
        chequeReceipts={chequeReceipts}
        onChequeReceiptsUpload={openChequeReceiptsUpload}
        onChequeReceiptRemove={removeChequeAt}
        bankTransferPaymentData={bankTransferPaymentData}
        onBankTransferPaymentChange={handleBankTransferPaymentChange}
        bankReceipt={bankReceipt}
        onBankReceiptUpload={openBankReceiptUpload}
        onBankReceiptRemove={handleBankReceiptRemove}
        onConfirm={handleConfirm}
        submitting={submitting}
      />

      <ReceiptUploadModal
        isOpen={receiptModal?.kind === "single"}
        onClose={closeReceiptModal}
        onConfirmed={handleSingleReceiptConfirmed}
        initialReceipt={singleReceiptTarget === "bank" ? bankReceipt : cashReceipt}
      />

      <ReceiptListUploadModal
        isOpen={receiptModal?.kind === "cheque"}
        onClose={closeReceiptModal}
        onConfirmed={handleChequeReceiptsConfirmed}
        initialReceipts={chequeReceipts}
      />
    </>
  )
}
