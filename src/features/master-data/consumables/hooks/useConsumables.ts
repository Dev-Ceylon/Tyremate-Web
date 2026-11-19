import { useCallback, useEffect, useState } from "react"
import type { ConsumableRecord } from "../../../../shared/models/consumables/consumable"
import { consumableService } from "../services/consumableService"

type UseConsumablesOptions = {
  onDeleteSuccess?: (consumable: ConsumableRecord) => void
  onDeleteError?: (message: string, consumable: ConsumableRecord) => void
}

export function useConsumables(options?: UseConsumablesOptions) {
  const [consumables, setConsumables] = useState<ConsumableRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await consumableService.getConsumables()
      setConsumables(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load consumables"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const remove = useCallback(async (consumable: ConsumableRecord) => {
    setDeletingId(consumable.Id)

    try {
      await consumableService.deleteConsumable(consumable.Id)
      setConsumables((current) =>
        current.filter((item) => item.Id !== consumable.Id),
      )
      options?.onDeleteSuccess?.(consumable)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete consumable"
      options?.onDeleteError?.(message, consumable)
      throw err
    } finally {
      setDeletingId(null)
    }
  }, [options])

  return { consumables, loading, error, deletingId, refresh, remove }
}
