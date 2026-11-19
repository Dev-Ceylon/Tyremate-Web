import { useCallback, useState } from "react"
import { useNavigate } from "@/lib/router"
import { reminderService } from "../services/reminderService"

export function useChequeReminderSalesOrder() {
  const navigate = useNavigate()
  const [salesOrderId, setSalesOrderId] = useState<number | null>(null)
  const [viewingReminderId, setViewingReminderId] = useState<number | null>(null)

  const fetchSalesOrderIdByChequeReminderId = useCallback(async (chequeReminderId: number) => {
    try {
      const soId = await reminderService.getSoIdByChequeReminderId(chequeReminderId)
      setSalesOrderId(soId)
      return soId
    } catch {
      setSalesOrderId(null)
      return null
    }
  }, [])

  const openSalesOrderByChequeReminderId = useCallback(async (chequeReminderId: number) => {
    setViewingReminderId(chequeReminderId)
    try {
      const soId = await fetchSalesOrderIdByChequeReminderId(chequeReminderId)
      if (!soId) {
        throw new Error("Sales Order not found for the given cheque reminder")
      }

      navigate(`/sales-orders/${soId}`)
      return soId
    } finally {
      setViewingReminderId(null)
    }
  }, [fetchSalesOrderIdByChequeReminderId, navigate])

  return {
    salesOrderId,
    viewingReminderId,
    fetchSalesOrderIdByChequeReminderId,
    openSalesOrderByChequeReminderId,
  }
}
