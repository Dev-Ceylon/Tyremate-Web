import { useCallback, useEffect, useState } from "react"
import type { ContractorRecord } from "../models/contractor"
import { contractorService } from "../services/contractorService"

type UseContractorsOptions = {
  onDeleteSuccess?: (contractor: ContractorRecord) => void
  onDeleteError?: (message: string, contractor: ContractorRecord) => void
}

export function useContractors(options?: UseContractorsOptions) {
  const [contractors, setContractors] = useState<ContractorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingContractorId, setDeletingContractorId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await contractorService.getContractors()
      setContractors(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load contractors"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeContractor = useCallback(async (contractor: ContractorRecord) => {
    setDeletingContractorId(contractor.ID)

    try {
      await contractorService.deleteContractor(contractor.ID)
      setContractors((current) =>
        current.filter((currentContractor) => currentContractor.ID !== contractor.ID)
      )
      options?.onDeleteSuccess?.(contractor)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete contractor"
      options?.onDeleteError?.(message, contractor)
      throw err
    } finally {
      setDeletingContractorId(null)
    }
  }, [options])

  return { contractors, loading, error, deletingContractorId, refresh, removeContractor }
}
