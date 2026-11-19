import { useCallback, useEffect, useState } from "react"
import type { StorageLocationTypeRecord } from "../models/storageLocationType"
import { storageLocationTypeService } from "../services/storageLocationTypeService"

type UseStorageLocationTypesOptions = {
  onDeleteSuccess?: (storageLocationType: StorageLocationTypeRecord) => void
  onDeleteError?: (message: string, storageLocationType: StorageLocationTypeRecord) => void
}

export function useStorageLocationTypes(options?: UseStorageLocationTypesOptions) {
  const [storageLocationTypes, setStorageLocationTypes] = useState<StorageLocationTypeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await storageLocationTypeService.getStorageLocationTypes()
      setStorageLocationTypes(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load storage location types"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeStorageLocationType = useCallback(async (storageLocationType: StorageLocationTypeRecord) => {
    setDeletingId(storageLocationType.Id)

    try {
      await storageLocationTypeService.deleteStorageLocationType(storageLocationType.Id)
      setStorageLocationTypes((current) =>
        current.filter((item) => item.Id !== storageLocationType.Id)
      )
      options?.onDeleteSuccess?.(storageLocationType)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete storage location type"
      options?.onDeleteError?.(message, storageLocationType)
      throw err
    } finally {
      setDeletingId(null)
    }
  }, [options])

  return {
    storageLocationTypes,
    loading,
    error,
    deletingId,
    refresh,
    removeStorageLocationType,
  }
}