import { useCallback, useRef, useState } from "react"
import {
  deleteReceipt,
  getPathForDroppedFile,
  pickMultipleReceipts,
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
 * List-aware equivalent of `useCashReceipt` for multi-file receipt uploads.
 * Manages an array of staged receipt attachments, handles transient temp files
 * created during the session, and hands the final list to the caller on confirm.
 * Files handed to the caller via `confirmStaged()` are no longer tracked.
 */
export function useChequeReceipts() {
  const [value, setValue] = useState<CashReceiptInfo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valueRef = useRef<CashReceiptInfo[]>([])
  const createdRef = useRef<CashReceiptInfo[]>([])

  const pathSet = useCallback((receipts: CashReceiptInfo[]) => {
    return new Set(receipts.map((r) => r.meta.ReceiptPath))
  }, [])

  const createdPaths = useCallback(() => pathSet(createdRef.current), [pathSet])

  const isCreatedHere = useCallback(
    (receipt: CashReceiptInfo) => createdPaths().has(receipt.meta.ReceiptPath),
    [createdPaths]
  )

  const discardCreated = useCallback(
    (receipt: CashReceiptInfo) => {
      createdRef.current = createdRef.current.filter(
        (item) => item.meta.ReceiptPath !== receipt.meta.ReceiptPath
      )
    },
    []
  )

  const abandonFile = useCallback(
    async (receipt: CashReceiptInfo) => {
      discardCreated(receipt)
      try {
        await deleteReceipt(receipt.meta)
      } catch {
        // Best effort cleanup of an unconfirmed temp file.
      }
    },
    [discardCreated]
  )

  const abandonSession = useCallback(async () => {
    const pending = [...createdRef.current]
    createdRef.current = []
    await Promise.all(
      pending.map((receipt) => deleteReceipt(receipt.meta).catch(() => undefined))
    )
  }, [])

  const emit = useCallback((next: CashReceiptInfo[]) => {
    valueRef.current = next
    setValue(next)
  }, [])

  const stageMany = useCallback(
    async (receipts: CashReceiptInfo[]) => {
      createdRef.current.push(...receipts)
      emit([...valueRef.current, ...receipts])
    },
    [emit]
  )

  const upload = useCallback(async () => {
    setIsUploading(true)
    setError(null)
    try {
      const results = await pickMultipleReceipts()
      if (results.length > 0) {
        await stageMany(results)
      }
    } catch (uploadError) {
      setError(extractErrorMessage(uploadError))
    } finally {
      setIsUploading(false)
    }
  }, [stageMany])

  const dropFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsUploading(true)
      setError(null)
      try {
        const results: CashReceiptInfo[] = []
        for (const file of Array.from(files)) {
          const sourcePath = getPathForDroppedFile(file)
          if (!sourcePath) {
            throw new Error("Could not resolve the dropped file")
          }
          results.push(await saveReceiptFromPath(sourcePath))
        }
        if (results.length > 0) {
          await stageMany(results)
        }
      } catch (dropError) {
        setError(extractErrorMessage(dropError))
      } finally {
        setIsUploading(false)
      }
    },
    [stageMany]
  )

  const removeAt = useCallback(
    async (index: number) => {
      const current = valueRef.current
      const target = current[index]
      if (!target) return
      const next = current.filter((_, i) => i !== index)
      emit(next)
      if (isCreatedHere(target)) {
        await abandonFile(target)
      }
    },
    [emit, isCreatedHere, abandonFile]
  )

  const confirmStaged = useCallback((): CashReceiptInfo[] => {
    const staged = [...valueRef.current]
    createdRef.current = []
    return staged
  }, [])

  const reset = useCallback(
    async (next: CashReceiptInfo[]) => {
      await abandonSession()
      emit(next)
      setError(null)
    },
    [abandonSession, emit]
  )

  const abandon = useCallback(async () => {
    await abandonSession()
    emit([])
    setError(null)
  }, [abandonSession, emit])

  return {
    value,
    isUploading,
    error,
    upload,
    dropFiles,
    removeAt,
    confirmStaged,
    reset,
    abandon,
  }
}
