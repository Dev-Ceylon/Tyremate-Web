import { useState, useEffect } from "react"
import { bankDetailsService } from "../../../features/master-data/bank-details/services/bankDetailsService"

export interface BankDetail {
  id: number
  bankName: string
  accountNumber: string
  accountName: string
  branch: string
}

export function useBankDetailsLookup() {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchBanks() {
      try {
        setLoading(true)
        const data = await bankDetailsService.getBankDetails()
        if (mounted) {
          const normalized: BankDetail[] = (data as any[]).map((item) => ({
            id: item.id || item.ID,
            bankName: item.bankName || item.BankName || "",
            accountNumber: item.accountNumber || item.AccountNumber || "",
            accountName: item.accountName || item.AccountName || "",
            branch: item.branch || item.Branch || "",
          }))
          setBankDetails(normalized)
        }
      } catch {
        if (mounted) setError("Could not load bank details")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchBanks()
    return () => {
      mounted = false
    }
  }, [])

  return { bankDetails, loading, error }
}
