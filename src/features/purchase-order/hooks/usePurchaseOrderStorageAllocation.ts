import { useState, useEffect, useCallback } from "react"
import { useParams } from "@/lib/router"
import { purchaseOrderService } from "../services/purchaseOrderService"
import type { PoDetailedRecord, PoTyreAllocationPayload } from "../models/purchaseOrder"
import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"

export interface UsePurchaseOrderStorageAllocationOptions {
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function usePurchaseOrderStorageAllocation(options?: UsePurchaseOrderStorageAllocationOptions) {
  const { poId } = useParams<{ poId: string }>()
  const [order, setOrder] = useState<PoDetailedRecord | null>(null)
  const [locations, setLocations] = useState<StorageLocationRecord[]>([])
  const [localAllocations, setLocalAllocations] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize local allocation state when order data is loaded
  useEffect(() => {
    if (order?.Tyres) {
      const initialMap: Record<number, number> = {}
      order.Tyres.forEach((tyre) => {
        if (tyre.LocationId) {
          initialMap[tyre.ID] = tyre.LocationId
        }
      })
      setLocalAllocations(initialMap)
    }
  }, [order])

  const fetchData = useCallback(async () => {
    if (!poId) return

    setLoading(true)
    setError(null)
    try {
      const numericPoId = Number(poId)
      const [orderData, locationData] = await Promise.all([
        purchaseOrderService.getPurchaseOrderById(numericPoId),
        purchaseOrderService.getStorageLocationsByLocationType(1), // Hardcoded to 1 as requested
      ])
      setOrder(orderData)
      setLocations(locationData)
    } catch (err: any) {
      setError(err.message || "Failed to load allocation data")
    } finally {
      setLoading(false)
    }
  }, [poId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const getReservedByLocation = useCallback((tyreQtyByTyreId: Record<number, number>) => {
    const reserved: Record<number, number> = {}

    Object.entries(localAllocations).forEach(([poTyreIdStr, locationId]) => {
      if (!locationId) return
      const qty = tyreQtyByTyreId[Number(poTyreIdStr)] ?? 0
      reserved[locationId] = (reserved[locationId] ?? 0) + qty
    })

    return reserved
  }, [localAllocations])

  const updateAllocation = useCallback((poTyreId: number, locationId: number) => {
    setLocalAllocations((prev) => ({
      ...prev,
      [poTyreId]: locationId,
    }))
  }, [])

  const submitAllocations = useCallback(
    async () => {
      if (!order) return false

      const tyreQtyByTyreId: Record<number, number> = {}
      ;(order.Tyres || []).forEach((tyre) => {
        tyreQtyByTyreId[tyre.ID] = tyre.Qty
      })

      const reserved = getReservedByLocation(tyreQtyByTyreId)

      const overCapacity = Object.entries(reserved).find(([locationId, allocatedQty]) => {
        const location = locations.find((loc) => loc.Id === Number(locationId))
        return location ? allocatedQty > (location.RemainingCapacity ?? 0) : false
      })

      if (overCapacity) {
        const locationId = Number(overCapacity[0])
        const location = locations.find((loc) => loc.Id === locationId)
        const msg = `Location "${location?.LocationName ?? locationId}" exceeds its remaining capacity (${overCapacity[1]} allocated)`
        setError(msg)
        options?.onError?.(msg)
        return { success: false, error: msg }
      }

      setSubmitting(true)
      setError(null)
      try {
        const payloads: PoTyreAllocationPayload[] = Object.entries(localAllocations)
          .filter(([, locationId]) => locationId)
          .map(([poTyreId, locationId]) => ({
            POID: order.ID,
            PoTyresID: Number(poTyreId),
            LocationId: locationId,
          }))

        await purchaseOrderService.allocateLocations(payloads)
        options?.onSuccess?.()
        return { success: true }
      } catch (err: any) {
        const msg = err.message || "Failed to save allocations"
        setError(msg)
        options?.onError?.(msg)
        return { success: false, error: msg }
      } finally {
        setSubmitting(false)
      }
    },
    [order, locations, localAllocations, getReservedByLocation, options]
  )

  return {
    order,
    locations,
    localAllocations,
    loading,
    submitting,
    error,
    actions: {
      refresh: fetchData,
      updateAllocation,
      submitAllocations,
    },
  }
}