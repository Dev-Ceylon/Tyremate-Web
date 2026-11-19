import { useState, useCallback, useEffect } from "react"
import { bankDetailsService } from "../services/bankDetailsService"
import type { BankDetailRecord } from "../models/bankDetail"

type UseBankDetailsProps = {
  onDeleteSuccess?: (record: BankDetailRecord) => void
  onDeleteError?: (message: string) => void
}

export function useBankDetails({ onDeleteSuccess, onDeleteError }: UseBankDetailsProps = {}) {
  const [bankDetails, setBankDetails] = useState<BankDetailRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await bankDetailsService.getBankDetails()
      setBankDetails(data)
    } catch (err) {
      console.error("Error fetching bank details:", err)
      setError("Failed to load bank details.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeBankDetail = useCallback(
    async (record: BankDetailRecord) => {
      setDeletingId(record.ID)
      try {
        await bankDetailsService.deleteBankDetail(Number(record.ID))
        onDeleteSuccess?.(record)
        await refresh()
      } catch (err) {
        onDeleteError?.("Failed to delete bank detail.")
        throw err
      } finally {
        setDeletingId(null)
      }
    },
    [onDeleteSuccess, onDeleteError, refresh]
  )

  return { bankDetails, loading, error, deletingId, refresh, removeBankDetail }
}