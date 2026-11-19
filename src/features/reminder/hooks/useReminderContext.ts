import { useContext } from "react"
import { ReminderContext, type ReminderContextType } from "../context/ReminderProvider"

/**
 * Custom hook to easily consume the ReminderContext.
 * This hook handles the case where the context is used outside a Provider.
 */
export const useReminderContext = (): ReminderContextType => {
  const context = useContext(ReminderContext)
  if (context === undefined) {
    throw new Error("useReminderContext must be used within a ReminderProvider")
  }
  return context
}