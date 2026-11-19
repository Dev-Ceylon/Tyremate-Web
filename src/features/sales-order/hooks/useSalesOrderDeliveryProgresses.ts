import { useEffect, useState } from "react"
import type { SoDeliveryProgress } from "../models/delivery"
import { salesOrderService } from "../services/salesOrderService"

export type SalesOrderListItem = { SoID: number }

export function useSalesOrderDeliveryProgresses(orders: SalesOrderListItem[]) {
  const [deliveryMap, setDeliveryMap] = useState<Record<number, SoDeliveryProgress | null>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isActive = true

    if (orders.length === 0) {
      if (isActive) setDeliveryMap({})
      return
    }

    const fetchAll = async () => {
      setLoading(true)
      try {
        const results = await Promise.all(
          orders.map(async (order) => {
            try {
              const progress = await salesOrderService.getDeliveryProgress(order.SoID)
              return [order.SoID, progress] as [number, SoDeliveryProgress]
            } catch {
              return [order.SoID, null] as [number, SoDeliveryProgress | null]
            }
          })
        )
        if (!isActive) return
        const map: Record<number, SoDeliveryProgress | null> = {}
        for (const [id, progress] of results) map[id] = progress
        setDeliveryMap(map)
      } finally {
        if (isActive) setLoading(false)
      }
    }

    void fetchAll()
    return () => {
      isActive = false
    }
  }, [orders])

  return { deliveryMap, loading }
}
