import { useState, useEffect, useCallback } from "react"
import { purchaseOrderService } from "../services/purchaseOrderService"
import type { PoDetailedRecord } from "../models/purchaseOrder"

type UsePurchaseOrderListOptions = {
  onDeleteSuccess?: (po: PoDetailedRecord) => void
  onDeleteError?: (message: string, po: PoDetailedRecord) => void
}

export function usePurchaseOrderList(options?: UsePurchaseOrderListOptions) {
  const [purchaseOrders, setPurchaseOrders] = useState<PoDetailedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await purchaseOrderService.getPurchaseOrders()
      setPurchaseOrders(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load purchase orders")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  const handleDelete = async (id: number) => {
    const po = purchaseOrders.find((item) => item.ID === id)
    if (!po) return

    setDeletingId(id)

    try {
      await purchaseOrderService.deletePurchaseOrder(id)
      setPurchaseOrders((prev) => prev.filter((item) => item.ID !== id))
      options?.onDeleteSuccess?.(po)
    } catch (err: any) {
      const message = err.message || "Failed to delete purchase order"
      options?.onDeleteError?.(message, po)
      throw err
    } finally {
      setDeletingId(null)
    }
  }

  return {
    purchaseOrders,
    loading,
    error,
    deletingId,
    handleDelete,
    refresh: fetchPurchaseOrders,
  }
}