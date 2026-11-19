import { useEffect, useState } from "react"
import { purchaseOrderService } from "../../purchase-order/services/purchaseOrderService"

export function usePendingPurchaseOrders() {
  const [count, setCount] = useState(0)

  const loadPendingPurchaseOrders = () => {
    purchaseOrderService
      .getPendingPOCount()
      .then(({ Count }) => setCount(Count))
      // Roles without po.view keep the default; the backend already logged it.
      .catch(() => {})
  }

  useEffect(() => {
    loadPendingPurchaseOrders()
  }, [])

  return { count }
}
