import { useRef, useState } from "react"
import { deleteReceipt } from "../../api/paymentReceipt"
import type { CashReceiptInfo } from "../../models/payment"

export type StagedReceiptAttachments = {
  cash: CashReceiptInfo | null
  bank: CashReceiptInfo | null
  cheque: CashReceiptInfo[]
}

/**
 * Owns the receipts staged for a payment that has not been submitted yet.
 *
 * Picked/dropped files are encrypted to disk the moment they are selected, so
 * this hook tracks which files still belong to the current (unsubmitted)
 * payment and removes them when the user cancels. Once `commit()` runs (payment
 * submitted) the files belong to the persisted payment and `discard()` becomes
 * a no-op.
 */
export function useStagedReceipts() {
  const [cash, setCash] = useState<CashReceiptInfo | null>(null)
  const [bank, setBank] = useState<CashReceiptInfo | null>(null)
  const [cheque, setCheque] = useState<CashReceiptInfo[]>([])

  const committedRef = useRef(false)

  // Replaces the staged single receipt, deleting the replaced file so it is not
  // orphaned on disk (mirrors the semantics of the persisted-payment manager).
  const replaceSingle = (target: "cash" | "bank", next: CashReceiptInfo) => {
    const previous = target === "cash" ? cash : bank
    if (previous && previous.meta.ReceiptPath !== next.meta.ReceiptPath) {
      void deleteReceipt(previous.meta).catch(() => undefined)
    }
    if (target === "cash") {
      setCash(next)
    } else {
      setBank(next)
    }
  }

  const removeSingle = (target: "cash" | "bank") => {
    const previous = target === "cash" ? cash : bank
    if (previous) {
      void deleteReceipt(previous.meta).catch(() => undefined)
    }
    if (target === "cash") {
      setCash(null)
    } else {
      setBank(null)
    }
  }

  // Replaces the full cheque receipt set, deleting files that were dropped from
  // the list so they are not orphaned on disk.
  const setChequeReceipts = (next: CashReceiptInfo[]) => {
    const nextPaths = new Set(next.map((receipt) => receipt.meta.ReceiptPath))
    for (const previous of cheque) {
      if (!nextPaths.has(previous.meta.ReceiptPath)) {
        void deleteReceipt(previous.meta).catch(() => undefined)
      }
    }
    setCheque(next)
  }

  const removeChequeAt = (index: number) => {
    const target = cheque[index]
    if (!target) return
    void deleteReceipt(target.meta).catch(() => undefined)
    setCheque(cheque.filter((_, current) => current !== index))
  }

  // Marks the staged files as owned by the (now submitted) payment, so a later
  // `discard()` does not delete them. Returns the snapshot for the payload.
  const commit = (): StagedReceiptAttachments => {
    committedRef.current = true
    return { cash, bank, cheque }
  }

  // Deletes every staged file that still belongs to this (cancelled) payment
  // and clears the staging state. No-op once `commit()` ran.
  const discard = () => {
    if (committedRef.current) return
    const staged = [cash, bank, ...cheque]
    for (const receipt of staged) {
      if (receipt) {
        void deleteReceipt(receipt.meta).catch(() => undefined)
      }
    }
    setCash(null)
    setBank(null)
    setCheque([])
  }

  // Clears staging without touching files (already discarded, or owned by a
  // persisted payment). Called when the payment modal re-opens.
  const reset = () => {
    committedRef.current = false
    setCash(null)
    setBank(null)
    setCheque([])
  }

  return {
    cashReceipt: cash,
    bankReceipt: bank,
    chequeReceipts: cheque,
    replaceSingle,
    removeSingle,
    setChequeReceipts,
    removeChequeAt,
    commit,
    discard,
    reset,
  }
}