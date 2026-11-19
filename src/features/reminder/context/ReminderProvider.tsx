import React, {
  createContext,
  useEffect,
  useState,
} from "react"
import { reminderService } from "../services/reminderService"
import { useAuthContext } from "../../auth/hooks/AuthProvider"

// 1. Define the Context Value Interface
export interface ReminderContextType {
  pendingCount: number
  loading: boolean
  refreshPendingCount: () => Promise<void>
  increasePendingCount: () => void
  decreasePendingCount: () => void
}

// 2. Create the Context with a default (initial) value
// The default value is useful for consumers that might try to access the context
// before the provider is mounted, or for testing.
export const ReminderContext = createContext<ReminderContextType | undefined>(
  undefined,
)

// 3. Implement the Provider Component
interface ReminderProviderProps {
  children: React.ReactNode
}

export const ReminderProvider: React.FC<ReminderProviderProps> = ({
  children,
}) => {
  const { user } = useAuthContext()
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [, setError] = useState<string | null>(null) // State to handle errors gracefully

  // Function to fetch and update the pending reminder count
  const refreshPendingCount = async () => {
    setLoading(true)
    setError(null)
    try {
      const reminders = await reminderService.getPendingReminders()
      setPendingCount(reminders.length)
    } catch (err) {
      console.error("Failed to fetch pending reminders:", err)
      setError("Failed to load pending reminders.")
      setPendingCount(0) // Optionally reset count on error or keep previous
    } finally {
      setLoading(false)
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  // Function to increase the pending count
  const increasePendingCount = () => {
    setPendingCount((prevCount) => prevCount + 1)
  }

  // Function to decrease the pending count, ensuring it doesn't go below 0
  const decreasePendingCount = () => {
    setPendingCount((prevCount) => Math.max(0, prevCount - 1))
  }

  // Fetch initial pending reminders on component mount
  useEffect(() => {
    if (!user) {
      setPendingCount(0)
      setLoading(false)
      return
    }

    refreshPendingCount()

    const cleanup =
      initializeReminderEvents()

    return cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const initializeReminderEvents = () => {
    return reminderService.onReminderChanged(
      handleReminderChanged
    )
  }

  const handleReminderChanged = () => {
    refreshPendingCount()
  }

  // The value that will be supplied to any consumers of this context
  const contextValue: ReminderContextType = {
    pendingCount,
    loading,
    refreshPendingCount,
    increasePendingCount,
    decreasePendingCount,
  }

  // Optionally, you could render an error message here if 'error' is set,
  // or simply let consumers handle the `loading` and `error` states.
  // For now, we'll just provide the values.
  return (
    <ReminderContext.Provider value={contextValue}>
      {children}
    </ReminderContext.Provider>
  ) // eslint-disable-next-line react-hooks/exhaustive-deps
}