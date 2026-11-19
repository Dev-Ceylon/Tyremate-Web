import { useCallback, useEffect, useState } from "react"
import type {
  RecordSoDeliveryPayload,
  SoDeliveryProgress,
  SoDeliveryRecord,
} from "../models/delivery"
import { salesOrderService } from "../services/salesOrderService"

/**
 * Loads the collection picture for a sales order: what has already been handed
 * over and what is still to collect, and lets the remaining tyres be recorded
 * as collected later.
 */
export function useSalesOrderDeliveries(soId: number | null) {
  const [progress, setProgress] = useState<SoDeliveryProgress | null>(null)
  const [deliveries, setDeliveries] = useState<SoDeliveryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!soId) return

    setLoading(true)
    try {
      const [nextProgress, nextDeliveries] = await Promise.all([
        salesOrderService.getDeliveryProgress(soId),
        salesOrderService.getDeliveries(soId),
      ])
      setProgress(nextProgress)
      setDeliveries(nextDeliveries)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deliveries")
    } finally {
      setLoading(false)
    }
  }, [soId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const recordDelivery = useCallback(
    async (payload: RecordSoDeliveryPayload): Promise<SoDeliveryRecord> => {
      if (!soId) {
        throw new Error("Sales order is not loaded")
      }

      const created = await salesOrderService.recordDelivery(soId, payload)
      await refresh()
      return created
    },
    [soId, refresh],
  )

  return { progress, deliveries, loading, error, refresh, recordDelivery }
}
