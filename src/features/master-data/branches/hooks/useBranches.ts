import { useCallback, useEffect, useState } from "react"
import type { BranchRecord } from "../models/branch"
import { branchService } from "../services/branchService"

type UseBranchesOptions = {
  onDeleteSuccess?: (branch: BranchRecord) => void
  onDeleteError?: (message: string, branch: BranchRecord) => void
}

export function useBranches(options?: UseBranchesOptions) {
  const [branches, setBranches] = useState<BranchRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingBranchId, setDeletingBranchId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await branchService.getBranches()
      setBranches(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load branches"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeBranch = useCallback(async (branch: BranchRecord) => {
    setDeletingBranchId(branch.Id)

    try {
      await branchService.deleteBranch(branch.Id)
      setBranches((current) => current.filter((currentBranch) => currentBranch.Id !== branch.Id))
      options?.onDeleteSuccess?.(branch)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete branch"
      options?.onDeleteError?.(message, branch)
      throw err
    } finally {
      setDeletingBranchId(null)
    }
  }, [options])

  return {
    branches,
    loading,
    error,
    deletingBranchId,
    refresh,
    removeBranch,
  }
}
