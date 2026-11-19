import { useEffect, useMemo, useState } from "react"
import { salesOrderService } from "../../sales-order/services/salesOrderService"
import type { SalesTrendPoint } from "../../../shared/models/salesTrend"

const toLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function useSalesTrend() {
  const [points, setPoints] = useState<SalesTrendPoint[]>([])
  const [range, setRange] = useState<7 | 30>(30)

  useEffect(() => {
    const today = new Date()
    const toDate = toLocalDate(today)
    const fromDate = new Date(today)
    fromDate.setDate(fromDate.getDate() - 29)
    salesOrderService.getSalesTrendSummary(toLocalDate(fromDate), toDate).then(setPoints)
  }, [])

  const visiblePoints = useMemo(() => {
    if (range === 7) {
      return points.slice(-7)
    }
    return points
  }, [points, range])

  return { points: visiblePoints, range, setRange }
}
