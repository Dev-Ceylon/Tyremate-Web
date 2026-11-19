import { useEffect, useState } from "react"
import { purchaseOrderService } from "../../purchase-order/services/purchaseOrderService"

export function usePendingPurchaseOrders() {
  const [count, setCount] = useState(0)

  const loadPendingPurchaseOrders = () => {
    purchaseOrderService.getPendingPOCount().then(({ Count }) => setCount(Count))
  }

  useEffect(() => {
    loadPendingPurchaseOrders()
  }, [])

  return { count }
}
