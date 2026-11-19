import { useCallback, useEffect, useState } from "react"
import type { SoTyreStorageAllocationRecord, ReturnAllocationItem } from "../models/salesOrder"
import { salesOrderService } from "../services/salesOrderService"

interface UseTyreReturnAllocationsOptions {
  tyreId: number | null
  isOpen: boolean
  maxReturnQty: number
}

interface UseTyreReturnAllocationsReturn {
  allocations: SoTyreStorageAllocationRecord[]
  returnItems: ReturnAllocationItem[]
  loading: boolean
  error: string | null
  reason: string
  setReason: (reason: string) => void
  updateReturnQty: (index: number, value: number) => void
  validateAndGetItems: () => ReturnAllocationItem[] | null
  reset: () => void
}

export function useTyreReturnAllocations({
  tyreId,
  isOpen,
  maxReturnQty,
}: UseTyreReturnAllocationsOptions): UseTyreReturnAllocationsReturn {
  const [allocations, setAllocations] = useState<SoTyreStorageAllocationRecord[]>([])
  const [returnItems, setReturnItems] = useState<ReturnAllocationItem[]>([])
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = useCallback(() => {
    setAllocations([])
    setReturnItems([])
    setReason("")
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen && tyreId) {
      setLoading(true)
      setReturnItems([])
      setReason("")
      setError(null)
      salesOrderService.getAllocationsBySoTyreId(tyreId)
        .then((data: SoTyreStorageAllocationRecord[]) => {
          setAllocations(data)
          setReturnItems(data.map((a) => ({
            allocationId: a.AllocationID ?? a.Id,
            storageManagerId: a.StorageManagerID,
            storageManagerBatchId: a.StorageManagerBatchID,
            dot: a.DOT ?? null,
            locationName: a.LocationName ?? null,
            allocatedQty: a.Qty,
            alreadyReturned: a.ReturnedQty ?? 0,
            returnQty: 0,
          })))
        })
        .catch((err) => {
          setError("Failed to load allocations: " + (err instanceof Error ? err.message : String(err)))
        })
        .finally(() => setLoading(false))
    } else if (!isOpen) {
      reset()
    }
  }, [isOpen, tyreId, reset])

  const updateReturnQty = useCallback((index: number, value: number) => {
    const maxForThis = returnItems[index].allocatedQty - returnItems[index].alreadyReturned
    const clamped = Math.max(0, Math.min(maxForThis, Math.floor(value) || 0))
    setReturnItems((prev) => prev.map((item, i) => (i === index ? { ...item, returnQty: clamped } : item)))
  }, [returnItems])

  const validateAndGetItems = useCallback((): ReturnAllocationItem[] | null => {
    const itemsToReturn = returnItems.filter((item) => item.returnQty > 0)
    if (itemsToReturn.length === 0) {
      setError("Please enter a quantity for at least one allocation.")
      return null
    }
    const total = itemsToReturn.reduce((sum, item) => sum + item.returnQty, 0)
    if (total > maxReturnQty) {
      setError(`Total return quantity cannot exceed ${maxReturnQty}.`)
      return null
    }
    setError(null)
    return itemsToReturn
  }, [returnItems, maxReturnQty])

  return {
    allocations,
    returnItems,
    loading,
    error,
    reason,
    setReason,
    updateReturnQty,
    validateAndGetItems,
    reset,
  }
}