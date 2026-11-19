import { useCallback, useEffect, useMemo, useState } from "react"
import type { BranchRecord } from "../../master-data/branches/models/branch"
import { branchService } from "../../master-data/branches/services/branchService"
import type { ConsumableLocationRecord } from "../../../shared/models/consumables/consumableLocation"
import { consumableLocationService } from "../../master-data/consumable-locations/services/consumableLocationService"

export function useConsumableManagerPage() {
  const [branches, setBranches] = useState<BranchRecord[]>([])
  const [locations, setLocations] = useState<ConsumableLocationRecord[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.Id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  )

  const loadLocations = useCallback(async (branchId: number) => {
    setLoadingLocations(true)

    try {
      const data = await consumableLocationService.getConsumableLocationsByBranch(branchId)
      setLocations(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load consumable locations for the selected branch"
      setError(message)
      setLocations([])
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
      const message = err instanceof Error ? err.message : "Failed to load branch options"
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
      setLocations([])
      return
    }

    void loadLocations(selectedBranchId)
  }, [loadLocations, selectedBranchId])

  const selectBranch = useCallback((branchId: number | null) => {
    setSelectedBranchId(branchId)
  }, [])

  return {
    branches,
    locations,
    selectedBranch,
    selectedBranchId,
    loading: loadingBranches || loadingLocations,
    loadingBranches,
    loadingLocations,
    error,
    refresh,
    loadLocations,
    selectBranch,
  }
}
