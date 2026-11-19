import { useCallback, useEffect, useState } from "react"
import type { DAGGatePassRecord } from "../models/dagGatePass"
import { dagGatePassService } from "../services/dagGatePassService"

/**
 * Data and busy-state for the DAG gate pass list.
 *
 * Deliberately free of UI concerns - no toasts, no confirmations - so it can be
 * composed by useDAGGatePassActions without the page wiring callbacks. Every
 * action rethrows (normalised to an Error) for its caller to report, which is
 * also why the callbacks below all have stable identities: nothing here closes
 * over an options object that would be redefined on each render.
 */
export function useDAGGatePassList() {
  const [dagGatePasses, setDAGGatePasses] = useState<DAGGatePassRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [arrivedId, setArrivedId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await dagGatePassService.getDAGGatePasses()
      setDAGGatePasses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load DAG gate passes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeDAGGatePass = useCallback(async (dagGatePass: DAGGatePassRecord) => {
    setDeletingId(dagGatePass.ID)

    try {
      await dagGatePassService.deleteDAGGatePass(dagGatePass.ID)
      setDAGGatePasses((current) => current.filter((item) => item.ID !== dagGatePass.ID))
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to delete DAG gate pass")
    } finally {
      setDeletingId(null)
    }
  }, [])

  const sendDAGGatePass = useCallback(
    async (dagGatePass: DAGGatePassRecord, statusCode: string) => {
      setSendingId(dagGatePass.ID)

      try {
        await dagGatePassService.updateDAGStatus(dagGatePass.DAGID, statusCode)
        await refresh()
      } catch (err) {
        throw err instanceof Error ? err : new Error("Failed to update DAG status")
      } finally {
        setSendingId(null)
      }
    },
    [refresh],
  )

  const markDAGGatePassArrived = useCallback(async (dagGatePass: DAGGatePassRecord) => {
    setArrivedId(dagGatePass.ID)

    try {
      await dagGatePassService.markDAGArrived(dagGatePass.DAGID)

      // Re-read the single record rather than refetching the list: only this
      // row's status can have changed, and the toast needs its fresh values.
      const updatedRecord = await dagGatePassService.getDAGGatePassByDAGId(dagGatePass.DAGID)

      setDAGGatePasses((current) =>
        current.map((item) => (item.ID === dagGatePass.ID ? updatedRecord : item)),
      )
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to mark as arrived")
    } finally {
      setArrivedId(null)
    }
  }, [])

  return {
    dagGatePasses,
    loading,
    error,
    deletingId,
    sendingId,
    arrivedId,
    refresh,
    removeDAGGatePass,
    sendDAGGatePass,
    markDAGGatePassArrived,
  }
}
