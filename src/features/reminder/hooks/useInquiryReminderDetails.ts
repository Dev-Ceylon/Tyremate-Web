import { useEffect, useState } from "react"
import { useParams, useNavigate } from "@/lib/router"
import { reminderService } from "../services/reminderService"
import type { ReminderWithInquiryDetails } from "../models/reminder"
import { useChequeReminderSalesOrder } from "./useChequeReminderSalesOrder"

export function useInquiryReminderDetails() {
  const { reminderId } = useParams<{ reminderId: string }>()
  const navigate = useNavigate()
  const { salesOrderId, fetchSalesOrderIdByChequeReminderId } = useChequeReminderSalesOrder()

  const [reminder, setReminder] = useState<ReminderWithInquiryDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!reminderId) return
      try {
        setLoading(true)
        const normalizedReminderId = Number(reminderId)
        const data = (await reminderService.getReminderDetails(normalizedReminderId)) as ReminderWithInquiryDetails
        setReminder(data)
        setError(null)
        // await fetchSalesOrderIdByChequeReminderId(normalizedReminderId)
      } catch (err: any) {
        setError(err.message || "Failed to load reminder details")
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [reminderId])

  const completeReminder = async () => {
    if (!reminderId) return

    setIsCompleting(true)
    setCompleteError(null)

    try {
      await reminderService.markReminderCompleted(Number(reminderId), true)
      navigate(0)
    } catch (err: any) {
      setCompleteError(err.message || "Failed to mark reminder as completed")
    } finally {
      setIsCompleting(false)
    }
  }

  return {
    reminder,
    salesOrderId,
    loading,
    error,
    isCompleting,
    completeError,
    completeReminder,
    fetchSalesOrderIdByChequeReminderId,
  }
}
