import { useCallback, useEffect, useState } from "react"
import type { SoDetailedRecord } from "../models/salesOrder"
import { salesOrderService } from "../services/salesOrderService"

export function useSalesOrderList() {
  const [salesOrders, setSalesOrders] = useState<SoDetailedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchSOs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await salesOrderService.getSOs()
      setSalesOrders(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sales orders")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSOs()
  }, [fetchSOs])

  const handleDelete = useCallback(async (soId: number) => {
    if (!window.confirm("Are you sure you want to delete this sales order?")) return

    setDeletingId(soId)
    try {
      await salesOrderService.deleteSalesOrder(soId)
      setSalesOrders((prev) => prev.filter((so) => so.SoID !== soId))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete sales order")
    } finally {
      setDeletingId(null)
    }
  }, [])

  return {
    salesOrders,
    loading,
    error,
    deletingId,
    refresh: fetchSOs,
    handleDelete,
  }
}