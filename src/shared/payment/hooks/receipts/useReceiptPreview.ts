import { useCallback, useState } from "react"
import { readStoredReceipt } from "../../api/paymentReceipt"
import type { CashReceiptInfo } from "../../models/payment"
import type { ReceiptPreviewItem } from "../../utils/receiptPreviewHelpers"

export type LoadedReceipt = {
  meta: ReceiptPreviewItem
  fileName: string
  dataUrl?: string
  failed?: boolean
}

/**
 * Loads stored receipt metadata (decrypts each via IPC) for read-only preview
 * and tracks which loaded receipt is currently opened in the lightbox.
 */
export function useReceiptPreview(receipts: ReceiptPreviewItem[]) {
  const [loaded, setLoaded] = useState<LoadedReceipt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const loadReceipts = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    setLoaded([])
    setSelectedIndex(null)
    try {
      const results = await Promise.all(
        receipts.map(async (item) => {
          try {
            const info: CashReceiptInfo = await readStoredReceipt(item, item.OriginalFileName)
            return {
              meta: item,
              fileName: info.fileName,
              dataUrl: info.previewDataUrl,
            }
          } catch {
            return { meta: item, fileName: item.OriginalFileName ?? item.ReceiptPath, failed: true }
          }
        })
      )
      setLoaded(results)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }, [receipts])

  const openAt = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const closeSelection = useCallback(() => {
    setSelectedIndex(null)
  }, [])

  const selected = selectedIndex !== null ? loaded[selectedIndex] : null

  return {
    loaded,
    isLoading,
    loadError,
    selected,
    loadReceipts,
    openAt,
    closeSelection,
  }
}