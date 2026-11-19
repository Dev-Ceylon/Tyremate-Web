import { useState, useEffect, useCallback, useMemo } from "react"
import type { StockSnapshotRecord } from "../models/stockSnapshot"
import { stockSnapshotService } from "../services/stockSnapshotService"

export function useStockSnapshots(searchQuery?: string) {
  const [stockSnapshots, setStockSnapshots] = useState<StockSnapshotRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStockSnapshots = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await stockSnapshotService.getStockSnapshots()
      setStockSnapshots(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load stock snapshots"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStockSnapshots()
  }, [loadStockSnapshots])

  // Filter stock snapshots based on search query
  const filteredStockSnapshots = useMemo(() => {
    if (!searchQuery?.trim()) return stockSnapshots

    const query = searchQuery.toLowerCase()
    return stockSnapshots.filter((snapshot) => {
      return (
        snapshot.Size?.toLowerCase().includes(query) ||
        snapshot.Pattern?.toLowerCase().includes(query) ||
        snapshot.LL_SR?.toLowerCase().includes(query) ||
        snapshot.PR?.toLowerCase().includes(query) ||
        snapshot.SideWall?.toLowerCase().includes(query) ||
        snapshot.SupplierCodes?.toLowerCase().includes(query) ||
        snapshot.SupplierNames?.toLowerCase().includes(query) ||
        snapshot.TyreID.toString().includes(query)
      )
    })
  }, [stockSnapshots, searchQuery])

  return {
    stockSnapshots,
    filteredStockSnapshots,
    loading,
    error,
    refresh: loadStockSnapshots
  }
}
