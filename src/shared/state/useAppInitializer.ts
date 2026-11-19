import { useEffect } from "react"
import { usePrinterStore } from "./printerStore"
import { useAuthContext } from "../../features/auth/hooks/AuthProvider"

export function useAppInitializer() {
  const initPrinter = usePrinterStore((s) => s.init)
  const { user } = useAuthContext()

  useEffect(() => {
    if (!user) return
    initPrinter().catch(console.error)
  }, [user, initPrinter])
}
