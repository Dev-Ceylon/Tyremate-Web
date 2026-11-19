import { useCallback, useEffect, useState } from "react"
import type { TyreRecord } from "../models/tyre"
import { tyreService } from "../services/tyreService"

type UseTyresOptions = {
  onDeleteSuccess?: (tyre: TyreRecord) => void
  onDeleteError?: (message: string, tyre: TyreRecord) => void
}

export function useTyres(options?: UseTyresOptions) {
  const [tyres, setTyres] = useState<TyreRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingTyreId, setDeletingTyreId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await tyreService.getTyres()
      setTyres(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load tyres"
      setError(message)
      console.log(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeTyre = useCallback(async (tyre: TyreRecord) => {
    setDeletingTyreId(tyre.Id)

    try {
      await tyreService.deleteTyre(tyre.Id)
      setTyres((current) =>
        current.filter((currentTyre) => currentTyre.Id !== tyre.Id)
      )
      options?.onDeleteSuccess?.(tyre)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete tyre"
      options?.onDeleteError?.(message, tyre)
      throw err
    } finally {
      setDeletingTyreId(null)
    }
  }, [options])

  return { tyres, loading, error, deletingTyreId, refresh, removeTyre }
}
