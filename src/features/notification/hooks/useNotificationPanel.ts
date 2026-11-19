import { useEffect, useRef, useState } from "react"
import { useNavigate } from "@/lib/router"
import type { NotificationRecord } from "../models/notification"
import { notificationService } from "../services/notificationService"

export function useNotificationPanel() {
  const navigate = useNavigate()
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [isNotificationLoading, setIsNotificationLoading] = useState(false)
  const skipNextCrudRefresh = useRef(false)

  const loadNotifications = async () => {
    setIsNotificationLoading(true)

    try {
      const records = await notificationService.getNotifications()
      setNotifications(records)
    } finally {
      setIsNotificationLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()

    const unsubscribeCrud =
      notificationService.onNotificationChanged(() => {
        if (skipNextCrudRefresh.current) {
          skipNextCrudRefresh.current = false
          return
        }
        void loadNotifications()
      })

    

    return () => {
      unsubscribeCrud?.()
    }
  }, [])

  const openNotifications = async () => {
    setIsNotificationModalOpen(true)
    await loadNotifications()
  }

  const closeNotifications = () => {
    setIsNotificationModalOpen(false)
  }

  const handleNotificationSelect = async (notification: NotificationRecord) => {
    if (notification.navigationPath) {
      skipNextCrudRefresh.current = true
      await notificationService.deleteNotification(notification.id)
      setNotifications((currentNotifications) =>
        currentNotifications.filter(
          (currentNotification) => currentNotification.id !== notification.id
        )
      )
    }

    setIsNotificationModalOpen(false)

    if (notification.navigationPath) {
      navigate(notification.navigationPath)
    }
  }

  return {
    closeNotifications,
    handleNotificationSelect,
    isNotificationLoading,
    isNotificationModalOpen,
    notifications,
    openNotifications,
  }
}
