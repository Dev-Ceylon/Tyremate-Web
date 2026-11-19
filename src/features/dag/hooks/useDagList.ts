import { useCallback, useEffect, useState } from "react"
import type { DagRecord } from "../models/dag"
import { dagService } from "../services/dagService"

type UseDagListOptions = {
  onDeleteSuccess?: (dag: DagRecord) => void
  onDeleteError?: (message: string, dag: DagRecord) => void
  onIssueSuccess?: (dag: DagRecord) => void
  onIssueError?: (message: string, dag: DagRecord) => void
}

export function useDagList(options?: UseDagListOptions) {
  const [dags, setDags] = useState<DagRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingDagId, setDeletingDagId] = useState<number | null>(null)
  const [issuingId, setIssuingId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await dagService.getDAGs()
      setDags(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load DAG records"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeDAG = useCallback(async (dag: DagRecord) => {
    setDeletingDagId(dag.ID)

    try {
      await dagService.deleteDAG(dag.ID)
      setDags((current) => current.filter((currentDag) => currentDag.ID !== dag.ID))
      options?.onDeleteSuccess?.(dag)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete DAG"
      options?.onDeleteError?.(message, dag)
      throw err
    } finally {
      setDeletingDagId(null)
    }
  }, [options])

  // The contractor is not passed in: the service derives it from the approved
  // allocation so a gate pass can never be issued against an unapproved
  // contractor, whichever entry point triggered it.
  const issueGatePass = useCallback(async (dag: DagRecord) => {
    setIssuingId(dag.ID)
    try {
      // This calls the renderer-side dagService
      await dagService.issueGatePass(dag.ID)
      await refresh()
      options?.onIssueSuccess?.(dag)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to issue gate pass"
      options?.onIssueError?.(message, dag)
      throw err
    } finally {
      setIssuingId(null)
    }
  }, [refresh, options])

  return {
    dags,
    loading,
    error,
    deletingDagId,
    issuingId,
    refresh,
    removeDAG,
    issueGatePass,
  }
}
