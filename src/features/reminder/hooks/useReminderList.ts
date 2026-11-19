import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "@/lib/router"
import { REMINDER_TYPE_CODES } from "../../../shared/constants/reminderTypeConstants"
import type {
  ReminderRecord,
  ReminderWithTyreExpiryDetails,
} from "../models/reminder"
import { reminderService } from "../services/reminderService"
import { useChequeReminderSalesOrder } from "./useChequeReminderSalesOrder"

export function useReminderList() {
  const navigate = useNavigate()
  const {
    viewingReminderId,
    fetchSalesOrderIdByChequeReminderId,
    openSalesOrderByChequeReminderId,
  } = useChequeReminderSalesOrder()
  const [reminders, setReminders] = useState<ReminderRecord[]>([])
  const [activeType, setActiveType] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [tyreExpiryReminder, setTyreExpiryReminder] = useState<ReminderRecord | null>(null)
  const [tyreExpiryDetails, setTyreExpiryDetails] = useState<ReminderWithTyreExpiryDetails | null>(null)
  const [tyreExpiryModalOpen, setTyreExpiryModalOpen] = useState(false)
  const [tyreExpiryLoading, setTyreExpiryLoading] = useState(false)

  const filteredReminders = useMemo(
    () => (activeType === "all" ? reminders : reminders.filter((r) => r.ReminderTypeCode === activeType)),
    [reminders, activeType],
  )

  const fetchReminders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await reminderService.getPendingReminders()
      setReminders(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reminders")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchReminders()
  }, [fetchReminders])

  const closeTyreExpiryModal = useCallback(() => {
    setTyreExpiryModalOpen(false)
    setTyreExpiryReminder(null)
    setTyreExpiryDetails(null)
  }, [])

  const openTyreExpiryModal = useCallback(async (reminder: ReminderRecord) => {
    setTyreExpiryLoading(true)
    setTyreExpiryReminder(reminder)
    setTyreExpiryModalOpen(true)

    try {
      const details = await reminderService.getTyreExpiryReminderDetails(reminder.ID)
      setTyreExpiryDetails(details)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load tyre expiry details")
    } finally {
      setTyreExpiryLoading(false)
    }
  }, [])

  const gotoStock = useCallback(() => {
    const locationId = tyreExpiryDetails?.tyreExpiryDetails?.LocationID
    const branchId = tyreExpiryDetails?.tyreExpiryDetails?.BranchId

    closeTyreExpiryModal()

    if (locationId && branchId) {
      navigate(`/storage-manager/tyres/locations/${locationId}/branches/${branchId}`)
      return
    }

    navigate("/storage-manager/tyres")
  }, [closeTyreExpiryModal, navigate, tyreExpiryDetails])

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this reminder?")) return

    setDeletingId(id)
    try {
      await reminderService.deleteReminder(id)
      setReminders((prev) => prev.filter((r) => r.ID !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete reminder")
    } finally {
      setDeletingId(null)
    }
  }, [])

  const handleViewReminder = useCallback(async (reminder: ReminderRecord) => {
    const isInquiry = reminder.ReminderTypeCode === REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP
    const isCheque = reminder.ReminderTypeCode === REMINDER_TYPE_CODES.CHEQUE_FOLLOW_UP
    const isSoFollowUp = reminder.ReminderTypeCode === REMINDER_TYPE_CODES.SO_FOLLOW_UP
    const isTyreExpiry = reminder.ReminderTypeCode === REMINDER_TYPE_CODES.TYRE_EXPIRY

    if (isTyreExpiry) {
      await openTyreExpiryModal(reminder)
      return
    }

    if (isInquiry) {
      navigate(`/reminders/${reminder.ID}`)
      return
    }

    if (isCheque) {
      try {
        await openSalesOrderByChequeReminderId(reminder.ID)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to open linked sales order")
      }
      return
    }

    if (isSoFollowUp) {
      try {
        const soId = await reminderService.getSoIdBySOReminderId(reminder.ID)
        if (soId) {
          navigate(`/sales-orders/${soId}`)
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to open linked sales order")
      }
      return
    }

    navigate(`/reminders/${reminder.ID}`)
  }, [navigate, openSalesOrderByChequeReminderId, openTyreExpiryModal])

  return {
    reminders,
    filteredReminders,
    activeType,
    setActiveType,
    loading,
    error,
    deletingId,
    viewingId: viewingReminderId,
    refresh: fetchReminders,
    handleDelete,
    handleViewReminder,
    fetchSalesOrderIdByChequeReminderId,
    tyreExpiryReminder,
    tyreExpiryDetails,
    tyreExpiryModalOpen,
    tyreExpiryLoading,
    closeTyreExpiryModal,
    gotoStock,
  }
}
