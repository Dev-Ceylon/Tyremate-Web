import { useCallback, useEffect, useState } from "react"
import type { OtherServiceRecord } from "../models/otherService"
import { otherServiceService } from "../services/otherServiceService"

export function useOtherServiceList() {
  const [otherServices, setOtherServices] = useState<OtherServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchOtherServices = useCallback(async () => {
    setLoading(true)
    try {
      const data = await otherServiceService.getAll()
      setOtherServices(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch other services")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOtherServices()
  }, [fetchOtherServices])

  const handleDelete = useCallback(async (osId: number) => {
    if (!window.confirm("Are you sure you want to delete this other service?")) return

    setDeletingId(osId)
    try {
      await otherServiceService.delete(osId)
      setOtherServices((prev) => prev.filter((os) => os.OSID !== osId))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete other service")
    } finally {
      setDeletingId(null)
    }
  }, [])

  return {
    otherServices,
    loading,
    error,
    deletingId,
    refresh: fetchOtherServices,
    handleDelete,
  }
}
