import { useCallback, useEffect, useState } from "react"
import type { DevTempLockStatus } from "../models/devTempLock"

export function useDevTempLockStatus() {
  const [status, setStatus] = useState<DevTempLockStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const nextStatus = await window.api.devTempLock.getStatus()
      setStatus(nextStatus)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify application access")
    }
  }, [])

  useEffect(() => {
    void refresh()
    const intervalId = window.setInterval(() => void refresh(), 15_000)
    return () => window.clearInterval(intervalId)
  }, [refresh])

  return { status, error, refresh }
}
