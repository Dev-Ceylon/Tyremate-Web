import { useCallback, useEffect, useMemo, useState } from "react"
import type { BranchRecord } from "../../master-data/branches/models/branch"
import { branchService } from "../../master-data/branches/services/branchService"
import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"
import { storageLocationService } from "../../master-data/storage-locations/services/storageLocationService"

export function useStorageManagerPage() {
  const [branches, setBranches] = useState<BranchRecord[]>([])
  const [storageLocations, setStorageLocations] = useState<StorageLocationRecord[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.Id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  )

  const loadStorageLocations = useCallback(async (branchId: number) => {
    setLoadingLocations(true)

    try {
      const data = await storageLocationService.getStorageLocationsByBranch(branchId)
      setStorageLocations(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load storage locations for the selected branch"
      setError(message)
      setStorageLocations([])
    } finally {
      setLoadingLocations(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoadingBranches(true)
    setError(null)

    try {
      const branchData = await branchService.getBranches()
      setBranches(branchData)
      setSelectedBranchId((current) => current ?? branchData[0]?.Id ?? null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load storage manager options"
      setError(message)
    } finally {
      setLoadingBranches(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (selectedBranchId === null) {
      setStorageLocations([])
      return
    }

    void loadStorageLocations(selectedBranchId)
  }, [loadStorageLocations, selectedBranchId])

  const selectBranch = useCallback((branchId: number | null) => {
    setSelectedBranchId(branchId)
  }, [])

  return {
    branches,
    storageLocations,
    selectedBranch,
    selectedBranchId,
    loading: loadingBranches || loadingLocations,
    loadingBranches,
    loadingLocations,
    error,
    refresh,
    loadStorageLocations,
    selectBranch,
  }
}
