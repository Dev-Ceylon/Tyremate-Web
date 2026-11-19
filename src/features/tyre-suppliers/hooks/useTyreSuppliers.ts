import { useEffect, useState } from "react"
import { tyreSupplierService } from "../services/tyreSupplierService"
import type { TyreSupplier } from "../models/tyreSupplier"

interface UseTyreSuppliersReturn {
  suppliers: TyreSupplier[]
  loading: boolean
  error: string | null
}

export function useTyreSuppliers(tyreId: string | number | null): UseTyreSuppliersReturn {
  const [suppliers, setSuppliers] = useState<TyreSupplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tyreId) {
      setSuppliers([])
      setError(null)
      return
    }

    const fetchSuppliers = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await tyreSupplierService.getSuppliers(tyreId)
        setSuppliers(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch suppliers"
        setError(message)
        setSuppliers([])
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliers()
  }, [tyreId])

  return { suppliers, loading, error }
}
