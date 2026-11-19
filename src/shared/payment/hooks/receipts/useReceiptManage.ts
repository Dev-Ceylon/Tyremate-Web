import { useCallback, useState } from "react"
import {
  attachPaymentReceipts,
  deleteReceipt,
  pickMultipleReceipts,
  pickReceipt,
  removePaymentReceipt,
  saveDroppedReceipt,
} from "../../api/paymentReceipt"
import { PAYMENT_TYPE_CODES } from "../../constants/paymentTypeConstants"
import type { CashReceiptInfo } from "../../models/payment"
import type { LoadedReceipt } from "./useReceiptPreview"

export type ReceiptManageConfig = {
  PaymentID: number
  PaymentTypeCode: string
  onAttached: () => void | Promise<void>
}

type UseReceiptManageOptions = {
  /** Null when the modal is used in read-only mode (no manage actions shown). */
  manage?: ReceiptManageConfig | null
  /** Currently loaded receipts; used to decide whether a single upload replaces one. */
  loaded: LoadedReceipt[]
}

export function useReceiptManage({ manage, loaded }: UseReceiptManageOptions) {
  const [isUploading, setIsUploading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isCheque = manage?.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE

  const handleSave = useCallback(async () => {
    await manage?.onAttached()
  }, [manage])

  // Persists staged receipts onto the payment. Cleans up the temp files on
  // failure, or when the user declines replacing an existing single receipt.
  const persistReceipts = useCallback(
    async (receipts: CashReceiptInfo[]): Promise<boolean> => {
      if (!manage || receipts.length === 0) return false
      setActionError(null)
      try {
        if (isCheque) {
          await attachPaymentReceipts(manage, receipts.map((r) => r.meta))
        } else {
          const previous = loaded.find((item) => !item.failed)
          const target = receipts[receipts.length - 1]
          if (previous && previous.meta.ReceiptPath !== target.meta.ReceiptPath) {
            const replace = window.confirm(
              "This payment already has a receipt. Uploading a new one will replace it. Continue?"
            )
            if (!replace) {
              void Promise.all(receipts.map((r) => deleteReceipt(r.meta).catch(() => undefined)))
              return false
            }
          }
          await attachPaymentReceipts(manage, [target.meta])
        }
        await handleSave()
        return true
      } catch (error) {
        void Promise.all(receipts.map((r) => deleteReceipt(r.meta).catch(() => undefined)))
        setActionError(error instanceof Error ? error.message : "Failed to upload receipt")
        return false
      }
    },
    [manage, isCheque, loaded, handleSave]
  )

  const handleUpload = useCallback(async () => {
    if (!manage || isUploading) return
    setIsUploading(true)
    setActionError(null)
    try {
      const picked = isCheque ? await pickMultipleReceipts() : await pickReceipt()
      const receipts = Array.isArray(picked) ? picked : picked ? [picked] : []
      if (receipts.length > 0) {
        await persistReceipts(receipts)
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to upload receipt")
    } finally {
      setIsUploading(false)
    }
  }, [manage, isUploading, isCheque, persistReceipts])

  // Drag-and-drop upload: saves each dropped file as an encrypted receipt, then
  // persists them. Single-receipt payments only take the first dropped file.
  const handleDropFiles = useCallback(
    async (files: File[]) => {
      if (!manage || isUploading || files.length === 0) return
      setIsUploading(true)
      setActionError(null)
      const saved: CashReceiptInfo[] = []
      try {
        const allowed = isCheque ? files : files.slice(0, 1)
        for (const file of allowed) {
          saved.push(await saveDroppedReceipt(file))
        }
        if (saved.length > 0) {
          await persistReceipts(saved)
        }
      } catch (error) {
        void Promise.all(saved.map((r) => deleteReceipt(r.meta).catch(() => undefined)))
        setActionError(error instanceof Error ? error.message : "Failed to upload receipt")
      } finally {
        setIsUploading(false)
      }
    },
    [manage, isUploading, isCheque, persistReceipts]
  )

  const handleRemove = useCallback(
    async (receipt: LoadedReceipt) => {
      if (!manage || isUploading || !receipt.meta.ID) return

      const confirmed = window.confirm("Remove this receipt?")
      if (!confirmed) return

      setIsUploading(true)
      setActionError(null)
      try {
        await removePaymentReceipt(manage, receipt.meta.ID)
        await handleSave()
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Failed to remove receipt")
      } finally {
        setIsUploading(false)
      }
    },
    [manage, isUploading, handleSave]
  )

  return { isUploading, actionError, isCheque, handleUpload, handleDropFiles, handleRemove }
}