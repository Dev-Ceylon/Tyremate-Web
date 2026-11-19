import { useCallback, useEffect, useState } from "react"
import { goodsReceiptService } from "../services/goodsReceiptService"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import type { DagGoodsReceiptPayload, DagGoodsReceiptResult, PendingDagGoodsReceiptRecord } from "../models/goodsReceipt"

const toMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback)

/**
 * Loads and posts goods receipts for DAG stock waiting in quarantine.
 */
export function usePendingDagGoodsReceipts() {
  const [rows, setRows] = useState<PendingDagGoodsReceiptRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const { showToast } = useToast()

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true)
      const data = await goodsReceiptService.getPendingDagGoodsReceipts()
      setRows(data)
      setError(null)
    } catch (err) {
      setError(toMessage(err, "Failed to load pending DAG goods receipts"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const postDagReceipt = useCallback(
    async (payload: DagGoodsReceiptPayload): Promise<DagGoodsReceiptResult> => {
      setIsPosting(true)
      try {
        const receipt = await goodsReceiptService.postDagGoodsReceipt(payload)
        showToast({
          variant: "success",
          title: `GRN ${receipt.GRNNumber} posted`,
          message: `${receipt.AcceptedQty} accepted tyre${receipt.AcceptedQty === 1 ? "" : "s"} moved out of quarantine.`,
        })
        await fetchPending()
        return receipt
      } catch (err) {
        showToast({
          variant: "error",
          title: "GRN posting failed",
          message: toMessage(err, "An error occurred while posting the goods receipt."),
        })
        throw err
      } finally {
        setIsPosting(false)
      }
    },
    [fetchPending, showToast]
  )

  return { rows, loading, error, isPosting, postDagReceipt, refresh: fetchPending }
}
