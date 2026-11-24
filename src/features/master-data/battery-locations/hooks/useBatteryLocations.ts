import { useCallback, useEffect, useState } from "react"
import type { BatteryLocationRecord } from "../models/batteryLocation"
import { batteryLocationService } from "../services/batteryLocationService"

type UseBatteryLocationsOptions = {
  onDeleteSuccess?: (location: BatteryLocationRecord) => void
  onDeleteError?: (message: string, location: BatteryLocationRecord) => void
}

export function useBatteryLocations(options?: UseBatteryLocationsOptions) {
  const [locations, setLocations] = useState<BatteryLocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await batteryLocationService.getBatteryLocations()
      setLocations(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load battery locations"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const remove = useCallback(
    async (location: BatteryLocationRecord) => {
      setDeletingId(location.Id)

      try {
        await batteryLocationService.deleteBatteryLocation(location.Id)
        setLocations((current) => current.filter((item) => item.Id !== location.Id))
        options?.onDeleteSuccess?.(location)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete battery location"
        options?.onDeleteError?.(message, location)
        throw err
      } finally {
        setDeletingId(null)
      }
    },
    [options]
  )

  return {
    locations,
    loading,
    error,
    deletingId,
    refresh,
    remove,
  }
}
