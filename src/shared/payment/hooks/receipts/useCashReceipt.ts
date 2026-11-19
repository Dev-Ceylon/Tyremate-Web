import { useCallback, useRef, useState } from "react"
import {
  deleteReceipt,
  getPathForDroppedFile,
  pickReceipt,
  saveReceiptFromPath,
} from "../../api/paymentReceipt"
import type { CashReceiptInfo } from "../../models/payment"

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error ?? "Unknown error")
}

/**
 * Owns the transient state of a receipt upload session: the currently staged
 * receipt, upload progress, and error message. It also owns the lifecycle of
 * any encrypted temp files it created during the session, so closing the modal
 * without confirming never leaks files on disk. Files handed to the caller via
 * `confirmStaged()` are no longer tracked (the caller owns them from then on).
 */
export function useCashReceipt() {
  const [value, setValue] = useState<CashReceiptInfo | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valueRef = useRef<CashReceiptInfo | null>(null)
  const createdRef = useRef<CashReceiptInfo[]>([])

  const isCreatedHere = useCallback((receipt: CashReceiptInfo | null) => {
    if (!receipt) return false
    return createdRef.current.some(
      (item) => item.meta.ReceiptPath === receipt.meta.ReceiptPath
    )
  }, [])

  const discardCreated = useCallback((receipt: CashReceiptInfo) => {
    createdRef.current = createdRef.current.filter(
      (item) => item.meta.ReceiptPath !== receipt.meta.ReceiptPath
    )
  }, [])

  // Deletes a file created in this session (fire-and-forget, never throws).
  const abandonFile = useCallback(async (receipt: CashReceiptInfo) => {
    discardCreated(receipt)
    try {
      await deleteReceipt(receipt.meta)
    } catch {
      // Best effort cleanup of an unconfirmed temp file.
    }
  }, [discardCreated])

  // Deletes every unconfirmed temp file created in this session and resets the
  // staged value. Called when the modal closes without confirming.
  const abandonSession = useCallback(async () => {
    const pending = [...createdRef.current]
    createdRef.current = []
    await Promise.all(
      pending.map((receipt) => deleteReceipt(receipt.meta).catch(() => undefined))
    )
  }, [])

  // Replaces the currently staged value, cleaning up any previous temp file that
  // belongs to this session first.
  const stageReceipt = useCallback(
    async (next: CashReceiptInfo) => {
      const current = valueRef.current
      if (current && isCreatedHere(current)) {
        await abandonFile(current)
      }
      createdRef.current.push(next)
      valueRef.current = next
      setValue(next)
    },
    [abandonFile, isCreatedHere]
  )

  const upload = useCallback(async () => {
    setIsUploading(true)
    setError(null)
    try {
      const next = await pickReceipt()
      if (next) {
        await stageReceipt(next)
      }
    } catch (uploadError) {
      setError(extractErrorMessage(uploadError))
    } finally {
      setIsUploading(false)
    }
  }, [stageReceipt])

  const dropFile = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setError(null)
      try {
        const sourcePath = getPathForDroppedFile(file)
        if (!sourcePath) {
          throw new Error("Could not resolve the dropped file")
        }
        const next = await saveReceiptFromPath(sourcePath)
        await stageReceipt(next)
      } catch (dropError) {
        setError(extractErrorMessage(dropError))
      } finally {
        setIsUploading(false)
      }
    },
    [stageReceipt]
  )

  // Clears the staged selection. If the staged value was created in this
  // session its temp file is removed; a caller-owned receipt is left to the
  // caller to clean up when it confirms the removal.
  const clearSelected = useCallback(async () => {
    const current = valueRef.current
    if (current && isCreatedHere(current)) {
      await abandonFile(current)
    }
    valueRef.current = null
    setValue(null)
  }, [abandonFile, isCreatedHere])

  // Hands the staged receipt to the caller. From this point the caller owns the
  // file, so this session must no longer delete it.
  const confirmStaged = useCallback((): CashReceiptInfo | null => {
    const staged = valueRef.current
    createdRef.current = []
    return staged
  }, [])

  // Resets the session back to a caller-provided value (e.g. on modal open).
  const reset = useCallback(
    async (next: CashReceiptInfo | null) => {
      await abandonSession()
      valueRef.current = next
      setValue(next)
      setError(null)
    },
    [abandonSession]
  )

  const abandon = useCallback(async () => {
    await abandonSession()
    valueRef.current = null
    setValue(null)
    setError(null)
  }, [abandonSession])

  return {
    value,
    isUploading,
    error,
    upload,
    dropFile,
    clearSelected,
    confirmStaged,
    reset,
    abandon,
  }
}