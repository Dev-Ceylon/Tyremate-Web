import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "@/lib/router"
import { REMINDER_TYPE_CODES } from "../../../shared/constants/reminderTypeConstants"
import type {
  ReminderRecord,
  ReminderWithBatteryDetails,
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
  const [batteryReminder, setBatteryReminder] = useState<ReminderRecord | null>(null)
  const [batteryDetails, setBatteryDetails] = useState<ReminderWithBatteryDetails | null>(null)
  const [batteryModalOpen, setBatteryModalOpen] = useState(false)
  const [batteryLoading, setBatteryLoading] = useState(false)
  const [batteryCompleting, setBatteryCompleting] = useState(false)

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

  const closeBatteryModal = useCallback(() => {
    setBatteryModalOpen(false)
    setBatteryReminder(null)
    setBatteryDetails(null)
  }, [])

  const openBatteryModal = useCallback(async (reminder: ReminderRecord) => {
    setBatteryLoading(true)
    setBatteryReminder(reminder)
    setBatteryModalOpen(true)

    try {
      const details = await reminderService.getBatteryReminderDetails(reminder.ID)
      setBatteryDetails(details)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load battery reminder details")
    } finally {
      setBatteryLoading(false)
    }
  }, [])

  const gotoBatteryStock = useCallback(() => {
    const locationId = batteryDetails?.batteryDetails?.LocationID
    const branchId = batteryDetails?.batteryDetails?.BranchId

    closeBatteryModal()

    if (locationId && branchId) {
      navigate(`/storage-manager/batteries/locations/${locationId}/branches/${branchId}`)
      return
    }

    navigate("/storage-manager/batteries")
  }, [batteryDetails, closeBatteryModal, navigate])

  const handleMarkBatteryCompleted = useCallback(async () => {
    if (!batteryReminder) return
    setBatteryCompleting(true)
    try {
      await reminderService.markReminderCompleted(batteryReminder.ID, true)
      setReminders((prev) => prev.filter((r) => r.ID !== batteryReminder.ID))
      closeBatteryModal()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark reminder completed")
    } finally {
      setBatteryCompleting(false)
    }
  }, [batteryReminder, closeBatteryModal])

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
    const isBatteryReminder =
      reminder.ReminderTypeCode === REMINDER_TYPE_CODES.BATTERY_EXPIRY ||
      reminder.ReminderTypeCode === REMINDER_TYPE_CODES.BATTERY_RECHARGE ||
      reminder.ReminderTypeCode === REMINDER_TYPE_CODES.BATTERY_WARRANTY

    if (isBatteryReminder) {
      await openBatteryModal(reminder)
      return
    }

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
  }, [
    navigate,
    openBatteryModal,
    openSalesOrderByChequeReminderId,
    openTyreExpiryModal,
  ])

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
    batteryReminder,
    batteryDetails,
    batteryModalOpen,
    batteryLoading,
    batteryCompleting,
    closeBatteryModal,
    gotoBatteryStock,
    handleMarkBatteryCompleted,
  }
}
