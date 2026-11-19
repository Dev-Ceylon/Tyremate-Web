import { useCallback, useEffect, useState } from "react"
import type { StorageLocationRecord } from "../models/storageLocation"
import { storageLocationService } from "../services/storageLocationService"

type UseStorageLocationsOptions = {
  onDeleteSuccess?: (storageLocation: StorageLocationRecord) => void
  onDeleteError?: (message: string, storageLocation: StorageLocationRecord) => void
}

export function useStorageLocations(options?: UseStorageLocationsOptions) {
  const [storageLocations, setStorageLocations] = useState<StorageLocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingStorageLocationId, setDeletingStorageLocationId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await storageLocationService.getStorageLocations()
      setStorageLocations(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load storage locations"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeStorageLocation = useCallback(async (storageLocation: StorageLocationRecord) => {
    setDeletingStorageLocationId(storageLocation.Id)

    try {
      await storageLocationService.deleteStorageLocation(storageLocation.Id)
      setStorageLocations((current) =>
        current.filter((currentStorageLocation) => currentStorageLocation.Id !== storageLocation.Id)
      )
      options?.onDeleteSuccess?.(storageLocation)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete storage location"
      options?.onDeleteError?.(message, storageLocation)
      throw err
    } finally {
      setDeletingStorageLocationId(null)
    }
  }, [options])

  return {
    storageLocations,
    loading,
    error,
    deletingStorageLocationId,
    refresh,
    removeStorageLocation,
  }
}
