import { useCallback, useEffect, useState } from "react"
import type { ConsumableLocationRecord } from "../../../../shared/models/consumables/consumableLocation"
import { consumableLocationService } from "../services/consumableLocationService"

type UseConsumableLocationsOptions = {
  onDeleteSuccess?: (location: ConsumableLocationRecord) => void
  onDeleteError?: (message: string, location: ConsumableLocationRecord) => void
}

export function useConsumableLocations(options?: UseConsumableLocationsOptions) {
  const [locations, setLocations] = useState<ConsumableLocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await consumableLocationService.getConsumableLocations()
      setLocations(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load consumable locations"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const remove = useCallback(async (location: ConsumableLocationRecord) => {
    setDeletingId(location.Id)

    try {
      await consumableLocationService.deleteConsumableLocation(location.Id)
      setLocations((current) =>
        current.filter((item) => item.Id !== location.Id),
      )
      options?.onDeleteSuccess?.(location)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete consumable location"
      options?.onDeleteError?.(message, location)
      throw err
    } finally {
      setDeletingId(null)
    }
  }, [options])

  return {
    locations,
    loading,
    error,
    deletingId,
    refresh,
    remove,
  }
}
