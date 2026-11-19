import { useCallback, useEffect, useState } from "react"
import { goodsReceiptService } from "../services/goodsReceiptService"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import type { GoodsReceiptLineRecord, GoodsReceiptPayload } from "../models/goodsReceipt"

type UsePendingGoodsReceiptsOptions = {
  poId?: number | null
  supplierId?: number | null
  expectedFrom?: string | null
  expectedTo?: string | null
  overdueOnly?: boolean
}

const toMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback

export function usePendingGoodsReceipts({
  poId,
  supplierId,
  expectedFrom,
  expectedTo,
  overdueOnly,
}: UsePendingGoodsReceiptsOptions = {}) {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof goodsReceiptService.getPendingGoodsReceipts>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const { showToast } = useToast()

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true)
      const data = await goodsReceiptService.getPendingGoodsReceipts({
        POID: poId ?? null,
        SupplierID: supplierId ?? null,
        ExpectedFrom: expectedFrom || null,
        ExpectedTo: expectedTo || null,
        OverdueOnly: Boolean(overdueOnly),
      })
      setRows(data)
      setError(null)
    } catch (err) {
      setError(toMessage(err, "Failed to load pending goods receipts"))
    } finally {
      setLoading(false)
    }
  }, [poId, supplierId, expectedFrom, expectedTo, overdueOnly])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const postGoodsReceipt = useCallback(
    async (payload: GoodsReceiptPayload): Promise<GoodsReceiptLineRecord> => {
      setIsPosting(true)
      try {
        const receipt = await goodsReceiptService.postGoodsReceipt(payload)
        showToast({
          variant: "success",
          title: `GRN ${receipt.GRNNumber} posted`,
          message: `${receipt.AcceptedQty} accepted tyre${receipt.AcceptedQty === 1 ? "" : "s"} added to stock.`,
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

  return {
    rows,
    loading,
    error,
    isPosting,
    postGoodsReceipt,
    refresh: fetchPending,
  }
}