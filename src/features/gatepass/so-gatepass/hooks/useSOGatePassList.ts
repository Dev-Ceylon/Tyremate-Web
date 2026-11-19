import { useCallback, useEffect, useState } from "react"
import type { SOGatePassRecord } from "../../../sales-order/models/delivery"
import { salesOrderService } from "../../../sales-order/services/salesOrderService"

export function useSOGatePassList() {
  const [gatePasses, setGatePasses] = useState<SOGatePassRecord[]>([])
  const [pendingGatePasses, setPendingGatePasses] = useState<SOGatePassRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [issued, pending] = await Promise.all([
        salesOrderService.getSOGatePasses(),
        salesOrderService.getPendingSOGatePasses(),
      ])
      setGatePasses(issued)
      setPendingGatePasses(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SO gate passes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { gatePasses, pendingGatePasses, loading, error, refresh }
}
