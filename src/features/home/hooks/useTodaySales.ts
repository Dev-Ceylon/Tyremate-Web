import { useEffect, useState } from "react"
import { salesOrderService } from "../../sales-order/services/salesOrderService"
import type { SoTodaySalesSummary } from "../../sales-order/models/salesOrder"

const toLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function useTodaySales() {
  const [summary, setSummary] = useState<SoTodaySalesSummary>({ OrderCount: 0, TotalSale: 0 })

  const loadTodaySales = () => {
    salesOrderService
      .getTodaySalesSummary(toLocalDate(new Date()))
      .then(setSummary)
      .catch(() => {})
  }

  useEffect(() => {
    loadTodaySales()
  }, [])

  return { summary }
}
